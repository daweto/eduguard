-- Migration: Add teachers, courses, classrooms, classes, enrollments, sessions, and attendance tables

-- Teachers table
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`second_last_name` text,
	`email` text NOT NULL UNIQUE,
	`phone` text,
	`subjects` text,
	`department` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Classrooms table
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`building` text,
	`floor` text,
	`capacity` integer,
	`room_type` text DEFAULT 'classroom',
	`facilities` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Courses table (course templates/definitions)
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`course_code` text NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`grade_level` text,
	`credits` real,
	`description` text,
	`prerequisites` text,
	`department` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Classes table (specific class sections)
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section` text NOT NULL,
	`teacher_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`period` integer NOT NULL,
	`schedule_day` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`academic_year` text,
	`semester` text,
	`max_students` integer,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Class enrollments (many-to-many: students <-> classes)
CREATE TABLE `class_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`student_id` text NOT NULL,
	`enrolled_date` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Sessions table (attendance sessions)
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`expected_students` integer,
	`present_count` integer,
	`absent_count` integer,
	`photo_urls` text,
	`aws_faces_detected` integer,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Attendance records (individual student attendance per session)
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text NOT NULL,
	`class_id` text NOT NULL,
	`classroom_id` text,
	`status` text NOT NULL,
	`confidence` real,
	`face_id` text,
	`marked_at` text,
	`marked_by` text,
	`corrected` integer DEFAULT 0,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

-- Indexes for performance
CREATE INDEX `idx_classes_teacher` ON `classes`(`teacher_id`);
--> statement-breakpoint
CREATE INDEX `idx_classes_course` ON `classes`(`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_classes_classroom` ON `classes`(`classroom_id`);
--> statement-breakpoint
CREATE INDEX `idx_classes_period` ON `classes`(`period`, `schedule_day`);
--> statement-breakpoint
CREATE INDEX `idx_enrollments_class` ON `class_enrollments`(`class_id`);
--> statement-breakpoint
CREATE INDEX `idx_enrollments_student` ON `class_enrollments`(`student_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_class` ON `sessions`(`class_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_teacher` ON `sessions`(`teacher_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_date` ON `sessions`(`timestamp`);
--> statement-breakpoint
CREATE INDEX `idx_attendance_student` ON `attendance`(`student_id`);
--> statement-breakpoint
CREATE INDEX `idx_attendance_session` ON `attendance`(`session_id`);
--> statement-breakpoint
CREATE INDEX `idx_attendance_class` ON `attendance`(`class_id`);
--> statement-breakpoint
CREATE INDEX `idx_attendance_date` ON `attendance`(`marked_at`);

