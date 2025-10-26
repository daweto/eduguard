-- Add calls table for tracking voice calls to guardians
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  guardian_id TEXT NOT NULL REFERENCES legal_guardians(id),
  guardian_phone TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  class_id TEXT REFERENCES classes(id),
  initiated_by TEXT NOT NULL, -- 'manual' | 'reasoning-auto'
  risk_level TEXT, -- 'none' | 'low' | 'medium' | 'high'
  status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated' | 'ringing' | 'answered' | 'voicemail' | 'failed' | 'completed'
  dtmf_response TEXT, -- DTMF input from parent if applicable
  recording_url TEXT, -- URL to call recording if available
  transcript TEXT, -- Conversation transcript if available
  duration INTEGER, -- Call duration in seconds
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Add reasoning_analyses table for storing AI risk assessments (optional but useful for tracking)
CREATE TABLE IF NOT EXISTS reasoning_analyses (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  risk_score INTEGER NOT NULL, -- 0-100
  risk_label TEXT NOT NULL, -- 'none' | 'low' | 'medium' | 'high'
  pattern_type TEXT, -- 'normal' | 'sneak_out' | 'chronic' | 'irregular'
  summary TEXT NOT NULL, -- AI-generated summary
  recommendation TEXT NOT NULL, -- 'none' | 'monitor' | 'immediate_call'
  reasoning TEXT, -- Detailed reasoning from AI
  confidence REAL, -- 0-1 confidence score
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calls_student ON calls(student_id);
CREATE INDEX IF NOT EXISTS idx_calls_session ON calls(session_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created ON calls(created_at);

CREATE INDEX IF NOT EXISTS idx_reasoning_student ON reasoning_analyses(student_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_session ON reasoning_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_risk ON reasoning_analyses(risk_label);
