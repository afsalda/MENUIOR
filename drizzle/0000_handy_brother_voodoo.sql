CREATE TABLE `dish_views` (
	`event_id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dish_views_day_item` ON `dish_views` (`day`,`item_id`);--> statement-breakpoint
CREATE TABLE `menu_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
