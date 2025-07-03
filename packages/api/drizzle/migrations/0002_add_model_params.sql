ALTER TABLE `jobs` ADD `temperature` real;--> statement-breakpoint
ALTER TABLE `jobs` ADD `top_p` real;--> statement-breakpoint
ALTER TABLE `jobs` ADD `max_tokens` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `selected_metrics` text;
