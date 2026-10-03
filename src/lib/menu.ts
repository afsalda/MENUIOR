import { defaultSettings, restaurant } from "../config/restaurant.config";
import type { Settings } from "../config/restaurant.config";
import type { MenuData, MenuItem, Option, Language, OrderLine } from "../types";

export const cacheKey = `menure:${restaurant.id}:menu:v1`;
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode / quota: keep the app usable. */
  }
}
export function money(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/\.00$/, "");
  } catch {
    return `₹${value}`;
  }
}
export function number(value: unknown): number | undefined {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/(?:₹|rs\.?|inr|,|\s)/gi, "");
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined;
  const result = Number(cleaned);
  return Number.isFinite(result) ? result : undefined;
}
const flag = (value: unknown, fallback: boolean) =>
  String(value ?? "").trim() === ""
    ? fallback
    : /^(true|yes|1)$/i.test(String(value).trim());
const list = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : String(v ?? "")
        .split(/[|;]/)
        .map((x) => x.trim())
        .filter(Boolean);
export function safeUrl(input: unknown, relative = false): string {
  const text = String(input ?? "").trim();
  if (!text) return "";
  if (relative && /^\/media\/photos\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(text))
    return text;
  if (relative && /^(?:\.?\/?brand\/)/.test(text))
    return text.replace(/^\//, "");
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
function options(input: unknown): Option[] {
  let values = input;
  if (typeof input === "string") {
    try {
      values = JSON.parse(input);
    } catch {
      values = input.split("|").map((s) => {
        const [name, price] = s.split(":");
        return { name, price };
      });
    }
  }
  if (!Array.isArray(values)) return [];
  return values.flatMap((v) => {
    const price = number(v?.price);
    return String(v?.name ?? "").trim() && price !== undefined
      ? [{ name: String(v.name).trim(), price }]
      : [];
  });
}
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map((h) => h.toLowerCase().trim()) ?? [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])),
  );
}
export function normalizeItems(rows: Record<string, unknown>[]): MenuItem[] {
  const ids = new Set<string>();
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const v = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]),
    );
    const id = String(v.id ?? "").trim(),
      name = String(v.name_en ?? "").trim(),
      price = number(v.price);
    const categoryRaw = String(v.category ?? "")
      .trim()
      .toLowerCase();
    const category = restaurant.categories.find((c) =>
      [c.id, c.name.toLowerCase()].includes(categoryRaw),
    );
    if (!id || !name || price === undefined || !category || ids.has(id))
      return [];
    ids.add(id);
    const text = (key: string) => String(v[key] ?? "").trim();
    const veg = text("veg_type").toLowerCase();
    const item: MenuItem = {
      id,
      category: category.id,
      name_en: name,
      name_ml: text("name_ml"),
      name_hi: text("name_hi"),
      name_ar: text("name_ar"),
      desc_en: text("desc_en"),
      desc_ml: text("desc_ml"),
      desc_hi: text("desc_hi"),
      desc_ar: text("desc_ar"),
      price,
      half_price: number(v.half_price),
      variants: options(v.variants),
      addons: options(v.addons),
      image: safeUrl(v.image, true),
      veg_type: ["veg", "nonveg", "egg", "vegan", "jain"].includes(veg)
        ? (veg as MenuItem["veg_type"])
        : "nonveg",
      spice: Math.min(3, Math.max(0, Math.round(number(v.spice) ?? 0))),
      tags: list(v.tags).map((t) => t.toLowerCase()),
      allergens: list(v.allergens),
      calories: number(v.calories),
      available: flag(v.available, true),
      sold_out: flag(v.sold_out, false),
      available_from: text("available_from"),
      available_to: text("available_to"),
      recommended_with: list(v.recommended_with),
      serves: text("serves"),
    };
    return [item];
  });
}
export function parseSettings(
  rows: Record<string, string>[],
): Partial<Settings> {
  const raw =
    rows[0] && "key" in rows[0]
      ? Object.fromEntries(
          rows.map((r) => [r.key.trim().toLowerCase(), r.value]),
        )
      : (rows[0] ?? {});
  const result: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      !(key in defaultSettings) ||
      ["id", "categories", "qr", "theme"].includes(key)
    )
      continue;
    if (key === "show_sample_banner" || key === "show_new_release")
      result[key] = flag(value, true);
    else if (
      key.endsWith("_link") ||
      ["instagram", "logo_url", "hero_image", "hero_food_image"].includes(
        key,
      ) ||
      key.startsWith("release_image_")
    )
      result[key] = safeUrl(
        value,
        ["logo_url", "hero_image", "hero_food_image"].includes(key) ||
          key.startsWith("release_image_"),
      );
    else if (key === "currency") {
      if (/^[A-Z]{3}$/.test(value.toUpperCase()))
        result[key] = value.toUpperCase();
    } else if (key === "time_zone") {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value }).format();
        result[key] = value;
      } catch {
        /* Use default */
      }
    } else result[key] = String(value).trim();
  }
  return result as Partial<Settings>;
}
export function localName(item: MenuItem, lang: Language) {
  return item[`name_${lang}`] || item.name_en;
}
export function localDescription(item: MenuItem, lang: Language) {
  return item[`desc_${lang}`] || item.desc_en;
}
export function cachedMenu(): MenuData | null {
  const raw = readStorage<Partial<MenuData> | null>(cacheKey, null);
  if (!raw || !Array.isArray(raw.items)) return null;
  const items = normalizeItems(
    raw.items as unknown as Record<string, unknown>[],
  );
  if (!items.length) return null;
  const settings =
    raw.settings && typeof raw.settings === "object"
      ? parseSettings([
          Object.fromEntries(
            Object.entries(raw.settings).map(([k, v]) => [k, String(v)]),
          ),
        ])
      : {};
  return {
    items,
    settings: { ...defaultSettings, ...settings },
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}
export function availability(
  item: MenuItem,
  now = new Date(),
  timezone = "Asia/Kolkata",
): { ok: boolean; label: string } {
  if (!item.available) return { ok: false, label: "Unavailable" };
  if (item.sold_out) return { ok: false, label: "Back soon" };
  const validTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  if (validTime(item.available_from) && validTime(item.available_to)) {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    const from = item.available_from,
      to = item.available_to;
    const open =
      from === to ||
      (from < to ? time >= from && time < to : time >= from || time < to);
    if (!open) return { ok: false, label: `${from}–${to}` };
  }
  return { ok: true, label: "" };
}
async function fetchText(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("Menu could not be refreshed");
  return response.text();
}
export async function getMenu(
  onData: (data: MenuData) => void,
  refreshOnly = false,
): Promise<"live" | "sample" | "saved"> {
  const cached = cachedMenu();
  if (cached && !refreshOnly) onData(cached);
  try {
    const response = await fetch(
      `/api/menu${refreshOnly && liveRevision !== null ? `?revision=${liveRevision}` : ""}`,
      { cache: "no-store", signal: AbortSignal.timeout(7000) },
    );
    if (response.status === 304) return "live";
    if (
      response.ok &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      const raw = await response.json();
      if (Array.isArray(raw.items) && typeof raw.revision === "number") {
        const data = {
          items: normalizeItems(raw.items),
          settings: { ...defaultSettings, ...raw.settings },
          updatedAt: raw.updatedAt,
        };
        liveRevision = raw.revision;
        writeStorage(cacheKey, data);
        onData(data);
        return "live";
      }
    }
  } catch {
    /* Offline: retain the last confirmed menu. */
  }
  if (!cached && !refreshOnly) {
    const bundled = JSON.parse(
      await fetchText(`${import.meta.env.BASE_URL}menu.json`),
    );
    onData({
      items: normalizeItems(bundled.items),
      settings: { ...defaultSettings, ...bundled.settings },
      updatedAt: 0,
    });
  }
  const itemsURL = import.meta.env.VITE_SHEET_CSV_URL;
  const settingsURL = import.meta.env.VITE_SETTINGS_CSV_URL;
  if (!itemsURL && !settingsURL) return cached ? "saved" : "sample";
  try {
    const [itemsText, settingsText] = await Promise.all([
      itemsURL ? fetchText(itemsURL) : Promise.resolve(""),
      settingsURL ? fetchText(settingsURL) : Promise.resolve(""),
    ]);
    const bundled = itemsText
      ? null
      : JSON.parse(await fetchText(`${import.meta.env.BASE_URL}menu.json`));
    const items = itemsText
      ? normalizeItems(parseCSV(itemsText))
      : normalizeItems(bundled.items);
    if (!items.length) throw new Error("No valid menu items");
    const data = {
      items,
      settings: {
        ...defaultSettings,
        ...(settingsText ? parseSettings(parseCSV(settingsText)) : {}),
      },
      updatedAt: Date.now(),
    };
    writeStorage(cacheKey, data);
    onData(data);
    return "live";
  } catch {
    return cached ? "saved" : "sample";
  }
}
let liveRevision: number | null = null;
// A feed refresh must also update already-selected option prices.
export function currentLinePrice(
  line: OrderLine,
  item?: MenuItem,
): number | null {
  if (!item) return null;
  let base = item.price;
  if (item.variants.length) {
    const option = item.variants.find((v) => v.name === line.variant);
    if (!option) return null;
    base = option.price;
  } else if (line.variant === "Half" && item.half_price !== undefined)
    base = item.half_price;
  else if (
    line.variant &&
    !(line.variant === "Full" && item.half_price !== undefined)
  )
    return null;
  for (const name of line.addons) {
    const addon = item.addons.find((a) => a.name === name);
    if (!addon) return null;
    base += addon.price;
  }
  return base;
}
export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
export function orderMessage(
  lines: OrderLine[],
  name: string,
  table: string,
  notes: string,
  currency = "INR",
) {
  return [
    `Hello ${name}, I’d like to request this order.`,
    table ? `Table: ${table}` : "Table: please confirm",
    "",
    ...lines.map(
      (l) =>
        `${l.qty} × ${l.name}${l.variant ? ` (${l.variant})` : ""}${l.addons.length ? ` + ${l.addons.join(", ")}` : ""} — ${money(l.price * l.qty, currency)}`,
    ),
    "",
    `Menu subtotal: ${money(
      lines.reduce((n, l) => n + l.price * l.qty, 0),
      currency,
    )}`,
    notes.trim() ? `Notes: ${notes.trim()}` : "",
    "Please confirm availability, final prices and taxes.",
  ]
    .filter(Boolean)
    .join("\n");
}
