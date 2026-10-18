import type { MenuData } from "../types";
import { defaultSettings, menuoirSettings } from "../config/restaurant.config";
import { normalizeItems } from "./menu";
import { isVercelDeployment } from "../config/owner-studio";
export type LiveMenu = MenuData & { revision: number };

const demoKey = "menure:fress-trees:demo-admin-menu";
const demoViewsKey = "menure:fress-trees:demo-admin-views";
async function readDemoMenu(): Promise<LiveMenu> {
  const saved = localStorage.getItem(demoKey);
  if (saved) {
    const menu = JSON.parse(saved) as LiveMenu;
    const settings = menuoirSettings({ ...defaultSettings, ...menu.settings });
    const updated = { ...menu, settings };
    if (
      settings.name !== menu.settings?.name ||
      settings.wordmark !== menu.settings?.wordmark ||
      settings.menu_eyebrow !== menu.settings?.menu_eyebrow ||
      settings.facebook_name !== menu.settings?.facebook_name
    )
      localStorage.setItem(demoKey, JSON.stringify(updated));
    return updated;
  }
  const bundled = await fetch(`${import.meta.env.BASE_URL}menu.json`, {
    cache: "no-store",
  }).then((r) => r.json());
  const menu: LiveMenu = {
    items: normalizeItems(bundled.items),
    settings: { ...defaultSettings, ...bundled.settings },
    revision: 0,
    updatedAt: Date.now(),
  };
  localStorage.setItem(demoKey, JSON.stringify(menu));
  return menu;
}
function saveDemoMenu(menu: LiveMenu) {
  const next = { ...menu, revision: menu.revision + 1, updatedAt: Date.now() };
  localStorage.setItem(demoKey, JSON.stringify(next));
  return next;
}
async function demoRequest<T>(path: string, method: string, data?: any) {
  if (path === "/api/session") return { owner: true, signedIn: true } as T;
  if (path === "/api/admin/menu") return (await readDemoMenu()) as T;
  if (path === "/api/admin/analytics")
    return {
      dishes: JSON.parse(localStorage.getItem(demoViewsKey) || "[]"),
      daily: [],
      since: Date.now() - 30 * 86400000,
    } as T;
  const menu = await readDemoMenu();
  if (path === "/api/admin/settings" && method === "PATCH")
    return saveDemoMenu({ ...menu, settings: data.settings }) as T;
  if (path === "/api/admin/items" && method === "POST")
    return saveDemoMenu({ ...menu, items: [...menu.items, data.item] }) as T;
  const match = path.match(/^\/api\/admin\/items\/(.+)$/);
  if (match && method === "PATCH") {
    const id = decodeURIComponent(match[1]);
    return saveDemoMenu({
      ...menu,
      items: menu.items.map((item) => (item.id === id ? data.item : item)),
    }) as T;
  }
  throw new Error("Demo action is unavailable");
}
export async function adminRequest<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  if (isVercelDeployment()) return demoRequest<T>(path, method, data);
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The owner service is unavailable. Please reconnect and try again.",
    );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "Changes could not be saved. Please try again.",
    );
  return result as T;
}
export async function uploadPhoto(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Choose a JPG, PNG or WebP photo up to 5 MB.");
  if (isVercelDeployment()) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(new Error("Photo upload failed. Please try again."));
      reader.readAsDataURL(file);
    });
  }
  const response = await fetch("/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Photo upload failed. Please try again.");
  return result.url;
}
