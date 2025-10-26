-- Migration: Add grade_sections table and attendance drilldown features

-- Grade Sections table (Homeroom sections like "4° Básico A", "1° Medio B")
CREATE TABLE `grade_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`grade_id` text NOT NULL,
	`label` text NOT NULL,
	`display_name` text NOT NULL,
	`academic_year` text NOT NULL,
	`homeroom_teacher_id` text,
	`max_students` integer,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint

-- Add unique constraint on grade_sections (grade_id, label, academic_year)
CREATE UNIQUE INDEX `idx_grade_sections_unique` ON `grade_sections`(`grade_id`, `label`, `academic_year`);
--> statement-breakpoint

-- Add indices for grade_sections
CREATE INDEX `idx_grade_sections_grade` ON `grade_sections`(`grade_id`);
--> statement-breakpoint
CREATE INDEX `idx_grade_sections_academic_year` ON `grade_sections`(`academic_year`);
--> statement-breakpoint
CREATE INDEX `idx_grade_sections_teacher` ON `grade_sections`(`homeroom_teacher_id`);
--> statement-breakpoint

-- Add grade_section_id column to students table
ALTER TABLE `students` ADD COLUMN `grade_section_id` text REFERENCES `grade_sections`(`id`);
--> statement-breakpoint

-- Add academic_year column to students table
ALTER TABLE `students` ADD COLUMN `academic_year` text;
--> statement-breakpoint

-- Add index for student grade_section lookups
CREATE INDEX `idx_students_grade_section` ON `students`(`grade_section_id`);
--> statement-breakpoint

-- Add correctedAt and correctedBy columns to attendance table for tracking overrides
ALTER TABLE `attendance` ADD COLUMN `corrected_at` text;
--> statement-breakpoint
ALTER TABLE `attendance` ADD COLUMN `corrected_by` text;
--> statement-breakpoint

-- Add composite index for class_enrollments (class_id, student_id) for faster lookups
CREATE INDEX `idx_enrollments_class_student` ON `class_enrollments`(`class_id`, `student_id`);
--> statement-breakpoint

-- Add composite index for attendance (student_id, session_id) for faster lookups
CREATE INDEX `idx_attendance_student_session` ON `attendance`(`student_id`, `session_id`);
--> statement-breakpoint

-- Backfill: Create default grade sections for existing grades
-- This creates one section "A" for each existing grade for academic year 2024-2025
INSERT INTO `grade_sections` (`id`, `grade_id`, `label`, `display_name`, `academic_year`, `status`)
SELECT 
  'gs-' || `id` || '-a-2024',
  `id`,
  'A',
  `display_name` || ' A',
  '2024-2025',
  'active'
FROM `grades`;
--> statement-breakpoint

-- Backfill: Assign existing students to their grade's default section
UPDATE `students` 
SET 
  `grade_section_id` = 'gs-' || `grade_id` || '-a-2024',
  `academic_year` = '2024-2025'
WHERE `grade_id` IS NOT NULL;

