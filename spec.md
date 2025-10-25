# 🧠 EduGuard — AI Attendance & Safety Agent

## Complete Product Specification Document

---

## 📋 Executive Summary

**EduGuard** is an AI-powered attendance and student safety system that reduces attendance-taking from 10 minutes to 2 seconds, detects same-day truancy patterns, and notifies parents immediately through conversational AI voice calls in Spanish.

**Target Users**: High school teachers, administrators, and parents

**Core Innovation**: Combines computer vision, reasoning AI, and conversational voice AI to transform passive attendance-taking into an active safety monitoring system.

---

## 🎯 Problem Statement

### Current Pain Points

**For Teachers:**
- Manual attendance wastes 5-10 minutes per class (50-100 minutes/day for 10 classes)
- No visibility across different periods to detect same-day truancy
- Reactive rather than proactive approach to student safety

**For Schools:**
- Students sneak out between periods without detection
- Chronic absenteeism patterns discovered weeks too late
- No systematic parent communication about daily absences

**For Parents:**
- Learn about attendance issues days or weeks after occurrence
- Miss early intervention opportunities
- No real-time notification when student leaves campus mid-day

### Impact Statistics
- Average 8-10 minutes lost per class to manual attendance
- 30% of truancy cases involve mid-day departures
- Parents notified 3-7 days after chronic absence begins

---

## ✅ Solution Overview

### High-Level Approach

EduGuard automates the entire attendance-to-notification pipeline using three specialized AI agents:

1. **Vision Agent**: Recognizes students from classroom photos using facial recognition
2. **Reasoning Agent**: Analyzes attendance patterns to detect risks (sneak-outs, chronic absence, academic jeopardy)
3. **Voice Agent**: Contacts parents via conversational AI in Spanish with immediate follow-up

### Key Differentiators

- **Speed**: 2 seconds vs 10 minutes for attendance
- **Intelligence**: Detects same-day absence patterns indicating potential safety issues
- **Proactive**: Parents notified within minutes, not days
- **Conversational**: Natural language voice calls, not robocalls
- **Comprehensive**: Single platform from photo to parent contact

---

## 🏗️ System Architecture

### Architecture Philosophy

**Cloudflare-First**: All infrastructure runs on Cloudflare's edge network for:
- Global low-latency access
- Serverless auto-scaling
- Cost efficiency
- Built-in security

**AI-SDK Powered**: Vercel AI SDK v5 orchestrates all AI interactions for:
- Unified LLM provider abstraction
- Streaming responses
- Structured output generation
- Tool calling coordination

### Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Compute** | Cloudflare Workers | Serverless API endpoints |
| **Database** | Cloudflare D1 (SQLite) | Relational data storage |
| **Vector DB** | Cloudflare Vectorize | Face embedding similarity search |
| **Object Storage** | Cloudflare R2 | Student photo storage |
| **Job Queue** | Cloudflare Queues | Async notification processing |
| **CDN** | Cloudflare CDN | Static asset delivery |

### Frontend Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **TypeScript** | Type safety |
| **TailwindCSS** | Utility-first styling |
| **ShadCN UI** | Component library |
| **Vercel AI SDK v5** | AI interactions & streaming |
| **face-api.js** | Client-side face detection |

### AI & External Services

| Service | Purpose |
|---------|---------|
| **ElevenLabs Conversational AI** | Outbound voice calls |
| **ElevenLabs Voice API** | Text-to-speech |
| **OpenAI GPT-4** | Reasoning agent |
| **Twilio / MessageBird** | SMS follow-up |

---

## 🤖 AI Agents Specification

### Agent 1: Vision Agent

**Purpose**: Identify students from classroom photos

**Technology Stack**:
- Face detection: face-api.js (client-side)
- Embedding model: FaceNet-512 or similar
- Vector search: Cloudflare Vectorize

**Workflow**:
1. Receives classroom photo from frontend
2. Detects all faces in image
3. Generates 512-dimensional embedding per face
4. Queries Vectorize for top-1 match per embedding
5. Returns matched students with confidence scores (>85% threshold)

**Input**:
- Image: JPEG/PNG, max 5MB
- Class context: class_id, session_id, timestamp

**Output**:
```json
{
  "detected_students": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "confidence": 0.94,
      "bbox": [x, y, width, height]
    }
  ],
  "present_count": 6,
  "processing_time_ms": 847
}
```

**Performance Targets**:
- Detection time: <2 seconds for 30 students
- Accuracy: >95% for enrolled students
- False positive rate: <2%

---

### Agent 2: Reasoning Agent

**Purpose**: Analyze attendance patterns and flag at-risk students

**Technology Stack**:
- LLM: OpenAI GPT-4 via Vercel AI SDK
- Framework: generateObject() with Zod schemas
- Context: Last 30 days of attendance data

**Detection Rules**:

| Pattern | Logic | Urgency |
|---------|-------|---------|
| **Sneak-out** | Present period 1, absent periods 2-3+ same day | High |
| **Weekly chronic** | Absent 3+ days in past 7 days | Medium |
| **Academic risk** | Absent 20%+ of classes in past 30 days | High |
| **Irregular pattern** | Random absences with no clear pattern | Low |

**Workflow**:
1. Triggered after each attendance capture
2. Retrieves student attendance history (7-30 days)
3. Analyzes patterns using LLM reasoning
4. Generates structured risk assessment
5. Recommends notification action

**Input**:
```json
{
  "student_id": "123",
  "current_status": "absent",
  "today_attendance": [
    {"period": 1, "status": "present"},
    {"period": 2, "status": "absent"},
    {"period": 3, "status": "absent"}
  ],
  "history_7d": [...],
  "history_30d": [...]
}
```

**Output**:
```json
{
  "risk_level": "high",
  "pattern_type": "sneak_out",
  "confidence": 0.89,
  "should_notify": true,
  "notification_urgency": "immediate",
  "reasoning": "Student present in period 1 but absent in subsequent periods, indicating possible unauthorized departure",
  "recommended_action": "immediate_call"
}
```

**LLM Prompt Strategy**:
- System: Expert school attendance analyst
- Context: School policies, absence thresholds
- Task: Pattern detection and risk assessment
- Output: Structured JSON via generateObject()

---

### Agent 3: Voice Agent (Conversational AI)

**Purpose**: Contact parents with natural language voice calls in Spanish

**Technology Stack**:
- Platform: ElevenLabs Conversational AI
- Voice: Spanish (Spain/Latin America variant)
- DTMF: Touch-tone response capture
- Integration: REST API + Webhooks

**Conversation Flow**:

```
[Agent initiates call]
Agent: "Hola, buenos días/tardes. Soy el asistente virtual del Colegio [Name]. 
        ¿Hablo con el apoderado de [Student Name]?"

Parent: "Sí" / "No" / Hangs up

[If Yes]
Agent: "[Student Name] no asistió a la clase de [Subject] a las [Time] hoy.
        Para confirmar su situación, por favor presione:
        - 1 si el/la estudiante está en casa por razones justificadas
        - 2 si no sabía de la ausencia y requiere seguimiento
        - 3 si el/la estudiante llegará tarde pero asistirá"

Parent: [Presses 1/2/3]

Agent: "Gracias por confirmar. [Response-specific message]
        Recibirá un mensaje de texto con más detalles. 
        Para más información, contacte al colegio al [Phone]. Que tenga buen día."

[Call ends]
```

**Response Handling**:

| DTMF Code | Meaning | Follow-up Action |
|-----------|---------|------------------|
| **1** | Justified absence (home sick, appointment) | SMS confirmation, mark as excused |
| **2** | Parent unaware, needs follow-up | SMS + flag for admin review |
| **3** | Running late, will arrive | SMS confirmation, expect arrival |
| **No answer** | Voicemail or unavailable | Voicemail message + SMS + retry later |
| **Wrong number** | Not parent/guardian | Update contact info |

**ElevenLabs Agent Configuration**:
```json
{
  "agent_id": "edu_guard_spanish",
  "language": "es",
  "voice": {
    "voice_id": "professional_female_spanish",
    "stability": 0.7,
    "similarity_boost": 0.8
  },
  "conversation_config": {
    "first_message": "[Dynamic based on student/class]",
    "max_duration_seconds": 120,
    "dtmf_enabled": true,
    "dtmf_timeout_seconds": 10,
    "voicemail_detection": true
  },
  "webhook_url": "https://api.eduguard.app/webhooks/call-completed"
}
```

**Call Lifecycle**:
1. **Initiate**: POST to ElevenLabs with student context
2. **In Progress**: Track via conversation_id
3. **Complete**: Webhook receives outcome + recording
4. **Follow-up**: SMS sent within 30 seconds
5. **Log**: Store in D1 with full metadata

---

## 🎨 Features & User Flows

### Feature Hierarchy (Priority Order)

#### ⭐ TIER 1: Core Features (Must Build)

**F1: Student Enrollment**
- Upload student portrait photos (2-3 per student)
- Automatic face embedding generation client-side
- Store embeddings in Vectorize with metadata
- Preview enrolled students roster

**F2: Photo-Based Attendance**
- Capture classroom photo via webcam/upload
- Real-time face detection visualization
- Automatic present/absent marking
- Confidence score display per student
- Manual override capability

**F3: AI Reasoning & Flagging**
- Automatic pattern detection after each attendance
- Visual flags for at-risk students
- Reasoning explanation display
- Teacher confirmation before notification

**F4: AI Voice Parent Notification**
- One-click call initiation
- Real-time call status tracking
- DTMF response capture
- Call outcome display

**F5: Basic Dashboard**
- Today's attendance overview
- Present/absent student list
- Recent call logs with outcomes
- Flagged students section

---

#### ⚡ TIER 2: Enhanced Features (Should Build)

**F6: Multi-Day History**
- 7-day attendance calendar view
- Individual student drill-down
- Absence count by student
- Sparkline attendance trends

**F7: SMS Follow-Up**
- Automatic SMS after voice call
- Custom message based on DTMF response
- Delivery status tracking
- SMS template management

**F8: Enhanced Reasoning**
- Multiple risk pattern detection
- Configurable absence thresholds
- Weekly summary reports
- Trend prediction

**F9: Notification Preferences**
- Parent contact preferences (call first vs SMS first)
- Language preference (Spanish/English)
- Preferred contact times
- Emergency contact fallback

---

#### 🎨 TIER 3: Nice-to-Have (Skip for Hackathon)

**F10: Year-Long Analytics**
- Semester/year attendance aggregation
- Academic risk correlation
- School-wide statistics
- Export reports

**F11: Teacher Feedback Loop**
- Correct AI mistakes
- Flag false positives
- Improve model over time

**F12: Multi-Class Aggregation**
- Cross-class absence patterns
- Teacher collaboration features

**F13: Email Notifications**
- Formal absence reports
- Weekly summaries for parents

---

### Detailed User Flows

#### Flow 1: Initial Setup (One-Time)

**Actors**: Admin, System

**Steps**:
1. Admin logs into dashboard
2. Navigates to "Enroll Students" page
3. Uploads CSV with student roster (name, guardian name, phone, email)
4. For each student, uploads 2-3 portrait photos
5. System detects faces in photos client-side
6. System generates embeddings (512-dim vectors)
7. System uploads embeddings + metadata to backend
8. Backend stores:
   - Student metadata → D1 database
   - Photos → R2 storage
   - Embeddings → Vectorize index
9. System shows confirmation with preview of all enrolled students

**Estimated Time**: 2 minutes for 30 students

---

#### Flow 2: Daily Attendance Capture

**Actors**: Teacher, Vision Agent, System

**Steps**:
1. Teacher opens app at start of class
2. Selects current class from dropdown (e.g., "Math - Period 2")
3. Clicks "Take Attendance" button
4. Camera interface opens (or file upload option)
5. Teacher takes photo of classroom (ensuring faces visible)
6. System displays "Processing..." with progress indicator
7. Vision Agent:
   - Detects faces in image
   - Generates embeddings per face
   - Queries Vectorize for matches
   - Returns matched students
8. System displays results:
   - Green checkmarks for present students
   - Red X for absent students
   - Face bounding boxes on photo
   - Confidence scores
9. Teacher reviews and can manually adjust if needed
10. Teacher clicks "Confirm Attendance"
11. System saves to database with timestamp
12. System triggers Reasoning Agent analysis

**Estimated Time**: 10-15 seconds

---

#### Flow 3: AI Risk Detection & Notification

**Actors**: Reasoning Agent, Teacher, Voice Agent, Parent

**Steps**:

**Phase A: Risk Detection**
1. Reasoning Agent analyzes newly captured attendance
2. Retrieves student's attendance history (7 days)
3. Detects pattern: "Sofia present Period 1, absent Periods 2-3"
4. Generates risk assessment: "High risk - potential sneak-out"
5. Dashboard shows warning badge on Sofia's card
6. Teacher clicks on warning to see details

**Phase B: Teacher Review**
7. Modal opens with:
   - Risk explanation
   - Today's attendance timeline
   - 7-day history chart
   - Suggested action
8. Teacher has options:
   - "Notify Parent Now" (immediate call)
   - "False Alarm" (dismiss)
   - "Mark Excused" (justified absence)
9. Teacher selects "Notify Parent Now"

**Phase C: Voice Call**
10. System enqueues notification job
11. Cloudflare Queue worker picks up job
12. Worker calls ElevenLabs API with:
    - Parent phone number
    - Student name
    - Class missed
    - Time
13. ElevenLabs initiates call
14. Conversation happens (see Agent 3 flow)
15. Parent presses "2" (didn't know)
16. Call ends, ElevenLabs sends webhook

**Phase D: Follow-up**
17. Webhook received at /webhooks/call-completed
18. System logs call outcome in D1
19. System sends SMS via Twilio:
    - "Sofia faltó a Matemáticas hoy. Usted indicó no estar informado. Por favor contacte al colegio: [phone]. - Colegio [Name]"
20. Dashboard updates with call result
21. Sofia's card shows "Parent Notified - Unaware (Code 2)"

**Estimated Time**: 2-3 minutes end-to-end

---

#### Flow 4: Dashboard Monitoring

**Actors**: Teacher/Admin

**Views**:

**Today's Overview**
- Total students expected: 30
- Present: 24 (80%)
- Absent: 6 (20%)
- Flagged for review: 2

**Student List**
- Sortable/filterable table
- Columns: Name, Status, Time Marked, Confidence, Actions
- Color coding: Green (present), Red (absent), Yellow (flagged)

**Recent Calls**
- Call log table
- Columns: Student, Time, Outcome, Parent Response, Recording Link
- Last 20 calls shown

**Flagged Students**
- Cards showing at-risk students
- Pattern type, risk level, recommendation
- Quick action buttons

**Individual Student View**
- 7-day attendance calendar
- Sparkline chart
- Call history
- Guardian contact info

---

## 🔌 API Specification

### Backend API Endpoints

#### 1. Student Management

**POST /api/students**
```
Purpose: Create new student enrollment
Auth: Teacher JWT

Request:
{
  "name": "Sofia Martinez",
  "grade": "10",
  "guardian_name": "Maria Martinez",
  "guardian_phone": "+56912345678",
  "guardian_email": "maria@example.com",
  "photos": ["base64_photo1", "base64_photo2"],
  "embeddings": [[0.234, -0.456, ...], [...]]
}

Response:
{
  "student_id": "123",
  "status": "enrolled",
  "photos_stored": 2,
  "embeddings_indexed": 2
}
```

**GET /api/students/:id**
```
Purpose: Retrieve student details
Auth: Teacher JWT

Response:
{
  "student_id": "123",
  "name": "Sofia Martinez",
  "grade": "10",
  "guardian": {
    "name": "Maria Martinez",
    "phone": "+56912345678",
    "email": "maria@example.com",
    "preferred_language": "es"
  },
  "enrollment_date": "2025-09-01",
  "photo_urls": ["https://r2.../1.jpg", "https://r2.../2.jpg"]
}
```

**GET /api/students**
```
Purpose: List all students
Auth: Teacher JWT
Query params: ?class_id=math101&grade=10

Response:
{
  "students": [...],
  "total": 156,
  "page": 1,
  "per_page": 50
}
```

---

#### 2. Attendance Operations

**POST /api/attendance/capture**
```
Purpose: Submit attendance from classroom photo
Auth: Teacher JWT

Request:
{
  "class_id": "math101",
  "session_id": "2025-10-25-period2",
  "timestamp": "2025-10-25T08:15:00Z",
  "embeddings": [
    [0.234, -0.456, ...],  // face 1
    [0.123, 0.789, ...]    // face 2
  ],
  "photo_metadata": {
    "resolution": "1920x1080",
    "faces_detected": 24
  }
}

Response:
{
  "attendance_id": "att_789",
  "present": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "confidence": 0.94,
      "marked_at": "2025-10-25T08:15:03Z"
    },
    ...
  ],
  "absent": [
    {
      "student_id": "456",
      "name": "Juan Lopez",
      "last_seen": "2025-10-24T14:00:00Z"
    },
    ...
  ],
  "unmatched_faces": 1,
  "processing_time_ms": 847
}
```

**GET /api/attendance/session/:session_id**
```
Purpose: Retrieve specific attendance session
Auth: Teacher JWT

Response:
{
  "session_id": "2025-10-25-period2",
  "class_id": "math101",
  "teacher_id": "teacher_42",
  "timestamp": "2025-10-25T08:15:00Z",
  "present_count": 24,
  "absent_count": 6,
  "students": [...]
}
```

**GET /api/attendance/student/:student_id**
```
Purpose: Get attendance history for student
Auth: Teacher JWT
Query params: ?days=7&class_id=math101

Response:
{
  "student_id": "123",
  "name": "Sofia Martinez",
  "period": "last_7_days",
  "stats": {
    "total_classes": 35,
    "present": 28,
    "absent": 7,
    "attendance_rate": 0.80
  },
  "daily_records": [
    {
      "date": "2025-10-25",
      "classes": [
        {"class": "Math", "period": 1, "status": "present"},
        {"class": "English", "period": 2, "status": "absent"},
        {"class": "Physics", "period": 3, "status": "absent"}
      ]
    },
    ...
  ]
}
```

**PATCH /api/attendance/:attendance_id**
```
Purpose: Manual correction by teacher
Auth: Teacher JWT

Request:
{
  "student_id": "123",
  "status": "present",
  "reason": "technical_error",
  "notes": "Student was present, face not detected due to angle"
}

Response:
{
  "updated": true,
  "attendance_id": "att_789",
  "new_status": "present"
}
```

---

#### 3. AI Reasoning

**POST /api/reasoning/analyze**
```
Purpose: Trigger reasoning agent analysis
Auth: System (internal) or Teacher JWT

Request:
{
  "student_id": "123",
  "trigger": "attendance_captured",
  "context": {
    "current_status": "absent",
    "session_id": "2025-10-25-period2"
  }
}

Response:
{
  "analysis_id": "analysis_456",
  "student_id": "123",
  "risk_level": "high",
  "pattern_type": "sneak_out",
  "confidence": 0.89,
  "should_notify": true,
  "notification_urgency": "immediate",
  "reasoning": "Student present in period 1 but absent in periods 2-3...",
  "recommended_action": "immediate_call",
  "evidence": {
    "today": [
      {"period": 1, "status": "present"},
      {"period": 2, "status": "absent"},
      {"period": 3, "status": "absent"}
    ],
    "last_7_days": {
      "total_absences": 8,
      "pattern": "irregular"
    }
  }
}
```

**GET /api/reasoning/flags**
```
Purpose: Get all currently flagged students
Auth: Teacher JWT
Query params: ?class_id=math101&risk_level=high

Response:
{
  "flagged_students": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "risk_level": "high",
      "pattern_type": "sneak_out",
      "flagged_at": "2025-10-25T08:15:05Z",
      "action_taken": false
    },
    ...
  ],
  "total": 3
}
```

---

#### 4. Notifications

**POST /api/notifications/call**
```
Purpose: Initiate voice call to parent
Auth: Teacher JWT

Request:
{
  "student_id": "123",
  "reason": "absence_detected",
  "urgency": "immediate",
  "context": {
    "class_name": "Matemáticas",
    "time": "08:15",
    "pattern": "sneak_out"
  }
}

Response:
{
  "call_id": "call_789",
  "status": "queued",
  "estimated_time": "30s",
  "guardian_phone": "+56912345678"
}
```

**GET /api/notifications/call/:call_id**
```
Purpose: Get call status and outcome
Auth: Teacher JWT

Response:
{
  "call_id": "call_789",
  "student_id": "123",
  "status": "completed",
  "initiated_at": "2025-10-25T08:16:00Z",
  "completed_at": "2025-10-25T08:17:23Z",
  "duration_seconds": 83,
  "outcome": "answered",
  "dtmf_response": "2",
  "response_meaning": "parent_unaware",
  "recording_url": "https://elevenlabs.../recording.mp3",
  "transcript": "...",
  "sms_sent": true,
  "sms_delivered": true
}
```

**POST /api/notifications/sms**
```
Purpose: Send SMS to parent
Auth: System (internal) or Teacher JWT

Request:
{
  "student_id": "123",
  "template": "absence_followup",
  "context": {
    "class_name": "Matemáticas",
    "call_response": "2"
  }
}

Response:
{
  "sms_id": "sms_456",
  "status": "sent",
  "phone": "+56912345678",
  "message": "Sofia faltó a Matemáticas hoy..."
}
```

**GET /api/notifications/history/:student_id**
```
Purpose: Get all notifications sent for student
Auth: Teacher JWT
Query params: ?type=call&days=30

Response:
{
  "student_id": "123",
  "notifications": [
    {
      "type": "call",
      "timestamp": "2025-10-25T08:16:00Z",
      "outcome": "parent_unaware",
      "response": "2"
    },
    {
      "type": "sms",
      "timestamp": "2025-10-25T08:17:30Z",
      "status": "delivered"
    },
    ...
  ],
  "total": 12
}
```

---

#### 5. Webhooks (Incoming)

**POST /api/webhooks/elevenlabs/call-completed**
```
Purpose: Receive call outcome from ElevenLabs
Auth: ElevenLabs signature verification

Request (from ElevenLabs):
{
  "conversation_id": "conv_xyz",
  "call_id": "call_789",
  "status": "completed",
  "duration": 83,
  "ended_by": "user",
  "dtmf_input": "2",
  "transcript": "...",
  "recording_url": "https://...",
  "metadata": {
    "student_id": "123"
  }
}

Response:
{
  "received": true,
  "processed": true
}
```

**POST /api/webhooks/twilio/sms-status**
```
Purpose: Receive SMS delivery status
Auth: Twilio signature verification

Request (from Twilio):
{
  "MessageSid": "SM...",
  "MessageStatus": "delivered",
  "To": "+56912345678",
  "From": "+56987654321"
}

Response:
{
  "received": true
}
```

---

#### 6. Analytics & Reporting

**GET /api/analytics/dashboard**
```
Purpose: Get today's overview stats
Auth: Teacher JWT

Response:
{
  "date": "2025-10-25",
  "overall": {
    "total_students": 156,
    "total_classes": 8,
    "attendance_rate": 0.83,
    "flagged_students": 5,
    "calls_made": 3,
    "calls_pending": 2
  },
  "by_period": [
    {
      "period": 1,
      "time": "08:00",
      "attendance_rate": 0.95
    },
    ...
  ],
  "recent_activity": [...]
}
```

**GET /api/analytics/trends**
```
Purpose: Get attendance trends
Auth: Teacher JWT
Query params: ?period=30d&class_id=math101

Response:
{
  "period": "30_days",
  "overall_trend": "declining",
  "average_rate": 0.82,
  "by_day": [
    {"date": "2025-10-01", "rate": 0.89},
    {"date": "2025-10-02", "rate": 0.85},
    ...
  ],
  "top_absentees": [
    {"student_id": "123", "name": "Sofia", "absences": 12},
    ...
  ]
}
```

---

## 📊 Data Models

### Database Schema (D1 - SQLite)

**students**
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  preferred_language TEXT DEFAULT 'es',
  enrollment_date TEXT,
  status TEXT DEFAULT 'active',
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**attendance**
```sql
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'present' | 'absent'
  confidence REAL,
  marked_at TEXT,
  marked_by TEXT,  -- 'auto' | teacher_id
  corrected BOOLEAN DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_date ON attendance(marked_at);
```

**sessions**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  expected_students INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  photo_url TEXT,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**calls**
```sql
CREATE TABLE calls (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  initiated_by TEXT NOT NULL,  -- teacher_id or 'auto'
  initiated_at TEXT,
  completed_at TEXT,
  status TEXT,  -- 'queued' | 'in_progress' | 'completed' | 'failed'
  outcome TEXT,  -- 'answered' | 'voicemail' | 'no_answer' | 'busy'
  dtmf_response TEXT,  -- '1' | '2' | '3' | null
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  conversation_id TEXT,  -- ElevenLabs ID
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_calls_student ON calls(student_id);
CREATE INDEX idx_calls_date ON calls(initiated_at);
```

**sms_notifications**
```sql
CREATE TABLE sms_notifications (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT,  -- 'sent' | 'delivered' | 'failed'
  sent_at TEXT,
  delivered_at TEXT,
  provider_id TEXT,  -- Twilio SID
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

**reasoning_analyses**
```sql
CREATE TABLE reasoning_analyses (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  analyzed_at TEXT,
  risk_level TEXT,  -- 'none' | 'low' | 'medium' | 'high'
  pattern_type TEXT,
  confidence REAL,
  should_notify BOOLEAN,
  reasoning TEXT,
  evidence JSON,
  action_taken BOOLEAN DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_analyses_student ON reasoning_analyses(student_id);
CREATE INDEX idx_analyses_risk ON reasoning_analyses(risk_level);
```

---

### Vectorize Schema

**Index**: `student-faces`

**Configuration**:
```json
{
  "dimensions": 512,
  "metric": "cosine",
  "metadata_schema": {
    "student_id": "string",
    "name": "string",
    "photo_number": "integer",
    "captured_at": "string"
  }
}
```

**Record Structure**:
```json
{
  "id": "student_123_photo_1",
  "values": [0.234, -0.456, ...],  // 512 dimensions
  "metadata": {
    "student_id": "123",
    "name": "Sofia Martinez",
    "photo_number": 1,
    "captured_at": "2025-09-01T10:00:00Z"
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Hours 0-3)
- [ ] Set up Cloudflare Workers project
- [ ] Initialize D1 database with schema
- [ ] Create Vectorize index
- [ ] Set up React + Vite frontend
- [ ] Configure ElevenLabs agent
- [ ] Implement authentication

### Phase 2: Vision Agent (Hours 3-6)
- [ ] Build student enrollment page
- [ ] Integrate face-api.js
- [ ] Implement embedding generation
- [ ] Build Vectorize query logic
- [ ] Create attendance capture UI
- [ ] Test with mock students

### Phase 3: Voice Agent (Hours 6-9)
- [ ] Integrate ElevenLabs API
- [ ] Build call initiation endpoint
- [ ] Configure Spanish conversation flow
- [ ] Implement webhook handler
- [ ] Test call flow end-to-end
- [ ] Add Twilio SMS integration

### Phase 4: Reasoning Agent (Hours 9-11)
- [ ] Implement Vercel AI SDK integration
- [ ] Build pattern detection logic
- [ ] Create risk assessment endpoint
- [ ] Build teacher review UI
- [ ] Test flagging system

### Phase 5: Dashboard & Polish (Hours 11-12)
- [ ] Build main dashboard
- [ ] Add call logs view
- [ ] Create student history view
- [ ] Polish UI with TailwindCSS
- [ ] Prepare demo script

---

## 🎯 Success Metrics

**Technical Performance**:
- Attendance capture: <2 seconds
- Face recognition accuracy: >95%
- Call connection rate: >90%
- System uptime: 99.9%

**User Impact**:
- Time saved: 8-10 minutes per class
- Parent notification speed: <5 minutes from absence
- False positive rate: <5%
- Teacher satisfaction: >4.5/5

**Business Value**:
- Reduced chronic absenteeism by 30%
- Same-day truancy detection: 100% of sneak-out attempts
- Parent engagement increase: 60%
- Early intervention: 3-7 days faster than current

---

## 📝 Conclusion

EduGuard transforms school attendance from a manual administrative burden into an intelligent, proactive safety system. By combining computer vision, AI reasoning, and conversational voice agents on a fully serverless Cloudflare infrastructure, we deliver a solution that is fast, accurate, and scalable.

**Core Innovation**: Three AI agents working in concert (Vision → Reasoning → Voice) to close the loop from photo to parent notification in under 5 minutes.

**Hackathon Advantage**: Novel multi-agent approach with live voice demo that solves a real, urgent problem in education safety.