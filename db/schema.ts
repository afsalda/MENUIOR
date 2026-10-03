import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const menuState = sqliteTable("menu_state", {
  id: integer("id").primaryKey(),
  document: text("document").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const dishViews = sqliteTable(
  "dish_views",
  {
    eventId: text("event_id").primaryKey(),
    itemId: text("item_id").notNull(),
    day: text("day").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_dish_views_day_item").on(table.day, table.itemId)],
);
