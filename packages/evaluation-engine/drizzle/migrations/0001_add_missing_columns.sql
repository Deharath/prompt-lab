-- Create a new table with the correct schema and migrate data
CREATE TABLE IF NOT EXISTS `jobs_new` (
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

-- Copy existing data from old table to new table, providing defaults for missing columns
INSERT INTO `jobs_new` (
	id, prompt, provider, model, status, result, error_message, created_at,
	template, input_data, error_type, tokens_used, cost_usd, temperature, 
	top_p, max_tokens, selected_metrics, attempt_count, max_attempts, updated_at, metrics
)
SELECT 
	id, prompt, provider, model, status, result, error_message, created_at,
	NULL as template, NULL as input_data, NULL as error_type, NULL as tokens_used, 
	NULL as cost_usd, NULL as temperature, NULL as top_p, NULL as max_tokens, 
	NULL as selected_metrics, 1 as attempt_count, 3 as max_attempts, 
	created_at as updated_at, NULL as metrics
FROM `jobs`;

-- Drop the old table
DROP TABLE `jobs`;

-- Rename the new table to the original name
ALTER TABLE `jobs_new` RENAME TO `jobs`;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS `jobs_status_idx` ON `jobs` (`status`);
CREATE INDEX IF NOT EXISTS `jobs_created_at_idx` ON `jobs` (`created_at`);
CREATE INDEX IF NOT EXISTS `jobs_provider_model_idx` ON `jobs` (`provider`,`model`);