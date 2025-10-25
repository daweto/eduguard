import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Stages table (Parvularia, Básica, Media)
export const stages = sqliteTable("stages", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  order: integer("order").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Grades table (Prekinder to 4to Medio)
export const grades = sqliteTable("grades", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  stageId: text("stage_id")
    .notNull()
    .references(() => stages.id),
  order: integer("order").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Legal guardians table
export const legalGuardians = sqliteTable("legal_guardians", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name"),
  identificationNumber: text("identification_number").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  preferredLanguage: text("preferred_language").default("es"),
  relation: text("relation"),
  address: text("address"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name"),
  identificationNumber: text("identification_number").notNull().unique(),
  gradeId: text("grade_id").references(() => grades.id),
  guardianId: text("guardian_id")
    .notNull()
    .references(() => legalGuardians.id),
  enrollmentDate: text("enrollment_date").notNull(),
  status: text("status").default("active"),
  awsCollectionId: text("aws_collection_id").default("eduguard-school-default"),
  metadata: text("metadata"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const studentFaces = sqliteTable("student_faces", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  faceId: text("face_id").notNull(),
  photoUrl: text("photo_url"),
  indexedAt: text("indexed_at").notNull(),
  qualityScore: real("quality_score"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
export type LegalGuardian = typeof legalGuardians.$inferSelect;
export type NewLegalGuardian = typeof legalGuardians.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type StudentFace = typeof studentFaces.$inferSelect;
export type NewStudentFace = typeof studentFaces.$inferInsert;
