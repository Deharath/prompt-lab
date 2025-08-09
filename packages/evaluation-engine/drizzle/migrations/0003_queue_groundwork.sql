ALTER TABLE `jobs` ADD COLUMN `claimed_at` integer;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `worker_id` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `cancel_requested` integer DEFAULT 0;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_claimed_at_idx` ON `jobs` (`claimed_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_cancel_requested_idx` ON `jobs` (`cancel_requested`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_status_claimed_idx` ON `jobs` (`status`,`claimed_at`);
