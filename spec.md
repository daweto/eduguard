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
- Desktop-based systems require teachers to walk to computer to mark attendance
- Mobile accessibility is critical for quick in-classroom attendance capture

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

1. **Vision Agent**: Recognizes students from classroom photos using AWS Rekognition facial recognition
2. **Reasoning Agent**: Analyzes attendance patterns to detect risks (sneak-outs, chronic absence, academic jeopardy)
3. **Voice Agent**: Contacts parents via conversational AI in Spanish

### Key Differentiators

- **Speed**: 2 seconds vs 10 minutes for attendance
- **Intelligence**: Detects same-day absence patterns indicating potential safety issues
- **Proactive**: Parents notified within minutes, not days
- **Conversational**: Natural language voice calls, not robocalls
- **Comprehensive**: Single platform from photo to parent contact
- **Mobile-First**: Designed for smartphone use - teachers can quickly capture attendance from their phones in the classroom without needing to access desktop computers

---

## 🏗️ System Architecture

### Architecture Philosophy

**Hybrid Cloud**: Combines Cloudflare's edge computing with AWS's specialized AI services:
- Cloudflare: Application hosting, database, queues
- AWS Rekognition: Facial recognition (purpose-built, managed service)
- Leverages best-in-class services for each domain

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
| **Face Recognition** | AWS Rekognition | Face detection & matching |
| **Face Collection** | AWS Rekognition Collections | Face storage & indexing |
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

**Mobile-First Design**:
- Teachers will primarily access the app through their **smartphones** for quick attendance capture in classrooms
- Responsive design with touch-optimized UI elements
- Native camera access for photo capture
- Mobile-friendly navigation and large touch targets
- Fast loading on cellular networks
- Progressive Web App (PWA) capabilities for app-like experience

### AI & External Services

| Service | Purpose |
|---------|---------|
| **AWS Rekognition** | Face detection & recognition |
| **ElevenLabs Conversational AI** | Outbound voice calls |
| **ElevenLabs Voice API** | Text-to-speech |
| **OpenAI GPT-4** | Reasoning agent |
| **~~Twilio / MessageBird~~** | ~~SMS follow-up~~ **(OPTIONAL - Skip for hackathon)** |

---

## 🤖 AI Agents Specification

### Agent 1: Vision Agent (AWS Rekognition)

**Purpose**: Identify students from classroom photos

**Technology Stack**:
- Face detection & recognition: AWS Rekognition
- Face storage: AWS Rekognition Collections
- API integration: AWS SDK via Cloudflare Workers

**AWS Rekognition Features Used**:
- **IndexFaces**: Store student faces during enrollment
- **SearchFacesByImage**: Match faces in classroom photos
- **DetectFaces**: Find all faces in an image
- **Collections**: Organize faces by school/grade

**Workflow**:

**Enrollment Phase:**
1. Frontend uploads student portrait photos to backend
2. Backend stores photos in R2
3. Backend calls AWS Rekognition `IndexFaces` API
4. Rekognition extracts facial features and stores in Collection
5. Face ID linked to student record in D1 database

**Attendance Phase:**
1. Frontend uploads classroom photo to backend
2. Backend calls AWS Rekognition `DetectFaces` to find all faces
3. For each detected face, call `SearchFacesByImage`
4. Rekognition returns matching Face ID with confidence score
5. Backend maps Face IDs to student records
6. Returns present/absent list

**Input**:
- Image: JPEG/PNG, max 15MB (AWS limit)
- Class context: class_id, session_id, timestamp

**Output**:
```json
{
  "detected_students": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "confidence": 99.87,
      "face_id": "aws-face-abc123",
      "bbox": {
        "left": 0.234,
        "top": 0.156,
        "width": 0.089,
        "height": 0.123
      }
    }
  ],
  "present_count": 6,
  "unmatched_faces": 0,
  "processing_time_ms": 1234
}
```

**AWS Rekognition Configuration**:
```json
{
  "collection_id": "eduguard-school-[school_id]",
  "quality_filter": "AUTO",
  "detection_attributes": ["DEFAULT"],
  "face_match_threshold": 95.0,
  "max_faces": 50
}
```

**Performance Targets**:
- Detection time: <2 seconds for 30 students
- Accuracy: >98% (AWS Rekognition standard)
- False positive rate: <1%

**Key Advantages of AWS Rekognition**:
- No client-side processing needed
- Managed face collection (no vector DB maintenance)
- Enterprise-grade accuracy
- Handles poor lighting, angles automatically
- Built-in quality filtering
- Scales automatically

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
  "current_class": "math101",
  "current_classroom": "A1",
  "today_attendance": [
    {"period": 1, "class": "English", "classroom": "C2", "status": "present"},
    {"period": 2, "class": "Math", "classroom": "A1", "status": "absent"},
    {"period": 3, "class": "Science", "classroom": "B3", "status": "absent"}
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
        Para más información, contacte al colegio al [Phone]. Que tenga buen día."

[Call ends]
```

**Response Handling**:

| DTMF Code | Meaning | Follow-up Action |
|-----------|---------|------------------|
| **1** | Justified absence (home sick, appointment) | Mark as excused in system |
| **2** | Parent unaware, needs follow-up | Flag for admin review |
| **3** | Running late, will arrive | Mark as expected arrival |
| **No answer** | Voicemail or unavailable | Leave voicemail + retry later |
| **Wrong number** | Not parent/guardian | Update contact info needed |

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
4. **Log**: Store in D1 with full metadata

---

## 🎨 Features & User Flows

### Feature Hierarchy (Priority Order)

#### ⭐ TIER 1: Core Features (Must Build)

**F1: Student Enrollment**
- Upload student portrait photos (2-3 per student)
- Backend sends photos to AWS Rekognition for indexing
- Store Face IDs in D1 database linked to student records
- Preview enrolled students roster

**F2: Photo-Based Attendance**
- Capture classroom photo via webcam/upload
- Backend processes via AWS Rekognition
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

**Mobile-First UI Requirements**:
- Responsive design for smartphones (primary use case)
- Touch-optimized buttons (minimum 44x44px tap targets)
- Portrait orientation support for camera capture
- Swipe gestures for navigation
- Large, readable fonts (minimum 16px)
- High contrast for classroom viewing
- Bottom navigation for one-handed operation
- Pull-to-refresh for attendance lists
- Mobile-optimized photo viewer
- Fast loading (<2s on 4G)

---

#### ⚡ TIER 2: Enhanced Features (Should Build If Time)

**F6: Multi-Day History**
- 7-day attendance calendar view
- Individual student drill-down
- Absence count by student
- Sparkline attendance trends

**F7: Enhanced Reasoning**
- Multiple risk pattern detection
- Configurable absence thresholds
- Weekly summary analysis
- Trend prediction

**F8: Notification Preferences**
- Parent contact preferences
- Language preference (Spanish/English)
- Preferred contact times
- Emergency contact fallback

**F9: Voicemail Handling**
- Automatic voicemail detection
- Pre-recorded message drop
- Retry scheduling

---

#### 🎨 TIER 3: Nice-to-Have (Skip for Hackathon)

**F10: SMS Follow-Up** **(OPTIONAL - FINAL BIT)**
- Automatic SMS after voice call
- Custom message based on DTMF response
- Delivery status tracking
- SMS template management

**F11: Year-Long Analytics**
- Semester/year attendance aggregation
- Academic risk correlation
- School-wide statistics
- Export reports

**F12: Teacher Feedback Loop**
- Correct AI mistakes
- Flag false positives
- Improve model over time

**F13: Multi-Class Aggregation**
- Cross-class absence patterns
- Teacher collaboration features

**F14: Email Notifications**
- Formal absence reports
- Weekly summaries for parents

---

### Detailed User Flows

#### Flow 1: Initial Setup (One-Time)

**Actors**: Admin, System, AWS Rekognition

**Steps**:
1. Admin logs into dashboard
2. Navigates to "Enroll Students" page
3. Uploads CSV with student roster (name, guardian name, phone, email)
4. For each student, uploads 2-3 portrait photos
5. Frontend sends photos to backend API
6. Backend for each photo:
   - Stores original in R2
   - Calls AWS Rekognition `IndexFaces` API
   - Receives Face ID from AWS
   - Stores Face ID + student_id mapping in D1
7. System shows confirmation with preview of all enrolled students

**AWS Rekognition API Call**:
```json
{
  "CollectionId": "eduguard-school-123",
  "Image": {
    "S3Object": {
      "Bucket": "eduguard-photos",
      "Name": "students/sofia-martinez-1.jpg"
    }
  },
  "ExternalImageId": "student_123_photo_1",
  "DetectionAttributes": ["DEFAULT"],
  "QualityFilter": "AUTO"
}
```

**Estimated Time**: 2 minutes for 30 students

---

#### Flow 2: Daily Attendance Capture

**Actors**: Teacher (using smartphone), Vision Agent (AWS Rekognition), System

**Device Context**: Teacher opens app on smartphone in classroom at start of class period

**Steps**:
1. Teacher opens app on their smartphone (mobile browser or PWA)
2. Quick login (saved credentials or biometric auth)
3. Dashboard shows today's classes with "Take Attendance" buttons
4. Teacher taps on current class (e.g., "Math 101 - Period 2")
5. Class details screen shows:
   - Assigned classroom: "A1"
   - Enrolled students: 30
   - Last attendance timestamp
   - Large, thumb-friendly "Take Photo" button
6. Teacher can verify/change classroom via dropdown if needed (e.g., substitute room)
7. Teacher taps "Take Photo" button
8. Native camera interface opens (optimized for portrait orientation)
9. Teacher positions phone to capture classroom (ensuring all student faces visible)
10. Teacher taps capture button (large, easy to tap)
11. Photo preview shows with option to retake
12. Teacher confirms photo
13. Frontend uploads photo to backend with classroom context
14. System displays mobile-optimized "Processing..." with progress indicator
15. Backend processing:
    - Validates class and classroom assignment
    - Gets enrolled students for this specific class
    - Stores photo temporarily in R2
    - Calls AWS Rekognition `DetectFaces` to find all faces
    - For each detected face, calls `SearchFacesByImage`
    - AWS returns matched Face IDs with confidence scores
    - Backend queries D1 to map Face IDs to student records
    - Compares detected students against enrolled students list
    - Determines present students (matched + enrolled) vs absent (enrolled but not in photo)
16. System displays results on mobile screen:
    - Scrollable list of students (touch-optimized)
    - Green checkmarks for present students (large icons)
    - Red X for absent students
    - Face bounding boxes overlay on photo thumbnail
    - Tap to expand photo with full face detection
    - Confidence scores displayed
    - Classroom context: "A1 - Math 101"
17. Teacher scrolls through results on phone screen
18. Teacher can manually adjust individual student status (tap to toggle)
19. Teacher taps large "Confirm Attendance" button at bottom
20. System saves session with classroom context
21. System saves attendance records with classroom location
22. System triggers Reasoning Agent analysis
23. Success confirmation shown on mobile screen

**AWS Rekognition API Calls**:
```json
// Step 1: Detect faces
{
  "Image": {
    "S3Object": {
      "Bucket": "eduguard-temp",
      "Name": "classroom-2025-10-25-period2.jpg"
    }
  },
  "Attributes": ["DEFAULT"]
}

// Step 2: For each face, search collection
{
  "CollectionId": "eduguard-school-123",
  "Image": {
    "S3Object": {
      "Bucket": "eduguard-temp",
      "Name": "classroom-2025-10-25-period2.jpg"
    }
  },
  "FaceMatchThreshold": 95.0,
  "MaxFaces": 1
}
```

**Estimated Time**: 10-15 seconds total (AWS Rekognition typically <2s)

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

**Phase D: System Update**
17. Webhook received at /webhooks/call-completed
18. System logs call outcome in D1
19. Dashboard updates with call result
20. Sofia's card shows "Parent Notified - Unaware (Code 2)"

**~~Phase E: SMS Follow-up (OPTIONAL - Skip for hackathon)~~**
~~21. System sends SMS via Twilio~~
~~22. SMS delivered confirmation~~

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
Purpose: Create new student enrollment with AWS Rekognition
Auth: Teacher JWT

Request:
{
  "name": "Sofia Martinez",
  "grade": "10",
  "guardian_name": "Maria Martinez",
  "guardian_phone": "+56912345678",
  "guardian_email": "maria@example.com",
  "photos": [
    {
      "data": "base64_encoded_image",
      "filename": "sofia-1.jpg"
    },
    {
      "data": "base64_encoded_image",
      "filename": "sofia-2.jpg"
    }
  ]
}

Response:
{
  "student_id": "123",
  "status": "enrolled",
  "photos_stored": 2,
  "aws_faces_indexed": 2,
  "face_ids": [
    "aws-face-abc123",
    "aws-face-def456"
  ]
}

Backend Processing:
1. Store photos in R2
2. Call AWS Rekognition IndexFaces for each photo
3. Store Face IDs in D1 linked to student_id
4. Return confirmation
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
  "photo_urls": ["https://r2.../1.jpg", "https://r2.../2.jpg"],
  "face_ids": ["aws-face-abc123", "aws-face-def456"]
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

**DELETE /api/students/:id**
```
Purpose: Unenroll student and remove from AWS Rekognition
Auth: Teacher JWT

Backend Processing:
1. Get all Face IDs for student from D1
2. Call AWS Rekognition DeleteFaces API
3. Delete student record from D1
4. Delete photos from R2

Response:
{
  "deleted": true,
  "student_id": "123",
  "faces_removed": 2
}
```

---

#### 2. Course & Class Management

**POST /api/courses**
```
Purpose: Create a new course template
Auth: Admin JWT

Request:
{
  "course_code": "MATH101",
  "name": "Introduction to Algebra",
  "subject": "Math",
  "grade_level": "10th",
  "credits": 1.0,
  "description": "Basic algebra concepts and problem solving",
  "prerequisites": "",
  "department": "Mathematics"
}

Response:
{
  "course_id": "course_123",
  "status": "created"
}
```

**GET /api/courses**
```
Purpose: List all courses
Auth: Teacher JWT
Query params: ?subject=Math&grade_level=10th

Response:
{
  "courses": [
    {
      "id": "course_123",
      "course_code": "MATH101",
      "name": "Introduction to Algebra",
      "subject": "Math",
      "grade_level": "10th",
      "credits": 1.0,
      "department": "Mathematics"
    },
    ...
  ]
}
```

---

#### 3. Class & Classroom Management

**POST /api/classrooms**
```
Purpose: Create a new classroom
Auth: Admin JWT

Request:
{
  "name": "A1",
  "building": "Building A",
  "floor": "Ground",
  "capacity": 35,
  "room_type": "classroom",
  "facilities": "projector,whiteboard,computers"
}

Response:
{
  "classroom_id": "room_123",
  "name": "A1",
  "status": "created"
}
```

**GET /api/classrooms**
```
Purpose: List all classrooms
Auth: Teacher JWT

Response:
{
  "classrooms": [
    {
      "id": "room_123",
      "name": "A1",
      "building": "Building A",
      "floor": "Ground",
      "capacity": 35,
      "room_type": "classroom",
      "facilities": ["projector", "whiteboard", "computers"]
    },
    ...
  ]
}
```

**POST /api/classes**
```
Purpose: Create a new class section with teacher and classroom assignment
Auth: Admin JWT

Request:
{
  "course_id": "course_123",
  "section": "A",
  "teacher_id": "teacher_42",
  "classroom_id": "room_123",
  "period": 2,
  "schedule_day": "daily",
  "start_time": "08:00",
  "end_time": "08:50",
  "academic_year": "2024-2025",
  "semester": "Full Year",
  "max_students": 30
}

Response:
{
  "class_id": "math101a",
  "display_name": "MATH101 - Section A",
  "status": "created"
}
```

**GET /api/classes/:course_id/sections**
```
Purpose: Get all sections of a course
Auth: Teacher JWT

Response:
{
  "course": {
    "id": "course_123",
    "code": "MATH101",
    "name": "Introduction to Algebra"
  },
  "sections": [
    {
      "id": "math101a",
      "section": "A",
      "teacher": "Mr. Johnson",
      "classroom": "A1",
      "period": 2,
      "enrolled": 28,
      "max_students": 30
    },
    {
      "id": "math101b",
      "section": "B",
      "teacher": "Mrs. Smith",
      "classroom": "B2",
      "period": 4,
      "enrolled": 25,
      "max_students": 30
    }
  ]
}
```

**POST /api/classes/:class_id/enroll**
```
Purpose: Enroll a student in a class
Auth: Teacher JWT

Request:
{
  "student_id": "123",
  "enrolled_date": "2025-09-01"
}

Response:
{
  "enrollment_id": "enroll_456",
  "student_id": "123",
  "class_id": "math101",
  "status": "enrolled"
}
```

**GET /api/classes/:class_id/students**
```
Purpose: Get all students enrolled in a class
Auth: Teacher JWT

Response:
{
  "class_id": "math101",
  "students": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "enrolled_date": "2025-09-01",
      "attendance_rate": 0.87
    },
    ...
  ],
  "total": 30
}
```

---

#### 3. Attendance Operations

**POST /api/attendance/capture**
```
Purpose: Submit classroom photo for attendance via AWS Rekognition
Auth: Teacher JWT

Request:
{
  "class_id": "math101",
  "classroom_id": "A1",
  "session_id": "2025-10-25-period2",
  "timestamp": "2025-10-25T08:15:00Z",
  "photo": "base64_encoded_image",
  "photo_metadata": {
    "resolution": "1920x1080"
  }
}

Backend Processing:
1. Look up class details (teacher, classroom, expected students)
2. Get enrolled students for this class
3. Store photo temporarily in R2
4. Call AWS Rekognition DetectFaces
5. For each face, call SearchFacesByImage
6. Map Face IDs to student records via D1
7. Compare detected students against enrolled students
8. Determine present (matched) vs absent (enrolled but not detected)
9. Store session record with classroom context
10. Store attendance records in D1
11. Return results

Response:
{
  "attendance_id": "att_789",
  "session_id": "2025-10-25-period2",
  "class_id": "math101",
  "classroom_id": "A1",
  "classroom_name": "Room A1 - Building A",
  "photo_url": "https://r2.../classroom.jpg",
  "faces_detected": 24,
  "enrolled_count": 30,
  "present": [
    {
      "student_id": "123",
      "name": "Sofia Martinez",
      "confidence": 99.87,
      "face_id": "aws-face-abc123",
      "bbox": {
        "left": 0.234,
        "top": 0.156,
        "width": 0.089,
        "height": 0.123
      },
      "marked_at": "2025-10-25T08:15:03Z"
    },
    ...
  ],
  "absent": [
    {
      "student_id": "456",
      "name": "Juan Lopez",
      "class": "math101",
      "expected_in": "A1",
      "last_seen": "2025-10-24T14:00:00Z",
      "last_location": "C2"  -- Last classroom attended
    },
    ...
  ],
  "unmatched_faces": 0,
  "processing_time_ms": 1234
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
  "photo_url": "https://r2.../classroom.jpg",
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
        {"class": "Math", "period": 1, "status": "present", "confidence": 99.87},
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
  "notes": "Student was present, AWS didn't detect due to angle"
}

Response:
{
  "updated": true,
  "attendance_id": "att_789",
  "new_status": "present"
}
```

---

#### 4. AI Reasoning

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
      {"period": 1, "class": "English", "classroom": "C2", "status": "present", "confidence": 99.87},
      {"period": 2, "class": "Math", "classroom": "A1", "status": "absent"},
      {"period": 3, "class": "Science", "classroom": "B3", "status": "absent"}
    ],
    "last_7_days": {
      "total_absences": 8,
      "pattern": "irregular",
      "most_absent_classes": ["Math (A1)", "Science (B3)"]
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

#### 5. Notifications

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
  "transcript": "..."
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
    ...
  ],
  "total": 12
}
```

---

#### 6. SMS Endpoints (OPTIONAL - Skip for Hackathon)

**~~POST /api/notifications/sms~~** **(FINAL BIT - NOT ESSENTIAL)**
```
Purpose: Send SMS to parent
Auth: System (internal) or Teacher JWT

[Implementation optional - can be added post-hackathon]
```

**~~GET /api/notifications/sms/:sms_id~~** **(FINAL BIT - NOT ESSENTIAL)**
```
Purpose: Check SMS delivery status

[Implementation optional - can be added post-hackathon]
```

---

#### 7. Webhooks (Incoming)

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

**~~POST /api/webhooks/twilio/sms-status~~** **(OPTIONAL - Skip for hackathon)**
```
Purpose: Receive SMS delivery status
Auth: Twilio signature verification

[Not needed for core demo]
```

---

#### 8. Analytics & Reporting

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
  aws_collection_id TEXT NOT NULL,  -- AWS Rekognition Collection ID
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**classrooms**
```sql
CREATE TABLE classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,  -- e.g., "A1", "C2", "Science Lab 3"
  building TEXT,
  floor TEXT,
  capacity INTEGER,
  room_type TEXT DEFAULT 'classroom',  -- 'classroom' | 'lab' | 'library' | 'gym' | 'auditorium'
  facilities TEXT,  -- Comma-separated: "projector,whiteboard,computers"
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**teachers**
```sql
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  subjects TEXT,  -- Comma-separated subjects taught
  department TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**courses**
```sql
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL,  -- e.g., "MATH101", "ENG201"
  name TEXT NOT NULL,  -- e.g., "Introduction to Algebra", "American Literature"
  subject TEXT NOT NULL,  -- e.g., "Math", "English", "Science"
  grade_level TEXT,  -- e.g., "10th", "11th", "12th"
  credits REAL,  -- e.g., 1.0, 0.5
  description TEXT,
  prerequisites TEXT,  -- Comma-separated course codes
  department TEXT,  -- e.g., "Mathematics", "English", "Science"
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_grade ON courses(grade_level);
```

**classes**
```sql
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,  -- References the course template
  section TEXT NOT NULL,  -- e.g., "A", "B", "1", "2" - distinguishes multiple sections
  teacher_id TEXT NOT NULL,
  classroom_id TEXT NOT NULL,
  period INTEGER NOT NULL,  -- 1-8 typically
  schedule_day TEXT NOT NULL,  -- Day of week or "daily"
  start_time TEXT,  -- e.g., "08:00"
  end_time TEXT,  -- e.g., "08:50"
  academic_year TEXT,  -- e.g., "2024-2025"
  semester TEXT,  -- e.g., "Fall", "Spring", "Full Year"
  max_students INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

CREATE INDEX idx_classes_course ON classes(course_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_classroom ON classes(classroom_id);
CREATE INDEX idx_classes_period ON classes(period, schedule_day);
CREATE INDEX idx_classes_year ON classes(academic_year);
```

**class_enrollments**
```sql
CREATE TABLE class_enrollments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  enrolled_date TEXT,
  status TEXT DEFAULT 'active',  -- 'active' | 'dropped' | 'completed'
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_student ON class_enrollments(student_id);
```

**student_faces**
```sql
CREATE TABLE student_faces (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  face_id TEXT NOT NULL,  -- AWS Rekognition Face ID
  photo_url TEXT,
  indexed_at TEXT,
  quality_score REAL,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_faces_student ON student_faces(student_id);
CREATE INDEX idx_faces_faceid ON student_faces(face_id);
```

**sessions**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  classroom_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  expected_students INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  photo_url TEXT,
  aws_faces_detected INTEGER,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_sessions_date ON sessions(timestamp);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
```

**attendance**
```sql
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  class_id TEXT NOT NULL,  -- Denormalized for quick queries
  classroom_id TEXT,  -- Denormalized for location context
  status TEXT NOT NULL,  -- 'present' | 'absent' | 'excused' | 'late'
  confidence REAL,  -- AWS Rekognition confidence score (0-100)
  face_id TEXT,  -- AWS Face ID if detected
  marked_at TEXT,
  marked_by TEXT,  -- 'auto' | teacher_id
  corrected BOOLEAN DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(marked_at);
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

**~~sms_notifications~~ (OPTIONAL - Skip for hackathon)**
```sql
-- Not needed for core demo
-- Can add post-hackathon if SMS follow-up is implemented
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

## 🏛️ Data Model Architecture

### Key Design Decisions

**Courses vs Classes**:
- **`courses`** = Template/master definition (e.g., "MATH101 - Introduction to Algebra")
  - Defines the curriculum, subject, grade level, credits
  - Created once and reused across multiple academic years
  - Example: "MATH101" is defined once but taught every semester
  
- **`classes`** = Specific section instance (e.g., "MATH101 - Section A")
  - References a course template via `course_id`
  - Has specific teacher, classroom, period, semester
  - Multiple sections can share the same course (e.g., Section A, B, C)
  - Example: Three teachers teaching three sections of MATH101

**Multi-Classroom Support**: 
- Students attend different classes in different rooms (e.g., Math in A1, English in C2, Science in B3)
- The `attendance` table stores `classroom_id` to track physical location
- The `sessions` table links each attendance session to both a class and its classroom
- Allows tracking of student movement between classrooms throughout the day

**Dynamic Class Rosters**:
- The `classes` table defines a specific class section (course + section + teacher + classroom + period)
- The `class_enrollments` table creates the many-to-many relationship between students and class sections
- Teachers don't always have the same students; enrollment is per-section basis
- A student can be enrolled in multiple class sections with different teachers

**Teacher-Class Relationships**:
- One teacher can teach multiple classes (different courses, sections, periods)
- Each class section has one primary teacher assigned
- The `sessions` table captures the teacher who conducted each attendance session

**Attendance Tracking**:
- Attendance is recorded per-session, where each session represents one class section meeting in one location
- The `attendance` table denormalizes `class_id` and `classroom_id` for efficient querying
- This allows queries like "Show all students absent from Room A1 today" or "Show student's attendance across all their classes"

### Example Scenario

**Course Definitions** (Master Templates):
- **ENG201**: "American Literature" (English, 10th grade, 1.0 credit)
- **MATH101**: "Introduction to Algebra" (Math, 10th grade, 1.0 credit)
- **CHEM201**: "Chemistry Lab" (Science, 10th grade, 1.0 credit)
- **HIST201**: "World History" (Social Studies, 10th grade, 1.0 credit)

**Class Sections** (Specific Instances):
- **ENG201-A**: Section A, Teacher: Mrs. Smith, Room C2, Period 1
- **MATH101-A**: Section A, Teacher: Mr. Johnson, Room A1, Period 2
- **CHEM201-B**: Section B, Teacher: Dr. Lee, Room B3, Period 3
- **HIST201-A**: Section A, Teacher: Ms. Garcia, Room D1, Period 4

**Student Profile**: Sofia Martinez (Grade 10)
- Enrolled in: ENG201-A, MATH101-A, CHEM201-B, HIST201-A

**Monday Schedule**:
- Period 1: ENG201-A (Mrs. Smith) in Room C2
- Period 2: MATH101-A (Mr. Johnson) in Room A1
- Period 3: CHEM201-B (Dr. Lee) in Room B3
- Period 4: HIST201-A (Ms. Garcia) in Room D1

**Attendance Tracking**:
```
Session 1 (08:00): ENG201-A in C2 - Sofia is PRESENT
Session 2 (09:00): MATH101-A in A1 - Sofia is ABSENT (not in photo)
Session 3 (10:00): CHEM201-B in B3 - Sofia is ABSENT
Session 4 (11:00): HIST201-A in D1 - Sofia is ABSENT
```

**AI Reasoning Analysis**:
- Pattern detected: Present in C2 (ENG201-A), then absent from A1, B3, D1
- Classification: "sneak_out" - likely left campus after first period
- Action: Immediate parent notification

---

### AWS Rekognition Data Structure

**Collections**
```
Collection ID format: "eduguard-school-[school_id]"
Example: "eduguard-school-12345"

One collection per school containing all student faces
```

**Face Records**
```json
{
  "FaceId": "aws-face-abc123",
  "ExternalImageId": "student_123_photo_1",
  "ImageId": "aws-image-xyz789",
  "Confidence": 99.9,
  "BoundingBox": {
    "Width": 0.089,
    "Height": 0.123,
    "Left": 0.234,
    "Top": 0.156
  },
  "Quality": {
    "Brightness": 85.2,
    "Sharpness": 92.3
  }
}
```

**Linking Strategy**:
- ExternalImageId contains student_id for reverse lookup
- Face ID stored in D1 `student_faces` table
- Enables bidirectional mapping between AWS and local database

---

## 🔐 AWS Rekognition Integration Details

### Required AWS Setup

**IAM Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateCollection",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:DetectFaces",
        "rekognition:DeleteFaces",
        "rekognition:ListFaces",
        "rekognition:DescribeCollection"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::eduguard-photos/*"
    }
  ]
}
```

**Environment Variables in Cloudflare Workers**:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_REKOGNITION_COLLECTION=eduguard-school-12345
R2_BUCKET_NAME=eduguard-photos
```

### Worker Implementation Pattern

```typescript
// Cloudflare Worker with AWS SDK
import { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";

export default {
  async fetch(request, env) {
    const rekognition = new RekognitionClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    // Use rekognition client for face operations
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Hours 0-3)
- [ ] Set up Cloudflare Workers project
- [ ] Initialize D1 database with schema (including student_faces table)
- [ ] Set up AWS account and Rekognition collection
- [ ] Configure IAM permissions and credentials
- [ ] Set up React + Vite frontend
- [ ] Configure ElevenLabs agent
- [ ] Implement authentication
- [ ] **Mobile-first responsive design setup (TailwindCSS)**
- [ ] **Touch-optimized component library integration**

### Phase 2: Vision Agent with AWS Rekognition (Hours 3-6)
- [ ] Build student enrollment page
- [ ] Implement photo upload to R2
- [ ] Integrate AWS Rekognition IndexFaces API
- [ ] Store Face IDs in D1
- [ ] Build attendance capture UI
- [ ] Implement AWS Rekognition SearchFacesByImage
- [ ] Map Face IDs to student records
- [ ] Test with mock students
- [ ] **Mobile camera integration with native HTML5 capture**
- [ ] **Mobile-optimized photo preview and retake flow**
- [ ] **Responsive attendance results display for mobile screens**

### Phase 3: Voice Agent (Hours 6-9)
- [ ] Integrate ElevenLabs API
- [ ] Build call initiation endpoint
- [ ] Configure Spanish conversation flow
- [ ] Implement webhook handler
- [ ] Test call flow end-to-end

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
- [ ] **Mobile responsiveness testing on real devices**
- [ ] **Touch gesture optimization (swipe, pull-to-refresh)**
- [ ] **Performance optimization for mobile networks**
- [ ] **PWA manifest for app-like experience**

### ~~Phase 6: SMS Integration (OPTIONAL - POST-HACKATHON)~~
- ~~[ ] Integrate Twilio~~
- ~~[ ] Build SMS templates~~
- ~~[ ] Implement delivery tracking~~

---

## 🎯 Success Metrics

**Technical Performance**:
- Attendance capture: <2 seconds (AWS Rekognition standard)
- Face recognition accuracy: >98% (AWS Rekognition guarantee)
- Call connection rate: >90%
- System uptime: 99.9%

**User Impact**:
- Time saved: 8-10 minutes per class
- Parent notification speed: <5 minutes from absence
- False positive rate: <2% (AWS Rekognition)
- Teacher satisfaction: >4.5/5

**Business Value**:
- Reduced chronic absenteeism by 30%
- Same-day truancy detection: 100% of sneak-out attempts
- Parent engagement increase: 60%
- Early intervention: 3-7 days faster than current

---

## 💰 Cost Considerations

### AWS Rekognition Pricing (Estimated)

**Face Indexing (Enrollment)**:
- $1.00 per 1,000 faces indexed
- 200 students × 3 photos = 600 faces = $0.60

**Face Search (Attendance)**:
- $1.00 per 1,000 searches
- 8 periods/day × 30 students × 20 days = 4,800 searches/month = $4.80/month

**Storage**:
- $0.01 per 1,000 faces/month
- 600 faces = $0.01/month

**Total Monthly Cost**: ~$5-10 for typical school

### Cloudflare Costs
- Workers: Free tier sufficient for hackathon
- D1: Free tier sufficient
- R2: $0.015/GB storage

---

## 📝 Conclusion

EduGuard transforms school attendance from a manual administrative burden into an intelligent, proactive safety system. By combining AWS Rekognition's enterprise-grade facial recognition, AI reasoning via Vercel AI SDK, and conversational voice agents via ElevenLabs on a Cloudflare edge infrastructure, we deliver a solution that is fast, accurate, and scalable.

**Core Innovation**: Three AI agents working in concert (Vision → Reasoning → Voice) to close the loop from photo to parent notification in under 5 minutes.

**AWS Rekognition Advantage**: Enterprise-grade accuracy (>98%), managed service (no ML expertise needed), automatic quality filtering, and proven at scale.

**Hackathon Advantage**: Novel multi-agent approach with live voice demo that solves a real, urgent problem in education safety, powered by best-in-class AI services.

**Note**: SMS follow-up is marked as optional and can be added post-hackathon as a polish feature. The core demo focuses on the photo-to-call pipeline which delivers the primary value proposition.