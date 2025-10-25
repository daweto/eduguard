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

-- Students table
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text,
	`grade_id` text,
	`guardian_name` text NOT NULL,
	`guardian_phone` text NOT NULL,
	`guardian_email` text,
	`preferred_language` text DEFAULT 'es',
	`enrollment_date` text NOT NULL,
	`status` text DEFAULT 'active',
	`aws_collection_id` text DEFAULT 'eduguard-school-default',
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE set null
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
--> statement-breakpoint

-- Seed stages (Chilean school system)
INSERT OR IGNORE INTO stages (id, name, display_name, `order`, description) VALUES
('preschool', 'preschool', 'Educación Parvularia', 1, 'Preschool education level (Prekinder and Kinder)'),
('elementary', 'elementary', 'Enseñanza Básica', 2, 'Elementary education from 1st to 8th grade'),
('secondary', 'secondary', 'Enseñanza Media', 3, 'Secondary education from 1st to 4th year');
--> statement-breakpoint

-- Seed grades - Preschool
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('prekinder', 'prekinder', 'Prekinder', 'preschool', 1),
('kinder', 'kinder', 'Kinder', 'preschool', 2);
--> statement-breakpoint

-- Seed grades - Elementary
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('1st-elementary', '1st-elementary', '1° Básico', 'elementary', 3),
('2nd-elementary', '2nd-elementary', '2° Básico', 'elementary', 4),
('3rd-elementary', '3rd-elementary', '3° Básico', 'elementary', 5),
('4th-elementary', '4th-elementary', '4° Básico', 'elementary', 6),
('5th-elementary', '5th-elementary', '5° Básico', 'elementary', 7),
('6th-elementary', '6th-elementary', '6° Básico', 'elementary', 8),
('7th-elementary', '7th-elementary', '7° Básico', 'elementary', 9),
('8th-elementary', '8th-elementary', '8° Básico', 'elementary', 10);
--> statement-breakpoint

-- Seed grades - Secondary
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('1st-secondary', '1st-secondary', '1° Medio', 'secondary', 11),
('2nd-secondary', '2nd-secondary', '2° Medio', 'secondary', 12),
('3rd-secondary', '3rd-secondary', '3° Medio', 'secondary', 13),
('4th-secondary', '4th-secondary', '4° Medio', 'secondary', 14);
