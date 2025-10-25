-- EduGuard Database Schema for D1

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  preferred_language TEXT DEFAULT 'es',
  enrollment_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  aws_collection_id TEXT DEFAULT 'eduguard-school-default',
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);

-- Student faces table (for AWS Rekognition face IDs)
CREATE TABLE IF NOT EXISTS student_faces (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  face_id TEXT NOT NULL,
  photo_url TEXT,
  indexed_at TEXT NOT NULL,
  quality_score REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_faces_student ON student_faces(student_id);
CREATE INDEX IF NOT EXISTS idx_faces_faceid ON student_faces(face_id);
