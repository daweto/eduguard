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

// Grade Sections table (Homeroom sections like "4° Básico A", "1° Medio B")
export const gradeSections = sqliteTable("grade_sections", {
  id: text("id").primaryKey(),
  gradeId: text("grade_id")
    .notNull()
    .references(() => grades.id),
  label: text("label").notNull(), // "A", "B", "C", etc.
  displayName: text("display_name").notNull(), // "4° Básico A"
  academicYear: text("academic_year").notNull(), // "2024-2025"
  homeroomTeacherId: text("homeroom_teacher_id").references(() => teachers.id),
  maxStudents: integer("max_students"),
  status: text("status").default("active"), // 'active' | 'archived'
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
  gradeSectionId: text("grade_section_id").references(() => gradeSections.id),
  guardianId: text("guardian_id")
    .notNull()
    .references(() => legalGuardians.id),
  enrollmentDate: text("enrollment_date").notNull(),
  academicYear: text("academic_year"), // "2024-2025"
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
  externalImageId: text("external_image_id").unique(), // Predictable ID for AWS Rekognition
  photoUrl: text("photo_url"),
  indexedAt: text("indexed_at").notNull(),
  qualityScore: real("quality_score"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Teachers table
export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  subjects: text("subjects"), // Comma-separated subjects taught
  department: text("department"),
  status: text("status").default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Classrooms table
export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g., "A1", "C2", "Science Lab 3"
  building: text("building"),
  floor: text("floor"),
  capacity: integer("capacity"),
  roomType: text("room_type").default("classroom"), // 'classroom' | 'lab' | 'library' | 'gym' | 'auditorium'
  facilities: text("facilities"), // Comma-separated: "projector,whiteboard,computers"
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Courses table (course templates/definitions)
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  courseCode: text("course_code").notNull(), // e.g., "MATH101", "ENG201"
  name: text("name").notNull(), // e.g., "Introduction to Algebra"
  subject: text("subject").notNull(), // e.g., "Math", "English", "Science"
  gradeLevel: text("grade_level"), // e.g., "10th", "11th", "1st-secondary"
  credits: real("credits"), // e.g., 1.0, 0.5
  description: text("description"),
  prerequisites: text("prerequisites"), // Comma-separated course codes
  department: text("department"),
  status: text("status").default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Classes table (specific class sections)
export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  section: text("section").notNull(), // e.g., "A", "B", "1", "2"
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  period: integer("period").notNull(), // 1-8 typically
  scheduleDay: text("schedule_day").notNull(), // Day of week or "daily"
  startTime: text("start_time"), // e.g., "08:00"
  endTime: text("end_time"), // e.g., "08:50"
  academicYear: text("academic_year"), // e.g., "2024-2025"
  semester: text("semester"), // e.g., "Fall", "Spring", "Full Year"
  maxStudents: integer("max_students"),
  status: text("status").default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Class enrollments (many-to-many: students <-> classes)
export const classEnrollments = sqliteTable("class_enrollments", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  enrolledDate: text("enrolled_date"),
  status: text("status").default("active"), // 'active' | 'dropped' | 'completed'
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Sessions table (attendance sessions)
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  timestamp: text("timestamp").notNull(),
  expectedStudents: integer("expected_students"),
  presentCount: integer("present_count"),
  absentCount: integer("absent_count"),
  photoUrls: text("photo_urls"), // JSON array of photo URLs
  awsFacesDetected: integer("aws_faces_detected"),
  metadata: text("metadata"), // JSON
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Attendance records (individual student attendance per session)
export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id), // Denormalized for quick queries
  classroomId: text("classroom_id").references(() => classrooms.id), // Denormalized for location context
  status: text("status").notNull(), // 'present' | 'absent' | 'excused' | 'late'
  confidence: real("confidence"), // AWS Rekognition confidence score (0-100)
  faceId: text("face_id"), // AWS Face ID if detected
  markedAt: text("marked_at"),
  markedBy: text("marked_by"), // 'auto' | teacher_id
  corrected: integer("corrected", { mode: "boolean" }).default(false),
  correctedAt: text("corrected_at"), // When was it corrected
  correctedBy: text("corrected_by"), // Teacher ID who corrected
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
export type GradeSection = typeof gradeSections.$inferSelect;
export type NewGradeSection = typeof gradeSections.$inferInsert;
export type LegalGuardian = typeof legalGuardians.$inferSelect;
export type NewLegalGuardian = typeof legalGuardians.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type StudentFace = typeof studentFaces.$inferSelect;
export type NewStudentFace = typeof studentFaces.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type Classroom = typeof classrooms.$inferSelect;
export type NewClassroom = typeof classrooms.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type NewClassEnrollment = typeof classEnrollments.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

// Calls table (voice calls to guardians)
export const calls = sqliteTable("calls", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  guardianId: text("guardian_id")
    .notNull()
    .references(() => legalGuardians.id),
  guardianPhone: text("guardian_phone").notNull(),
  sessionId: text("session_id").references(() => sessions.id),
  classId: text("class_id").references(() => classes.id),
  initiatedBy: text("initiated_by").notNull(), // 'manual' | 'reasoning-auto'
  riskLevel: text("risk_level"), // 'none' | 'low' | 'medium' | 'high'
  status: text("status").notNull().default("initiated"), // 'initiated' | 'ringing' | 'answered' | 'voicemail' | 'failed' | 'completed'
  dtmfResponse: text("dtmf_response"),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  duration: integer("duration"), // in seconds
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Reasoning analyses table (AI risk assessments)
export const reasoningAnalyses = sqliteTable("reasoning_analyses", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  riskScore: integer("risk_score").notNull(), // 0-100
  riskLabel: text("risk_label").notNull(), // 'none' | 'low' | 'medium' | 'high'
  patternType: text("pattern_type"), // 'normal' | 'sneak_out' | 'chronic' | 'irregular'
  summary: text("summary").notNull(),
  recommendation: text("recommendation").notNull(), // 'none' | 'monitor' | 'immediate_call'
  reasoning: text("reasoning"),
  confidence: real("confidence"), // 0-1
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type ReasoningAnalysis = typeof reasoningAnalyses.$inferSelect;
export type NewReasoningAnalysis = typeof reasoningAnalyses.$inferInsert;

// Agent decision logs
export const agentLogs = sqliteTable("agent_logs", {
  id: text("id").primaryKey(),
  agent: text("agent").notNull(), // 'vision' | 'reasoning' | 'voice'
  decisionType: text("decision_type").notNull(), // 'score' | 'auto_call' | 'skip_call' | 'manual_call'
  sessionId: text("session_id").references(() => sessions.id),
  studentId: text("student_id").references(() => students.id),
  callId: text("call_id").references(() => calls.id),
  details: text("details"), // JSON string
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;
