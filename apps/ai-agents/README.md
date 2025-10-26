# 🤖 EduGuard AI Agents Server

**Node.js microservice** for AI-powered attendance analysis and parent notifications.

## Architecture

This service runs **separately** from the Cloudflare Workers API (`api-v2`) because:

- **Vercel AI SDK** requires Node.js runtime
- **ElevenLabs SDK** works best in Node.js environment
- Allows independent scaling of AI workloads

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Workers API (api-v2)                    │
│  - Vision Agent (AWS Rekognition)                   │
│  - Student/Class management                         │
│  - Attendance session creation                      │
└───────────────┬─────────────────────────────────────┘
                │ HTTP calls
                ▼
┌─────────────────────────────────────────────────────┐
│  Node.js AI Agents Server (ai-agents)               │
│  - Reasoning Agent (GPT-4 via Vercel AI SDK)        │
│  - Voice Agent (ElevenLabs Conversational AI)       │
└─────────────────────────────────────────────────────┘
```

## Agents

### 1. Reasoning Agent (GPT-4)

**Endpoint:** `POST /api/reasoning/analyze`

Analyzes student attendance patterns using GPT-4 to detect:

- **Sneak-outs**: Present first period, absent later (HIGH RISK)
- **Chronic absence**: 3+ absences in 7 days (MEDIUM RISK)
- **Irregular patterns**: Random absences (LOW RISK)

**Technology:** Vercel AI SDK + OpenAI GPT-4o-mini

### 2. Voice Agent (ElevenLabs)

**Endpoint:** `POST /api/voice/call`

Initiates conversational AI phone calls to parents in Spanish:

- Natural Spanish conversation
- DTMF (keypad) response collection
- Call status tracking
- Webhook callbacks

**Technology:** ElevenLabs Conversational AI

## Setup

### 1. Install Dependencies

```bash
cd apps/ai-agents
pnpm install
```

### 2. Environment Variables

Create `.env` file:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# ElevenLabs Credentials
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...

# Cloudflare Workers API URL
CLOUDFLARE_API_URL=http://localhost:8787

# Server Port
PORT=3001
```

### 3. Create ElevenLabs Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create new Conversational AI Agent
3. Configure:
   - **Language:** Spanish (es-ES or es-MX)
   - **Voice:** Professional female Spanish voice
   - **DTMF:** Enabled
   - **Voicemail Detection:** Enabled
4. Copy **Agent ID** to `.env`

### 4. Run Development Server

```bash
pnpm dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Reasoning Agent

#### Analyze Single Student

```bash
POST /api/reasoning/analyze

{
  "student_id": "student-123",
  "student_name": "Sofia Martinez",
  "session_id": "session-456",
  "today_attendance": [
    { "period": 1, "status": "present", "confidence": 99.2 },
    { "period": 2, "status": "absent" }
  ],
  "history_7d": [
    { "date": "2025-10-25", "period": 1, "status": "present" },
    { "date": "2025-10-24", "period": 1, "status": "absent" }
  ]
}
```

Response:

```json
{
  "student_id": "student-123",
  "student_name": "Sofia Martinez",
  "analysis": {
    "risk_level": "high",
    "pattern_type": "sneak_out",
    "confidence": 0.89,
    "should_notify": true,
    "reasoning": "Student present Period 1, absent Period 2...",
    "recommended_action": "immediate_call"
  },
  "analyzed_at": "2025-10-26T12:00:00Z"
}
```

#### Batch Analyze

```bash
POST /api/reasoning/batch-analyze

{
  "session_id": "session-456",
  "students": [
    { "student_id": "...", "student_name": "...", ... },
    { "student_id": "...", "student_name": "...", ... }
  ]
}
```

### Voice Agent

#### Initiate Call

```bash
POST /api/voice/call

{
  "student_id": "student-123",
  "student_name": "Sofia Martinez",
  "guardian_name": "María Martinez",
  "guardian_phone": "+56912345678",
  "risk_level": "high",
  "pattern_type": "sneak_out",
  "reasoning": "Student left campus mid-day",
  "class_name": "Matemáticas",
  "time": "09:00"
}
```

Response:

```json
{
  "call_id": "call-xyz",
  "conversation_id": "conv-abc",
  "status": "initiated",
  "guardian_phone": "+56912345678",
  "initiated_at": "2025-10-26T12:00:00Z"
}
```

#### Get Call Status

```bash
GET /api/voice/call/:call_id
```

#### Webhook (ElevenLabs callback)

```bash
POST /api/voice/webhook/call-completed
```

## Integration with Cloudflare Workers API

### From `api-v2` (Cloudflare Workers)

After creating attendance session, call AI Agents server:

```typescript
// In apps/api-v2/src/routes/attendance.ts

const AI_AGENTS_URL = "http://localhost:3001"; // or production URL

// After attendance processing
const absentStudents = attendanceResult.absent_students;

for (const student of absentStudents) {
  // Call Reasoning Agent
  const analysisResp = await fetch(`${AI_AGENTS_URL}/api/reasoning/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: student.student_id,
      student_name: student.name,
      session_id: sessionId,
      today_attendance: todayAttendance,
      history_7d: last7Days,
    }),
  });

  const analysis = await analysisResp.json();

  // If high risk, teacher can initiate call from frontend
  if (analysis.analysis.risk_level === "high") {
    student.flagged = true;
    student.risk_info = analysis.analysis;
  }
}
```

## Testing

### Test Reasoning Agent

```bash
curl -X POST http://localhost:3001/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-123",
    "student_name": "Test Student",
    "session_id": "session-456",
    "today_attendance": [
      { "period": 1, "status": "present", "confidence": 99.5 },
      { "period": 2, "status": "absent" }
    ],
    "history_7d": [
      { "date": "2025-10-25", "status": "present" }
    ]
  }'
```

### Test Voice Agent

```bash
curl -X POST http://localhost:3001/api/voice/call \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-123",
    "student_name": "Test Student",
    "guardian_name": "Test Parent",
    "guardian_phone": "+56912345678",
    "risk_level": "high",
    "pattern_type": "sneak_out",
    "reasoning": "Test call"
  }'
```

## Production Deployment

### Build

```bash
pnpm build
```

### Run Production

```bash
pnpm start
```

### Docker

See `Dockerfile` example in `PRIORITIES-V2.md`

### Environment Variables (Production)

Set these in your hosting platform:

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `CLOUDFLARE_API_URL` (your production Cloudflare Workers URL)
- `PORT` (optional, defaults to 3001)

## Monitoring

The server logs all operations:

```
🤖 AI Agents Server starting on port 3001...
✅ AI Agents Server running at http://localhost:3001
📊 Reasoning Agent: Ready (GPT-4)
📞 Voice Agent: Ready (ElevenLabs)

🧠 Analyzing attendance for Sofia Martinez (student-123)
   Today: 2 records
   History: 15 records, 3 absences (20.0%)
   ✅ Analysis complete: high risk - sneak_out

📞 Initiating call to María Martinez (+56912345678) for Sofia Martinez
   Risk: high | Pattern: sneak_out
   ✅ Conversation created: conv-abc123
   📞 Call initiated: call-xyz789
```

## Cost Estimate

**Per 100 Students:**

- OpenAI GPT-4o-mini: ~$0.50/day ($15/month)
- ElevenLabs calls: ~$10/day if 10% flagged ($300/month)
- **Total:** ~$315/month for active monitoring

**Cost savings:**

- Teacher time saved: 50-100 min/day × 5 teachers = 250-500 min/day
- At $30/hr teacher salary = **$125-250/day saved**

## Troubleshooting

### "ElevenLabs credentials not configured"

- Ensure `.env` file exists with `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`

### "Invalid ElevenLabs Agent ID"

- Create agent in [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
- Copy exact Agent ID

### "OpenAI API error"

- Check `OPENAI_API_KEY` is valid
- Verify you have credits in your OpenAI account

### Calls not connecting

- Verify phone number format: `+56912345678`
- Check ElevenLabs account has call credits
- Ensure phone number can receive calls

## License

MIT
