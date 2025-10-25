-- Migration: Add stages and grades tables for Chilean school system

-- Create stages table
CREATE TABLE IF NOT EXISTS `stages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`order` integer NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS `stages_name_unique` ON `stages` (`name`);

-- Create grades table
CREATE TABLE IF NOT EXISTS `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`stage_id` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `grades_name_unique` ON `grades` (`name`);

-- Add grade_id column to students table
ALTER TABLE `students` ADD COLUMN `grade_id` text REFERENCES `grades`(`id`);

-- Drop the old grade column (SQLite doesn't support direct column drop, so we'll keep both for now)
-- Users can manually migrate data from grade to grade_id later
