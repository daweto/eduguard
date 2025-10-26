# Hackathon Product Closure Plan

This document captures the minimum work to ship a coherent demo product, reflecting the clarified scope: no SMS/WhatsApp messaging; voice calls only. The voice agent is callable from the UI and is also auto-triggered by the reasoning agent for high-risk absences.

## What’s Missing (Top Priorities)

- Wire Reasoning into API flow (auto call on high-risk) and basic UI affordances.
- Add Voice call flow: API proxy endpoint and minimal persistence + webhook.
- Expose guardian phone on absent students in attendance result.
- Minimal migrations for call logs (and optional reasoning logs).
- Ship risk badge + "Llamar Apoderado" button in Absent list.
- Environment/config glue so API, AI Agents, and Frontend run together.

## Backend (API v2) Gaps

- AI Agents proxy routes
  - Add `app.route("/api/reasoning", ...)` and `app.route("/api/voice", ...)` in `apps/api-v2/src/index.ts`.
  - Create thin proxy handlers that forward to AI Agents at `c.env.AI_AGENTS_URL`.

- Attendance → Reasoning trigger
  - After attendance session creation in `apps/api-v2/src/routes/attendance.ts`, fire-and-forget POST to `AI_AGENTS_URL/api/reasoning/analyze` with session context and absent students.
  - Reasoning responds with risk scoring; for high-risk students, it should initiate an auto voice call through the AI Agents voice route.

- Guardian phone in attendance result
  - Join guardians when computing `absent_students` and include `guardian_phone` (and optionally `guardian_name`) in `apps/api-v2/src/routes/attendance.ts`.

- Persistence for calls (MVP)
  - Add a `calls` table to D1 (see schema suggestion below) to record manual/auto calls, status, dtmf_response, and optional recording URL.
  - Optional: add a `reasoning_analyses` table if you want to persist analysis text/risk.

- Webhook endpoint
  - Add `POST /api/webhooks/elevenlabs/call-completed` to record `status`, `duration`, `dtmf_response`, `recording_url`, and associate to `call_id`.

- Configuration
  - Add `AI_AGENTS_URL` to `apps/api-v2/.dev.vars` and bind in `wrangler.jsonc`.
  - Optional: `REASONING_AUTO_CALL_THRESHOLD` (default 95).

### Suggested D1 schema additions (MVP)

- calls
  - `id` (text, pk)
  - `student_id` (text)
  - `guardian_id` (text)
  - `guardian_phone` (text)
  - `session_id` (text, nullable)
  - `class_id` (text, nullable)
  - `initiated_by` (text, e.g., `manual` | `reasoning-auto`)
  - `risk_level` (integer or text)
  - `status` (text, e.g., `initiated` | `ringing` | `answered` | `voicemail` | `failed` | `completed`)
  - `dtmf_response` (text, nullable)
  - `recording_url` (text, nullable)
  - `created_at` (text default CURRENT_TIMESTAMP)
  - `updated_at` (text)

- reasoning_analyses (optional)
  - `id` (text, pk)
  - `student_id` (text)
  - `session_id` (text)
  - `risk_score` (integer)
  - `risk_label` (text)
  - `summary` (text)
  - `recommendation` (text)
  - `created_at` (text default CURRENT_TIMESTAMP)

## Frontend Gaps (Teacher Client)

- Absent list UI
  - Add `RiskBadge` and `CallParentButton` in `apps/teacher-client/src/pages/ClassAttendancePage.tsx` absent section.
  - Use `attendanceResult.absent_students[*].guardian_phone` and optional `risk_flag` to enable the button and display risk.

- API client for calls
  - Add `POST /api/voice/call` client util (payload: `student_id`, `student_name`, `guardian_phone`, `session_id`, optional `risk_level`).
  - Show toasts/state: calling → success/failure.

- Hardcoded teacher id
  - There are hardcoded `"teacher-001"` usages (e.g., session override). Keep for demo; consider an app-level constant.

## AI Agents Gaps

- Reasoning agent
  - Already implemented (`apps/ai-agents/src/routes/reasoning.ts`), returns risk assessment. Extend to trigger voice call when risk exceeds threshold using internal call to `/api/voice/call` route within AI Agents app.

- Voice agent
  - Implement real ElevenLabs call initiation in `apps/ai-agents/src/routes/voice.ts` (places with TODOs). Use `ELEVENLABS_AGENT_ID` and `ELEVENLABS_API_KEY`.
  - Keep a webhook handler that forwards completion to API’s webhook (`/api/webhooks/elevenlabs/call-completed`).

- Environment
  - Ensure `.env` has: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`.

## What To Build Next (Order)

1. Backend glue

- Add proxy routes and `AI_AGENTS_URL` env binding.
- Update attendance result to include `guardian_phone` and trigger reasoning after session creation.
- Add minimal `calls` migration and the ElevenLabs webhook endpoint.

2. Frontend MVP UI

- Add RiskBadge and Llamar Apoderado button to Absent list on `ClassAttendancePage`.
- Implement simple fetch to `/api/voice/call`; show toasts and a basic status chip.

3. Voice agent dialing

- Implement ElevenLabs call start in AI Agents voice route.
- Verify a test call to a real phone (use seeded guardian phone or your own).

4. Demo polish

- Seed mapping: ensure at least one absent student has the demonstrator’s phone.
- Optional: `/api/voice/call/:call_id` status endpoint and UI chip updates.

## Nice-To-Have (If Time)

- Calls table viewer (basic page) and session photos viewer (API already returns URLs).
- Persist reasoning summaries for later review.
- Login stub to avoid scattered hardcoded teacher id.

## File Pointers (Where to change)

- API routing glue: `apps/api-v2/src/index.ts`
- Attendance flow and payload shaping: `apps/api-v2/src/routes/attendance.ts`
- DB schema/migrations: `apps/api-v2/src/db/schema.ts`, `apps/api-v2/migrations/*.sql`
- AI Agents reasoning: `apps/ai-agents/src/routes/reasoning.ts`
- AI Agents voice (fill TODOs): `apps/ai-agents/src/routes/voice.ts`
- Frontend absent UI and call button: `apps/teacher-client/src/pages/ClassAttendancePage.tsx`
- Hardcoded teacher id reference example: `apps/teacher-client/src/pages/SessionDetailPage.tsx`

## Validation Checklist

- Run: API (8787), AI Agents (3001), Frontend (5173).
- Take attendance: Absent list shows risk badge and call button.
- Click call: phone rings; webhook logs outcome to D1 `calls`.
- Optional: fetch call status and display in UI.

## Scope Notes

- Out-of-scope now: SMS/WhatsApp drafting and sending, vector DB.
- Rekognition remains for face matching; no vector DB needed for faces.

## Assumptions

- Auto-call threshold defaults to 95; can be env-configured.
- Spanish script/voice preset provided via ElevenLabs agent configuration.
