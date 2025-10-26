# 🚀 NEXT STEPS - AI Agents Integration (15 Hours Remaining)

**Current Time:** 12:30 AM  
**Deadline:** 3:00 PM Today

## ✅ COMPLETED (30 minutes)

- [x] Created Node.js AI Agents server (`apps/ai-agents/`)
- [x] Installed Vercel AI SDK + ElevenLabs SDK
- [x] Built Reasoning Agent (GPT-4 pattern detection)
- [x] Built Voice Agent (ElevenLabs conversational AI)
- [x] Wrote comprehensive documentation

## 🔥 IMMEDIATE TODO (Next 14.5 Hours)

### Hour 1-2 (12:30 AM - 2:30 AM): Setup & Test AI Agents

#### 1. Get API Keys (30 min)

**OpenAI:**

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `apps/ai-agents/.env`:
   ```bash
   OPENAI_API_KEY=sk-proj-...
   ```

**ElevenLabs:**

1. Sign up at https://elevenlabs.io/
2. Go to https://elevenlabs.io/app/conversational-ai
3. Click "Create Agent"
4. Configure:
   - Name: "EduGuard Parent Notifier"
   - Language: Spanish (es-ES)
   - Voice: Select professional female Spanish voice
   - Enable DTMF: Yes
5. Copy Agent ID to `.env`:
   ```bash
   ELEVENLABS_AGENT_ID=your-agent-id
   ELEVENLABS_API_KEY=your-api-key
   ```

#### 2. Test AI Agents Server (30 min)

```bash
cd apps/ai-agents

# Start server
pnpm dev
```

Should see:

```
🤖 AI Agents Server starting on port 3001...
✅ AI Agents Server running at http://localhost:3001
📊 Reasoning Agent: Ready (GPT-4)
📞 Voice Agent: Ready (ElevenLabs)
```

#### 3. Test Reasoning Agent (30 min)

```bash
curl -X POST http://localhost:3001/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-123",
    "student_name": "Sofia Martinez",
    "session_id": "session-test",
    "today_attendance": [
      { "period": 1, "status": "present", "confidence": 99.5 },
      { "period": 2, "status": "absent" }
    ],
    "history_7d": [
      { "date": "2025-10-25", "status": "present" },
      { "date": "2025-10-24", "status": "present" }
    ]
  }'
```

**Expected Response:**

```json
{
  "analysis": {
    "risk_level": "high",
    "pattern_type": "sneak_out",
    "should_notify": true,
    "reasoning": "Student present Period 1, absent Period 2..."
  }
}
```

#### 4. Test Voice Agent (30 min)

⚠️ **Use YOUR phone number for testing!**

```bash
curl -X POST http://localhost:3001/api/voice/call \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-123",
    "student_name": "Test Student",
    "guardian_name": "Your Name",
    "guardian_phone": "+56YOUR_PHONE",
    "risk_level": "high",
    "pattern_type": "sneak_out",
    "reasoning": "Test call",
    "class_name": "Test Class"
  }'
```

Your phone should ring in ~5 seconds!

---

### Hour 3-5 (2:30 AM - 4:30 AM): Connect to Cloudflare Workers

#### 5. Add AI Agents URL to Cloudflare Workers (15 min)

**File:** `apps/api-v2/.dev.vars`

```bash
AI_AGENTS_URL=http://localhost:3001
```

**File:** `apps/api-v2/wrangler.jsonc`

```json
{
  "vars": {
    "AI_AGENTS_URL": "http://localhost:3001"
  }
}
```

#### 6. Update Attendance Route to Call AI Agents (45 min)

**File:** `apps/api-v2/src/routes/attendance.ts`

After line ~620 (after creating attendance session), add:

```typescript
// Trigger AI analysis for absent students
const aiAgentsUrl = c.env.AI_AGENTS_URL || "http://localhost:3001";

if (absentStudents.length > 0) {
  // Fire-and-forget AI analysis
  c.executionCtx.waitUntil(
    (async () => {
      try {
        for (const student of absentStudents) {
          // Get student's recent attendance history
          const history = await db
            .select({
              date: sessionsTable.timestamp,
              status: attendanceTable.status,
              period: classesTable.period,
              className: coursesTable.name,
            })
            .from(attendanceTable)
            .innerJoin(
              sessionsTable,
              eq(attendanceTable.sessionId, sessionsTable.id),
            )
            .innerJoin(classesTable, eq(sessionsTable.classId, classesTable.id))
            .innerJoin(coursesTable, eq(classesTable.courseId, coursesTable.id))
            .where(eq(attendanceTable.studentId, student.studentId))
            .orderBy(desc(sessionsTable.timestamp))
            .limit(50);

          // Get today's attendance
          const today = new Date().toISOString().split("T")[0];
          const todayRecords = history.filter((h) => h.date.startsWith(today));

          // Call Reasoning Agent
          const response = await fetch(`${aiAgentsUrl}/api/reasoning/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: student.studentId,
              student_name: student.name,
              session_id: sessionId,
              today_attendance: todayRecords,
              history_7d: history,
            }),
          });

          if (response.ok) {
            const analysis = await response.json();

            // Store risk info in metadata or separate table
            // For now, log it
            console.log(
              `🧠 AI Analysis for ${student.name}:`,
              analysis.analysis,
            );

            // Attach to response if high risk
            if (analysis.analysis.risk_level === "high") {
              student.risk_flag = analysis.analysis;
            }
          }
        }
      } catch (err) {
        console.error("AI analysis failed:", err);
      }
    })(),
  );
}
```

#### 7. Test End-to-End Flow (1 hour)

1. Start both servers:

   ```bash
   # Terminal 1: Cloudflare Workers
   cd apps/api-v2
   pnpm dev

   # Terminal 2: AI Agents
   cd apps/ai-agents
   pnpm dev

   # Terminal 3: Frontend
   cd apps/teacher-client
   pnpm dev
   ```

2. Test flow:
   - Enroll student with photos
   - Take attendance Period 1 (student present)
   - Take attendance Period 2 (student absent)
   - Check AI Agents logs for analysis
   - Verify `risk_flag` in API response

---

### Hour 6-8 (4:30 AM - 6:30 AM): Frontend Integration

#### 8. Create Risk Badge Component (30 min)

**File:** `apps/teacher-client/src/components/ui/risk-badge.tsx`

```typescript
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level: "none" | "low" | "medium" | "high";
  pattern?: string;
}

export function RiskBadge({ level, pattern }: RiskBadgeProps) {
  const config = {
    none: { color: "bg-gray-100 text-gray-800", icon: "✓" },
    low: { color: "bg-yellow-100 text-yellow-800", icon: "⚠" },
    medium: { color: "bg-orange-100 text-orange-800", icon: "⚠️" },
    high: { color: "bg-red-100 text-red-800 font-bold", icon: "🚨" },
  };

  const { color, icon } = config[level];

  return (
    <Badge className={color}>
      {icon} {level.toUpperCase()}
      {pattern && ` - ${pattern}`}
    </Badge>
  );
}
```

#### 9. Add Call Parent Button Component (45 min)

**File:** `apps/teacher-client/src/components/attendance/CallParentButton.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CallParentButtonProps {
  studentId: string;
  studentName: string;
  guardianPhone: string;
  riskInfo: any;
}

export function CallParentButton({
  studentId,
  studentName,
  guardianPhone,
  riskInfo
}: CallParentButtonProps) {
  const [calling, setCalling] = useState(false);

  const handleCall = async () => {
    setCalling(true);
    try {
      const response = await fetch('http://localhost:3001/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          guardian_phone: guardianPhone,
          risk_level: riskInfo.risk_level,
          pattern_type: riskInfo.pattern_type,
          reasoning: riskInfo.reasoning,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Llamando a apoderado de ${studentName}...`);
        // Poll for call status
        // TODO: Add status tracking
      } else {
        toast.error(result.error || 'Error al iniciar llamada');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setCalling(false);
    }
  };

  return (
    <Button
      onClick={handleCall}
      disabled={calling}
      variant="destructive"
      size="sm"
    >
      {calling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Llamando...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4 mr-2" />
          Llamar Apoderado
        </>
      )}
    </Button>
  );
}
```

#### 10. Update ClassAttendancePage (45 min)

**File:** `apps/teacher-client/src/pages/ClassAttendancePage.tsx`

In the absent students section (~line 410), add:

```typescript
import { RiskBadge } from "@/components/ui/risk-badge";
import { CallParentButton } from "@/components/attendance/CallParentButton";

// In the absent students map:
{attendanceResult.absent_students.map((student) => (
  <div key={student.student_id} className="p-3 bg-red-50 rounded-lg border border-red-200">
    <div className="font-medium">{student.name}</div>
    <div className="text-sm text-muted-foreground">
      RUT: {student.identification}
    </div>

    {/* Add risk badge */}
    {student.risk_flag && (
      <div className="mt-2">
        <RiskBadge
          level={student.risk_flag.risk_level}
          pattern={student.risk_flag.pattern_type}
        />
        <p className="text-xs text-gray-600 mt-1">
          {student.risk_flag.reasoning}
        </p>

        {/* Add call button for high risk */}
        {student.risk_flag.risk_level === 'high' && (
          <CallParentButton
            studentId={student.student_id}
            studentName={student.name}
            guardianPhone={student.guardian_phone}
            riskInfo={student.risk_flag}
          />
        )}
      </div>
    )}
  </div>
))}
```

---

### Hour 9-11 (6:30 AM - 8:30 AM): Testing & Polish

#### 11. End-to-End Demo Test (2 hours)

1. **Enroll Student:**
   - Use real student with your phone as guardian
   - Upload 2-3 photos

2. **Create Sneak-Out Pattern:**
   - Period 1: Take attendance, student present
   - Period 2: Take attendance, student absent
   - Check for 🚨 HIGH RISK badge

3. **Test Voice Call:**
   - Click "Llamar Apoderado"
   - Your phone should ring
   - Answer and interact with Spanish AI
   - Press DTMF key (1/2/3)

4. **Verify Complete Flow:**
   - Photo → Vision Agent → Absent list
   - Absent list → Reasoning Agent → Risk analysis
   - High risk → Teacher clicks → Voice Agent → Parent call

---

### Hour 12-14 (8:30 AM - 10:30 AM): Demo Prep

#### 12. Create Demo Data (1 hour)

Update `apps/api-v2/src/db/seed.ts`:

- Add student "Sofia Martinez"
- Use real phone number for guardian
- Pre-create attendance history showing sneak-out pattern

#### 13. Practice Demo (1 hour)

Practice 5 times:

1. Opening (30s)
2. Vision Agent demo (1 min)
3. Reasoning Agent demo (1.5 min)
4. Voice Agent demo (2 min)
5. Closing (30s)

**Total: 5 minutes**

---

### Hour 14-15 (10:30 AM - 11:30 AM): Backup & Buffer

#### 14. Record Backup Video (30 min)

- Screen record successful flow
- Edit to 5-minute presentation
- Have ready to play if APIs fail

#### 15. Take Screenshots (15 min)

- Vision Agent results
- Reasoning Agent analysis
- Voice call UI
- Call completed status

#### 16. Final Buffer (45 min)

- Fix any last bugs
- Test on mobile
- Charge phone to 100%
- Prepare presentation notes

---

## 🎯 SUCCESS CHECKLIST

Before 3 PM:

- [ ] AI Agents server running
- [ ] OpenAI API key working
- [ ] ElevenLabs agent configured
- [ ] Test call to your phone works
- [ ] Risk badges showing in UI
- [ ] Call button functional
- [ ] Demo script memorized
- [ ] Backup video ready
- [ ] Screenshots saved
- [ ] Phone charged
- [ ] WiFi tested

---

## 🚨 IF BEHIND SCHEDULE

**Priority 1 (Must Have):**

- Vision Agent (✅ Already done)
- Reasoning Agent backend (✅ Already done)
- Risk badge in UI

**Priority 2 (Should Have):**

- Call Parent button
- Test call to your phone

**Priority 3 (Nice to Have):**

- Call status tracking
- Webhook integration
- Call history

---

## 💡 QUICK COMMANDS

```bash
# Start everything
cd apps/api-v2 && pnpm dev &
cd apps/ai-agents && pnpm dev &
cd apps/teacher-client && pnpm dev

# Test AI Agents
curl http://localhost:3001/

# Test Reasoning
curl -X POST http://localhost:3001/api/reasoning/analyze -H "Content-Type: application/json" -d '{ ... }'

# Test Voice (YOUR PHONE!)
curl -X POST http://localhost:3001/api/voice/call -H "Content-Type: application/json" -d '{ "guardian_phone": "+56YOUR_PHONE", ... }'
```

---

**YOU'VE GOT THIS! The hard part (AI agents code) is done. Now just connect the pieces! 🚀**
