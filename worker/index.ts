import { readMenu, saveMenu } from "./data";
import type { Env } from "./types";
import { normalizeItems, parseSettings, safeUrl } from "../src/lib/menu";
import { restaurant } from "../src/config/restaurant.config";
import shell from "virtual:app-shell";

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export function isOwner(request: Request, env: Env) {
  return !!(
    env.ADMIN_EMAIL &&
    request.headers.get("oai-authenticated-user-id") &&
    request.headers.get("oai-authenticated-user-email")?.toLowerCase() ===
      env.ADMIN_EMAIL.toLowerCase()
  );
}
function sameOrigin(request: Request) {
  return (
    request.headers.get("Origin") === new URL(request.url).origin &&
    request.headers.get("Sec-Fetch-Site") !== "cross-site"
  );
}
async function bytes(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("File or changes are too large");
    }
    chunks.push(part.value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Expected JSON");
  return JSON.parse(new TextDecoder().decode(await bytes(request, 200_000)));
}
function validItem(input: unknown, ids: Set<string>) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid dish");
  const item = input as Record<string, unknown>;
  const priceOK = (price: unknown) =>
    typeof price === "number" &&
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 100000 &&
    Math.abs(price * 100 - Math.round(price * 100)) < 0.001;
  if (!priceOK(item.price))
    throw new Error("Enter a valid price, with up to two decimal places");
  if (item.half_price !== undefined && !priceOK(item.half_price))
    throw new Error("Enter a valid half-portion price");
  if (!String(item.name_en || "").trim() || String(item.name_en).length > 160)
    throw new Error("English dish name is required (up to 160 characters)");
  if (!restaurant.categories.some((c) => c.id === item.category))
    throw new Error("Choose a menu category");
  for (const key of ["variants", "addons"]) {
    if (!Array.isArray(item[key]) || item[key].length > 20)
      throw new Error("Too many options");
    const names = new Set<string>();
    for (const option of item[key]) {
      if (
        !option ||
        typeof option.name !== "string" ||
        !option.name.trim() ||
        option.name.length > 80 ||
        !priceOK(option.price) ||
        names.has(option.name.trim())
      )
        throw new Error("Each option needs a unique name and valid price");
      names.add(option.name.trim());
    }
  }
  if (typeof item.available !== "boolean" || typeof item.sold_out !== "boolean")
    throw new Error("Invalid availability");
  if (
    !Array.isArray(item.recommended_with) ||
    item.recommended_with.length > 8 ||
    item.recommended_with.some(
      (id) => typeof id !== "string" || !ids.has(id) || id === item.id,
    )
  )
    throw new Error("Choose up to eight other dishes for suggestions");
  if (item.image && !safeUrl(item.image, true))
    throw new Error("Use a valid photo URL or upload a photo");
  for (const [key, value] of Object.entries(item)) {
    if (
      typeof value === "string" &&
      value.length > (key.startsWith("desc_") ? 2000 : 2048)
    )
      throw new Error("Text is too long");
  }
  const normalized = normalizeItems([item])[0];
  if (!normalized) throw new Error("Invalid dish details");
  return normalized;
}
async function api(request: Request, env: Env) {
  const url = new URL(request.url),
    path = url.pathname;
  if (path === "/api/session" && request.method === "GET")
    return json({
      owner: isOwner(request, env),
      signedIn: !!request.headers.get("oai-authenticated-user-id"),
    });
  if (path.startsWith("/api/admin/")) {
    if (!isOwner(request, env))
      return json(
        { error: "Sign in with the cafe owner’s account to edit this menu." },
        403,
      );
    if (request.method !== "GET" && !sameOrigin(request))
      return json({ error: "Please make changes from this website." }, 403);
  }
  if (path === "/api/menu" && request.method === "GET") {
    const current = await readMenu(env);
    if (url.searchParams.get("revision") === String(current.revision))
      return new Response(null, {
        status: 304,
        headers: { "Cache-Control": "no-store" },
      });
    return json(current);
  }
  if (path === "/api/admin/menu" && request.method === "GET")
    return json(await readMenu(env));
  if (path.startsWith("/api/admin/items/") && request.method === "PATCH") {
    const input = await body(request),
      current = await readMenu(env);
    const id = decodeURIComponent(path.slice("/api/admin/items/".length));
    const index = current.items.findIndex((i) => i.id === id);
    if (index < 0) return json({ error: "Dish not found" }, 404);
    if (input.revision !== current.revision)
      return json(
        {
          error:
            "The menu changed in another session. Reload the latest menu before saving.",
          conflict: true,
        },
        409,
      );
    current.items[index] = validItem(
      { ...input.item, id },
      new Set(current.items.map((i) => i.id)),
    );
    const saved = await saveMenu(env, current, input.revision);
    return saved
      ? json(saved)
      : json(
          {
            error: "Another edit was saved first. Reload and try again.",
            conflict: true,
          },
          409,
        );
  }
  if (path === "/api/admin/items" && request.method === "POST") {
    const input = await body(request),
      current = await readMenu(env);
    if (input.revision !== current.revision)
      return json(
        {
          error: "Reload the latest menu before adding a dish.",
          conflict: true,
        },
        409,
      );
    if (current.items.length >= 250)
      return json({ error: "The menu supports up to 250 dishes." }, 400);
    const id = `dish-${crypto.randomUUID()}`;
    current.items.push(
      validItem({ ...input.item, id }, new Set(current.items.map((i) => i.id))),
    );
    const saved = await saveMenu(env, current, input.revision);
    return saved
      ? json(saved)
      : json(
          {
            error: "Another edit was saved first. Reload and try again.",
            conflict: true,
          },
          409,
        );
  }
  if (path === "/api/admin/settings" && request.method === "PATCH") {
    const input = await body(request),
      current = await readMenu(env);
    if (input.revision !== current.revision)
      return json(
        { error: "Reload the latest settings before saving.", conflict: true },
        409,
      );
    if (
      !input.settings ||
      typeof input.settings !== "object" ||
      Array.isArray(input.settings)
    )
      throw new Error("Invalid settings");
    const raw: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.settings)) {
      if (
        !(key in current.settings) ||
        ["id", "categories", "qr", "theme"].includes(key)
      )
        continue;
      if (
        !["string", "boolean"].includes(typeof value) ||
        String(value).length > 4000
      )
        throw new Error("Invalid setting");
      raw[key] = String(value);
    }
    const parsed = parseSettings([raw]);
    for (const key of Object.keys(raw)) {
      if (
        (key.endsWith("_link") ||
          key.startsWith("release_image_") ||
          ["instagram", "logo_url", "hero_image", "hero_food_image"].includes(
            key,
          )) &&
        raw[key] &&
        !(parsed as Record<string, unknown>)[key]
      )
        throw new Error(`Use a valid URL for ${key.replaceAll("_", " ")}`);
    }
    current.settings = { ...current.settings, ...parsed };
    const saved = await saveMenu(env, current, input.revision);
    return saved
      ? json(saved)
      : json(
          {
            error: "Another edit was saved first. Reload and try again.",
            conflict: true,
          },
          409,
        );
  }
  if (path === "/api/admin/photos" && request.method === "POST") {
    const data = await bytes(request, 5 * 1024 * 1024);
    const mime = request.headers.get("content-type");
    const png =
      data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71;
    const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
    const webp =
      new TextDecoder().decode(data.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(data.slice(8, 12)) === "WEBP";
    if (!(
      (mime === "image/png" && png) ||
      (mime === "image/jpeg" && jpeg) ||
      (mime === "image/webp" && webp)
    ))
      throw new Error("Upload a JPG, PNG or WebP photo up to 5 MB");
    const key = `photos/${crypto.randomUUID()}.${png ? "png" : jpeg ? "jpg" : "webp"}`;
    await env.BUCKET.put(key, data.buffer, {
      httpMetadata: { contentType: mime! },
    });
    return json({ url: `/media/${key}` }, 201);
  }
  if (path === "/api/views" && request.method === "POST") {
    if (!sameOrigin(request)) return json({ error: "Invalid origin" }, 403);
    if (isOwner(request, env)) return json({ recorded: false });
    const input = await body(request);
    if (
      typeof input.eventId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(input.eventId)
    )
      throw new Error("Invalid view");
    const menu = await readMenu(env);
    if (!menu.items.some((i) => i.id === input.itemId && i.available))
      throw new Error("Dish not found");
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await env.DB.prepare(
      "INSERT OR IGNORE INTO dish_views (event_id, item_id, day, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(input.eventId, input.itemId, day, Date.now())
      .run();
    return json({ recorded: true }, 201);
  }
  if (path === "/api/admin/analytics" && request.method === "GET") {
    const since = Date.now() - 30 * 86400000;
    const rows = await env.DB.prepare(
      "SELECT item_id AS itemId, COUNT(*) AS views, MAX(created_at) AS lastViewed FROM dish_views WHERE created_at >= ? GROUP BY item_id ORDER BY views DESC",
    )
      .bind(since)
      .all();
    const daily = await env.DB.prepare(
      "SELECT day, COUNT(*) AS views FROM dish_views WHERE created_at >= ? GROUP BY day ORDER BY day",
    )
      .bind(since)
      .all();
    return json({ dishes: rows.results, daily: daily.results, since });
  }
  return json({ error: "Not found" }, 404);
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return await api(request, env);
      if (
        url.pathname.startsWith("/media/photos/") &&
        request.method === "GET"
      ) {
        const key = url.pathname.slice("/media/".length);
        if (!/^photos\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(key))
          return new Response("Not found", { status: 404 });
        const object = await env.BUCKET.get(key);
        return object
          ? new Response(object.body, {
              headers: {
                "Content-Type":
                  object.httpMetadata?.contentType ||
                  "application/octet-stream",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
              },
            })
          : new Response("Not found", { status: 404 });
      }
      if (url.pathname === "/" || url.pathname === "/index.html")
        return new Response(shell, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      return env.ASSETS
        ? env.ASSETS.fetch(request)
        : new Response("Not found", { status: 404 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      const storage = /D1|SQLITE|database|storage|binding/i.test(message);
      if (storage) console.error("Menu storage request failed");
      return json(
        {
          error: storage
            ? "The menu service is temporarily unavailable. Your changes have not been saved. Please try again."
            : message,
        },
        storage ? 503 : 400,
      );
    }
  },
};
