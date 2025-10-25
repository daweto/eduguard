-- Initial schema for EduGuard with Chilean school system

-- Stages table (Preschool, Elementary, Secondary)
CREATE TABLE `stages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL UNIQUE,
	`display_name` text NOT NULL,
	`order` integer NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Grades table (Prekinder through 4to Medio)
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL UNIQUE,
	`display_name` text NOT NULL,
	`stage_id` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Legal guardians table
CREATE TABLE `legal_guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`preferred_language` text DEFAULT 'es',
	`relation` text,
	`address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Students table
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text,
	`grade_id` text,
	`guardian_id` text NOT NULL,
	`guardian_name` text NOT NULL,
	`guardian_phone` text NOT NULL,
	`guardian_email` text,
	`preferred_language` text DEFAULT 'es',
	`enrollment_date` text NOT NULL,
	`status` text DEFAULT 'active',
	`aws_collection_id` text DEFAULT 'eduguard-school-default',
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`guardian_id`) REFERENCES `legal_guardians`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Student faces table (for face recognition)
CREATE TABLE `student_faces` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`face_id` text NOT NULL,
	`photo_url` text,
	`indexed_at` text NOT NULL,
	`quality_score` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
