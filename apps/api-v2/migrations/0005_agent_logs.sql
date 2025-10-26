-- Agent decision logs for auditability
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  student_id TEXT REFERENCES students(id),
  call_id TEXT REFERENCES calls(id),
  details TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_student ON agent_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON agent_logs(session_id);
