import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Stages table (Parvularia, Básica, Media)
export const stages = sqliteTable('stages', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  order: integer('order').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Grades table (Prekinder to 4to Medio)
export const grades = sqliteTable('grades', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  stageId: text('stage_id').notNull().references(() => stages.id),
  order: integer('order').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  gradeId: text('grade_id').references(() => grades.id),
  guardianName: text('guardian_name').notNull(),
  guardianPhone: text('guardian_phone').notNull(),
  guardianEmail: text('guardian_email'),
  preferredLanguage: text('preferred_language').default('es'),
  enrollmentDate: text('enrollment_date').notNull(),
  status: text('status').default('active'),
  awsCollectionId: text('aws_collection_id').default('eduguard-school-default'),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const studentFaces = sqliteTable('student_faces', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  faceId: text('face_id').notNull(),
  photoUrl: text('photo_url'),
  indexedAt: text('indexed_at').notNull(),
  qualityScore: real('quality_score'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type StudentFace = typeof studentFaces.$inferSelect;
export type NewStudentFace = typeof studentFaces.$inferInsert;
