# 🤖 AI AGENTS PRIORITY PLAN - 15 Hour Sprint

**Deadline: Today 3:00 PM | Current: 12:00 AM**

> **CORE VISION**: Demo the complete 3-Agent AI pipeline: Vision → Reasoning → Voice

---

## ✅ CURRENT STATE AUDIT

### Agent 1: Vision Agent (AWS Rekognition) - **100% COMPLETE** ✅

**What's Working:**

- ✅ Student face enrollment (IndexFaces API)
- ✅ Multi-photo classroom capture (1-10 photos)
- ✅ Face detection & matching (DetectFaces + SearchFacesByImage)
- ✅ Confidence scoring (95%+ confirmed, 80-95% needs review)
- ✅ Present/Absent student lists with bounding boxes
- ✅ Debug mode with visual overlays
- ✅ R2 storage integration
- ✅ Presigned upload flow

**Location:** `apps/api-v2/src/routes/attendance.ts`

### Agent 2: Reasoning Agent - **NOT IMPLEMENTED** ❌

**What's Missing:**

- Pattern detection (sneak-out, chronic absence)
- Risk assessment logic
- LLM integration for analysis
- Flagging system for at-risk students

### Agent 3: Voice Agent - **NOT IMPLEMENTED** ❌

**What's Missing:**

- ElevenLabs API integration
- Parent notification calling
- Call status tracking
- DTMF response handling

---

## 🎯 15-HOUR IMPLEMENTATION PLAN

### **Hour 0-2 (12:00 AM - 2:00 AM): Setup & Dependencies**

#### Task 1.1: Install Vercel AI SDK

```bash
# In apps/api-v2
pnpm add ai @ai-sdk/openai

# In apps/teacher-client
pnpm add ai @ai-sdk/react
```

#### Task 1.2: Install ElevenLabs SDK

```bash
# In apps/api-v2
pnpm add elevenlabs
```

#### Task 1.3: Environment Variables

Add to `apps/api-v2/.dev.vars`:

```bash
OPENAI_API_KEY="sk-..."
ELEVENLABS_API_KEY="..."
```

Add to `wrangler.jsonc`:

```json
{
  "vars": {
    "OPENAI_API_KEY": "",
    "ELEVENLABS_API_KEY": ""
  }
}
```

---

### **Hour 2-5 (2:00 AM - 5:00 AM): Agent 2 - Reasoning Agent**

#### Task 2.1: Create Reasoning Route (1 hour)

**File:** `apps/api-v2/src/routes/reasoning.ts`

**Endpoint:** `POST /api/reasoning/analyze`

**Functionality:**

1. Receive student_id + session_id
2. Query last 7 days of attendance for that student
3. Analyze pattern using GPT-4 via Vercel AI SDK
4. Return risk assessment

**Implementation:**

```typescript
import { Hono } from "hono";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { attendance, sessions, students } from "../db/schema";

const reasoning = new Hono<{ Bindings: Bindings }>();

const RiskAssessmentSchema = z.object({
  risk_level: z.enum(["none", "low", "medium", "high"]),
  pattern_type: z.enum(["normal", "sneak_out", "chronic", "irregular"]),
  confidence: z.number().min(0).max(1),
  should_notify: z.boolean(),
  reasoning: z.string(),
  recommended_action: z.enum(["none", "monitor", "immediate_call"]),
});

reasoning.post("/analyze", async (c) => {
  const { student_id, session_id } = await c.req.json();
  const db = drizzle(c.env.DB);

  // Get student's last 7 days of attendance
  const recentAttendance = await db
    .select({
      date: sessions.timestamp,
      status: attendance.status,
      classId: attendance.classId,
      confidence: attendance.confidence,
    })
    .from(attendance)
    .innerJoin(sessions, eq(attendance.sessionId, sessions.id))
    .where(eq(attendance.studentId, student_id))
    .orderBy(desc(sessions.timestamp))
    .limit(50);

  // Get today's attendance
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = recentAttendance.filter((a) =>
    a.date.startsWith(today),
  );

  // Call GPT-4 for analysis
  const result = await generateObject({
    model: openai("gpt-4o-mini"), // Faster, cheaper for MVP
    schema: RiskAssessmentSchema,
    prompt: `You are an expert school attendance analyst. Analyze this student's attendance pattern:

TODAY'S ATTENDANCE (${today}):
${todayAttendance.map((a) => `- ${a.status} (confidence: ${a.confidence || "N/A"})`).join("\n")}

LAST 7 DAYS:
${recentAttendance
  .slice(0, 20)
  .map((a) => `- ${a.date}: ${a.status}`)
  .join("\n")}

DETECTION RULES:
1. SNEAK-OUT: Present in first period, absent in 2+ subsequent periods same day
2. CHRONIC: Absent 3+ times in past 7 days
3. IRREGULAR: Random absences with no clear pattern

Assess the risk level and recommend action.`,
  });

  return c.json({
    student_id,
    session_id,
    analysis: result.object,
    analyzed_at: new Date().toISOString(),
  });
});

export default reasoning;
```

#### Task 2.2: Integrate Reasoning into Attendance Flow (30 min)

**Update:** `apps/api-v2/src/routes/attendance.ts`

After creating attendance session, trigger reasoning for absent students:

```typescript
// After line ~600 in attendance.ts (after session creation)

// Trigger reasoning for absent students
const absentStudentIds = absentStudents.map((s) => s.studentId);

if (absentStudentIds.length > 0) {
  // Fire-and-forget reasoning analysis
  c.executionCtx.waitUntil(
    Promise.all(
      absentStudentIds.map(async (studentId) => {
        try {
          await fetch(`${new URL(c.req.url).origin}/api/reasoning/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: studentId,
              session_id: sessionId,
            }),
          });
        } catch (err) {
          console.error("Reasoning analysis failed:", err);
        }
      }),
    ),
  );
}
```

#### Task 2.3: Frontend - Risk Badge Component (30 min)

**File:** `apps/teacher-client/src/components/ui/risk-badge.tsx`

Display risk level on student cards in attendance results.

#### Task 2.4: Add Reasoning Endpoint to Routes (15 min)

**Update:** `apps/api-v2/src/index.ts`

```typescript
import reasoning from "./routes/reasoning";
app.route("/api/reasoning", reasoning);
```

#### Task 2.5: Test Reasoning Agent (45 min)

1. Enroll 3 test students
2. Create attendance sessions with different patterns
3. Verify GPT-4 correctly identifies sneak-outs
4. Check response times (<3 seconds)

---

### **Hour 5-8 (5:00 AM - 8:00 AM): Agent 3 - Voice Agent (ElevenLabs)**

#### Task 3.1: Create Voice Agent Route (1.5 hours)

**File:** `apps/api-v2/src/routes/voice.ts`

**Endpoint:** `POST /api/voice/call`

**Functionality:**

1. Receive student_id + risk_assessment
2. Get student's guardian phone
3. Call ElevenLabs Conversational AI API
4. Initiate Spanish voice call to parent
5. Track call status

**Implementation:**

```typescript
import { Hono } from "hono";
import { ElevenLabsClient, ElevenLabs } from "elevenlabs";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { students, legalGuardians } from "../db/schema";

const voice = new Hono<{ Bindings: Bindings }>();

voice.post("/call", async (c) => {
  const { student_id, risk_level, reason } = await c.req.json();
  const db = drizzle(c.env.DB);

  // Get student and guardian info
  const student = await db
    .select({
      studentName: students.firstName,
      studentLastName: students.lastName,
      guardianId: students.guardianId,
    })
    .from(students)
    .where(eq(students.id, student_id))
    .limit(1);

  if (!student.length) {
    return c.json({ error: "Student not found" }, 404);
  }

  const guardian = await db
    .select({
      phone: legalGuardians.phone,
      name: legalGuardians.firstName,
    })
    .from(legalGuardians)
    .where(eq(legalGuardians.id, student[0].guardianId))
    .limit(1);

  if (!guardian.length || !guardian[0].phone) {
    return c.json({ error: "Guardian phone not found" }, 404);
  }

  // Initialize ElevenLabs client
  const elevenlabs = new ElevenLabsClient({
    apiKey: c.env.ELEVENLABS_API_KEY,
  });

  const studentFullName = `${student[0].studentName} ${student[0].studentLastName}`;

  // Create conversational agent call
  try {
    const conversation = await elevenlabs.conversationalAi.createConversation({
      agentId: "your-agent-id", // You'll create this in ElevenLabs dashboard
    });

    // Start the call
    const call = await elevenlabs.conversationalAi.startCall({
      conversationId: conversation.conversation_id,
      phoneNumber: guardian[0].phone,
      systemPrompt: `You are calling ${guardian[0].name}, the guardian of student ${studentFullName}. 
The student was absent from class today. 
Speak in Spanish. Ask the guardian:
1. Are they aware of the absence?
2. Is the student safe at home?
3. Press 1 if justified absence, 2 if they didn't know, 3 if student is arriving late.`,
    });

    return c.json({
      call_id: call.call_id,
      conversation_id: conversation.conversation_id,
      status: "initiated",
      guardian_phone: guardian[0].phone,
      student_name: studentFullName,
      initiated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ElevenLabs call failed:", error);
    return c.json(
      {
        error: "Failed to initiate call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Webhook to receive call results
voice.post("/webhook/call-completed", async (c) => {
  const payload = await c.req.json();

  // Log call outcome to database (implement later)
  console.log("Call completed:", payload);

  return c.json({ received: true });
});

// Get call status
voice.get("/call/:call_id", async (c) => {
  const callId = c.req.param("call_id");

  const elevenlabs = new ElevenLabsClient({
    apiKey: c.env.ELEVENLABS_API_KEY,
  });

  try {
    const status = await elevenlabs.conversationalAi.getCallStatus({
      callId,
    });

    return c.json(status);
  } catch (error) {
    return c.json({ error: "Failed to get call status" }, 500);
  }
});

export default voice;
```

#### Task 3.2: Create ElevenLabs Agent in Dashboard (30 min)

**Manual Setup:**

1. Go to ElevenLabs Dashboard
2. Create Conversational AI Agent
3. Configure:
   - Language: Spanish (es-ES)
   - Voice: Professional female Spanish voice
   - System Prompt: (see above)
   - Enable DTMF: Yes
4. Copy Agent ID to code

#### Task 3.3: Add Voice Route to API (15 min)

**Update:** `apps/api-v2/src/index.ts`

```typescript
import voice from "./routes/voice";
app.route("/api/voice", voice);
```

#### Task 3.4: Frontend - Call Button Component (45 min)

**File:** `apps/teacher-client/src/components/attendance/CallParentButton.tsx`

Button that appears when student is flagged high-risk.
Shows call status and plays recording after completion.

---

### **Hour 8-10 (8:00 AM - 10:00 AM): Integration & Demo Flow**

#### Task 4.1: Connect All 3 Agents (1 hour)

**Update:** `apps/api-v2/src/routes/attendance.ts`

After attendance capture:

1. ✅ Vision Agent detects faces (existing)
2. ➕ Reasoning Agent analyzes patterns (NEW)
3. ➕ If high-risk, offer to call parent via Voice Agent (NEW)

**Pseudo-flow:**

```typescript
// 1. Vision Agent (existing)
const attendanceResult = await processAttendance(photos);

// 2. Reasoning Agent (new)
const absentStudents = attendanceResult.absent_students;
for (const student of absentStudents) {
  const analysis = await analyzeAttendance(student.student_id);

  // 3. Voice Agent (new - if high risk)
  if (analysis.risk_level === "high" && analysis.should_notify) {
    // Return flag to frontend, let teacher initiate call
    student.flagged = true;
    student.risk_info = analysis;
  }
}
```

#### Task 4.2: Update Attendance Results UI (1 hour)

**Update:** `apps/teacher-client/src/pages/ClassAttendancePage.tsx`

Add to absent students section:

- Risk badge (high/medium/low)
- "Call Parent" button for high-risk students
- Modal showing reasoning explanation

---

### **Hour 10-12 (10:00 AM - 12:00 PM): Testing & Polish**

#### Task 5.1: End-to-End Test (1 hour)

**Demo Flow:**

1. Enroll student "Sofia Martinez" with guardian phone
2. Take attendance for Period 1 → Sofia present
3. Take attendance for Period 2 → Sofia absent
4. System flags Sofia as "high risk - sneak out"
5. Teacher clicks "Call Parent"
6. ElevenLabs calls guardian in Spanish
7. Guardian responds via DTMF
8. System shows call outcome

#### Task 5.2: Error Handling & Loading States (30 min)

- Add loading spinners during LLM analysis
- Handle API failures gracefully
- Add retry logic for failed calls

#### Task 5.3: UI Polish (30 min)

- Make risk badges visually prominent
- Add animations for flagged students
- Improve call status display

---

### **Hour 12-14 (12:00 PM - 2:00 PM): Demo Prep**

#### Task 6.1: Create Demo Seed Data (45 min)

**Update:** `apps/api-v2/src/db/seed.ts`

Add:

- 5 students with realistic photos
- 1 student with "sneak-out" pattern
- Guardian with real phone number for demo

#### Task 6.2: Write Demo Script (45 min)

**Create:** `DEMO_SCRIPT.md`

Talking points:

1. Show Vision Agent (photo → faces detected)
2. Show Reasoning Agent (pattern analysis)
3. Live Voice Agent call to real phone
4. Show complete AI pipeline

#### Task 6.3: Backup Plan (30 min)

- Record successful call ahead of time
- Take screenshots of each step
- Prepare video fallback if APIs fail

---

### **Hour 14-15 (2:00 PM - 3:00 PM): Buffer & Final Testing**

- Fix any last-minute bugs
- Practice demo 2-3 times
- Ensure all env vars are set
- Test on phone/mobile

---

## 📦 DEPENDENCIES CHECKLIST

### API Keys Needed:

- ✅ AWS Credentials (already have - Rekognition working)
- ✅ OpenAI API Key (already installed, just need key)
- ⚠️ ElevenLabs API Key (need to sign up)

### ElevenLabs Setup (30 min):

1. Sign up: https://elevenlabs.io/
2. Create Conversational AI Agent
3. Get API key
4. Test with curl

---

## 🎯 SUCCESS CRITERIA

### Minimum Viable Demo (Must Have):

- ✅ Vision Agent: Photo → Detected students
- ✅ Reasoning Agent: GPT-4 analyzes pattern, flags high-risk
- ✅ Voice Agent: Actual phone call to guardian in Spanish

### Nice to Have (If Time):

- Call recording playback in UI
- DTMF response handling
- Multiple risk patterns detection
- Call history log

---

## 🚨 RISK MITIGATION

### If Behind Schedule:

**Priority 1:** Vision + Reasoning only (skip voice)

- Still impressive: "AI detects sneak-outs automatically"

**Priority 2:** Vision + Pre-recorded voice demo

- Show call UI, play pre-recorded call audio

**Priority 3:** Vision only with detailed explanation

- Walk through where agents would fit

### If APIs Fail During Demo:

- Use backup screenshots
- Show code walking through logic
- Play pre-recorded success video

---

## 💡 KEY TALKING POINTS

### Why 3 AI Agents?

"Traditional systems just track who's present. We built 3 specialized AI agents that work together:

1. **Vision Agent** - AWS Rekognition instantly identifies faces
2. **Reasoning Agent** - GPT-4 detects dangerous patterns like mid-day sneak-outs
3. **Voice Agent** - ElevenLabs calls parents immediately in Spanish with conversational AI

This transforms attendance from a checkbox into a student safety system."

### The "Sneak-Out" Problem:

"Students who are present first period but absent in periods 2-3 have likely left campus without permission. Traditional systems never catch this because teachers only see their own class. Our Reasoning Agent sees the full day pattern and flags it instantly."

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Vercel AI SDK Advantages:

- Provider-agnostic (OpenAI today, Anthropic tomorrow)
- TypeScript-first with type-safe schemas (Zod)
- Built-in streaming support
- `generateObject()` for structured outputs

### ElevenLabs Conversational AI:

- Natural Spanish voice (not robotic)
- DTMF (phone keypad) support for responses
- Webhook callbacks for call results
- Low latency (~2 seconds to connect)

### Architecture:

```
Teacher takes photo
    ↓
Vision Agent (AWS Rekognition) - 2 seconds
    ↓
List of absent students
    ↓
Reasoning Agent (GPT-4) - 3 seconds
    ↓
High-risk students flagged
    ↓
Teacher clicks "Call Parent"
    ↓
Voice Agent (ElevenLabs) - 5 seconds to connect
    ↓
Parent receives call in Spanish
```

**Total time from photo to parent's phone ringing: <10 seconds**

---

## 📝 FILES TO CREATE

### Backend:

1. `apps/api-v2/src/routes/reasoning.ts` (Reasoning Agent)
2. `apps/api-v2/src/routes/voice.ts` (Voice Agent)
3. Update `apps/api-v2/src/index.ts` (add routes)
4. Update `apps/api-v2/src/routes/attendance.ts` (integrate agents)

### Frontend:

1. `apps/teacher-client/src/components/ui/risk-badge.tsx`
2. `apps/teacher-client/src/components/attendance/CallParentButton.tsx`
3. `apps/teacher-client/src/components/attendance/RiskAssessmentModal.tsx`
4. Update `apps/teacher-client/src/pages/ClassAttendancePage.tsx`

### Documentation:

1. `DEMO_SCRIPT.md` (presentation talking points)
2. `AGENT_ARCHITECTURE.md` (technical deep-dive)

---

## 🎬 DEMO NARRATIVE

**Opening:**
"Attendance seems simple - just mark who's here, right? But we saw a bigger problem: students sneaking out mid-day, and parents finding out days later. So we built a 3-agent AI system."

**Act 1 - Vision Agent:**
"Watch this. I take one photo of the classroom..." [snap photo]
"In 2 seconds, AWS Rekognition has identified every student. 95%+ accuracy."

**Act 2 - Reasoning Agent:**
"But here's where it gets smart. Notice Sofia Martinez is absent. The system checks her history..." [show analysis]
"GPT-4 detected a pattern: she was here first period but disappeared. Classic sneak-out."

**Act 3 - Voice Agent:**
"Now here's the magic. I click this button..." [clicks Call Parent]
"ElevenLabs is now calling her mom, in Spanish, with conversational AI."
[Phone rings, plays on speaker]
"Hola, ¿es la mamá de Sofia Martinez? Su hija no asistió a clase hoy..."

**Closing:**
"From photo to parent's phone in under 10 seconds. That's the power of specialized AI agents working together."

---

## ⚡ QUICK START (RIGHT NOW)

```bash
# 1. Install dependencies (5 min)
cd apps/api-v2
pnpm add ai @ai-sdk/openai elevenlabs

# 2. Add env vars to .dev.vars
echo 'OPENAI_API_KEY="sk-..."' >> .dev.vars
echo 'ELEVENLABS_API_KEY="..."' >> .dev.vars

# 3. Create reasoning route (start coding!)
touch src/routes/reasoning.ts

# 4. GO GO GO! 🚀
```

**Remember: You already have 33% done (Vision Agent works perfectly). Just add the other 67%!**
