CREATE TABLE IF NOT EXISTS `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`template` text,
	`input_data` text,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`metrics` text,
	`error_message` text,
	`error_type` text,
	`tokens_used` integer,
	`cost_usd` real,
	`temperature` real,
	`top_p` real,
	`max_tokens` integer,
	`selected_metrics` text,
	`attempt_count` integer DEFAULT 1 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_created_at_idx` ON `jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_provider_model_idx` ON `jobs` (`provider`,`model`);