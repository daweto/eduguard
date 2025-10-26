# Hackathon Priorities

## Highest Impact (Do First)
- **Lock F1 implementation to spec**: finish migrations for the new student/guardian name fields and identification numbers so D1 schema matches `src/db/schema.ts`. Backfill existing data or provide a safe migration script. Verify enrollment + list/delete flows end-to-end.
- **Stabilise enrollment UX**: ensure the new `StudentEnrollmentForm` integrates cleanly with routing (restore `/enroll` entry point), add field validation/error copy via i18n, and confirm guardian selection keeps grade IDs and IDs consistent.
- **Document required env + setup for F1**: update `SETUP.md` to emphasise Rekognition credentials are mandatory for F1 (faces must index at enrollment) and list the new R2/guardian requirements. Provide quick test checklist.

## Next (If Time Allows)
- **F2 – Photo Attendance MVP**: reuse the existing R2 + Rekognition plumbing to accept a classroom photo, run `SearchFacesByImage`, and surface present/absent state in the teacher client.
- **F3 – Reasoning Agent stub**: wire a simple rules engine (or placeholder) that flags students with multiple absences the same day to demonstrate the AI workflow.
- **Demo polish**: scripted flow (enroll ➜ capture attendance ➜ flag ➜ notify) with seeded data, screenshots, and CLI commands.

### Attendance Class-Selection MVP

**Goal**: teacher logs in, picks the class they are teaching, immediately sees the roster ready for photo capture.

1. **Data Layer**
   - Seed `classes` table: `{ id, name, gradeId, teacherId }`.
   - Junction table `class_students` linking classes ↔ students (many-to-many).
   - API endpoints:
     - `GET /api/classes?teacher_id=...` → list of classes assigned to the teacher (name, grade, period).
     - `GET /api/classes/:id/roster` → students with basic profile (names, identification, face count, latest status).
2. **Auth Assumption**
   - Mock teacher identity via query (e.g., `?teacher_id=demo-teacher`) or stub login screen for hackathon.
3. **Frontend Screen** (`/attendance`)
   - **Header**: teacher name + shift selector (dropdown of classes).
   - **Class Picker**: dropdown or cards showing class name + period + student count.
   - **Roster View**: grid/list with student photo placeholder, full name, identification, present indicator (initially pending).
   - **Actions**: buttons for “Start attendance” (opens capture workflow) and “Refresh roster”.
4. **Workflow**
   - On load, fetch teacher classes, auto-select first one.
   - Fetch roster; display skeletons while loading.
   - Provide stub “Capture photo” CTA (wired later to the Rekognition flow).
5. **Out of Scope for MVP**
   - Real authentication.
   - Complex scheduling or multi-teacher assignments.
   - Attendance history; focus on the single current session.

## Defer / Avoid Right Now
- Navigation restructures or sidebar rewrites not tied to F1-F3 demo.
- Additional UI components or generic abstractions that aren't needed for the hackathon demo.
- New infra (Vectorize, Queues, Voice agent) until the core enrollment + attendance loop is shippable.

Keep the team focused on delivering a single, reliable end-to-end demo that highlights enrollment, automated attendance, and the first safety alert.
