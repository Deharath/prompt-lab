-- Add the missing columns that are causing errors
-- These are the columns present in schema but missing from production DB

ALTER TABLE `jobs` ADD COLUMN `error_type` text;
ALTER TABLE `jobs` ADD COLUMN `attempt_count` integer DEFAULT 1 NOT NULL;
ALTER TABLE `jobs` ADD COLUMN `max_attempts` integer DEFAULT 3 NOT NULL;

-- Update existing rows to have proper defaults for the new NOT NULL columns
UPDATE `jobs` SET 
  `attempt_count` = 1,
  `max_attempts` = 3
WHERE `attempt_count` IS NULL OR `max_attempts` IS NULL;