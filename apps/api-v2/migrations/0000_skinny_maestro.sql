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
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text,
	`guardian_name` text NOT NULL,
	`guardian_phone` text NOT NULL,
	`guardian_email` text,
	`preferred_language` text DEFAULT 'es',
	`enrollment_date` text NOT NULL,
	`status` text DEFAULT 'active',
	`aws_collection_id` text DEFAULT 'eduguard-school-default',
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
