import bundled from "../public/menu.json";
import { defaultSettings } from "../src/config/restaurant.config";
import { normalizeItems } from "../src/lib/menu";
import type { MenuData } from "../src/types";
import type { Env } from "./types";
export type LiveMenu = MenuData & { revision: number };
type Row = { document: string; revision: number; updated_at: number };
export async function readMenu(env: Env): Promise<LiveMenu> {
  let row = await env.DB.prepare(
    "SELECT document, revision, updated_at FROM menu_state WHERE id = 1",
  ).first<Row>();
  if (!row) {
    const initial = {
      items: normalizeItems(bundled.items),
      settings: { ...defaultSettings, ...bundled.settings },
    };
    await env.DB.prepare(
      "INSERT OR IGNORE INTO menu_state (id, document, revision, updated_at) VALUES (1, ?, 0, ?)",
    )
      .bind(JSON.stringify(initial), Date.now())
      .run();
    row = await env.DB.prepare(
      "SELECT document, revision, updated_at FROM menu_state WHERE id = 1",
    ).first<Row>();
  }
  if (!row) throw new Error("Menu storage unavailable");
  return {
    ...JSON.parse(row.document),
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}
export async function saveMenu(
  env: Env,
  menu: LiveMenu,
  revision: number,
): Promise<LiveMenu | null> {
  const updatedAt = Date.now();
  const result = await env.DB.prepare(
    "UPDATE menu_state SET document = ?, revision = revision + 1, updated_at = ? WHERE id = 1 AND revision = ?",
  )
    .bind(
      JSON.stringify({ items: menu.items, settings: menu.settings }),
      updatedAt,
      revision,
    )
    .run();
  return result.meta.changes === 1
    ? { ...menu, revision: revision + 1, updatedAt }
    : null;
}
