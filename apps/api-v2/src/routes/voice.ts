import type {
  VoiceCallRequest,
  VoiceCallResponse,
  VoiceCallsListResponse,
  VoiceCallGetResponse,
  Call as SharedCall,
  VoiceAgentCallRequest,
  CallInitiatedBy,
  CallStatus,
  RiskLevel,
} from "@repo/shared-types";
import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { calls, legalGuardians, students } from "../db/schema";
import type {
  Call as DbCall,
  Student as DbStudent,
  LegalGuardian as DbGuardian,
} from "../db/schema";
import type { Bindings } from "../types";

const voice = new Hono<{ Bindings: Bindings }>();

// Type guards for safe DB value conversion
function isCallInitiatedBy(value: string): value is CallInitiatedBy {
  return value === "manual" || value === "reasoning-auto";
}

function isCallStatus(value: string): value is CallStatus {
  return [
    "initiated",
    "ringing",
    "answered",
    "voicemail",
    "failed",
    "completed",
  ].includes(value);
}

function isRiskLevel(value: string | null): value is RiskLevel {
  return value !== null && ["none", "low", "medium", "high"].includes(value);
}

function mapCallRowToShared(
  row: DbCall,
  student?: DbStudent,
  guardian?: DbGuardian,
): SharedCall {
  return {
    call_id: row.id,
    student_id: row.studentId,
    student_name: student
      ? `${student.firstName} ${student.middleName ?? ""} ${student.lastName} ${student.secondLastName ?? ""}`.trim()
      : undefined,
    guardian_name: guardian
      ? `${guardian.firstName} ${guardian.lastName}`
      : undefined,
    guardian_phone: row.guardianPhone,
    initiated_by: isCallInitiatedBy(row.initiatedBy)
      ? row.initiatedBy
      : "manual",
    risk_level: isRiskLevel(row.riskLevel) ? row.riskLevel : undefined,
    status: isCallStatus(row.status) ? row.status : "initiated",
    duration: row.duration ?? undefined,
    dtmf_response: row.dtmfResponse ?? undefined,
    transcript: row.transcript ?? undefined,
    recording_url: row.recordingUrl ?? undefined,
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? undefined,
  };
}

// List calls from DB (most recent first)
voice.get("/calls", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const rows = (await db
      .select()
      .from(calls)
      .orderBy(desc(calls.createdAt))
      .all()) as DbCall[];

    // Fetch related names in batch
    const studentIds = Array.from(new Set(rows.map((r) => r.studentId)));
    const guardianIds = Array.from(new Set(rows.map((r) => r.guardianId)));

    const studentsMap = new Map<string, DbStudent>();

    const s =
      studentIds.length === 0
        ? []
        : await db
            .select()
            .from(students)
            .where(inArray(students.id, studentIds));
    for (const st of s) studentsMap.set(st.id, st as DbStudent);

    const guardiansMap = new Map<string, DbGuardian>();

    const g =
      guardianIds.length === 0
        ? []
        : await db
            .select()
            .from(legalGuardians)
            .where(inArray(legalGuardians.id, guardianIds));
    for (const gu of g) guardiansMap.set(gu.id, gu as DbGuardian);

    const callsMapped: SharedCall[] = rows.map((r) =>
      mapCallRowToShared(
        r,
        studentsMap.get(r.studentId),
        guardiansMap.get(r.guardianId),
      ),
    );

    const payload: VoiceCallsListResponse = {
      total: callsMapped.length,
      calls: callsMapped,
    };
    return c.json(payload);
  } catch (e) {
    console.error("List calls error:", e);
    return c.json({ error: "Failed to list calls" }, 500);
  }
});

// Get single call
voice.get("/calls/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = drizzle(c.env.DB);
    const rows = (await db
      .select()
      .from(calls)
      .where(eq(calls.id, id))
      .limit(1)) as DbCall[];
    if (!rows.length) return c.json({ error: "Not found" }, 404);

    // Get related entities
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, rows[0].studentId));
    const [guardian] = await db
      .select()
      .from(legalGuardians)
      .where(eq(legalGuardians.id, rows[0].guardianId));

    const callMapped: SharedCall = mapCallRowToShared(
      rows[0],
      student,
      guardian,
    );
    const payload: VoiceCallGetResponse = { call: callMapped };
    return c.json(payload);
  } catch (e) {
    console.error("Get call error:", e);
    return c.json({ error: "Failed to get call" }, 500);
  }
});

/**
 * Proxy all requests to the AI Agents voice service
 * Forwards to AI_AGENTS_URL/api/voice/*
 */
// Specialized handler: initiate call and log to DB
voice.post("/call", async (c) => {
  const aiAgentsUrl = c.env.AI_AGENTS_URL;
  if (!aiAgentsUrl) {
    return c.json({ error: "AI Agents service not configured" }, 500);
  }

  try {
    const payload = await c.req.json<VoiceCallRequest>();
    const guardianId = payload.guardian_id;
    if (!payload.student_id || !payload.guardian_phone || !guardianId) {
      return c.json(
        { error: "student_id, guardian_id and guardian_phone are required" },
        400,
      );
    }

    const db = drizzle(c.env.DB);
    // Lookup names to enrich agent payload
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, payload.student_id));
    const [guardian] = await db
      .select()
      .from(legalGuardians)
      .where(eq(legalGuardians.id, guardianId));

    const studentParts = [
      student.firstName,
      student.middleName ?? "",
      student.lastName,
      student.secondLastName ?? "",
    ].filter(Boolean);
    const studentCandidate = studentParts.join(" ").trim();
    const studentName =
      payload.student_name ?? (studentCandidate || "Estudiante");

    const guardianCandidate = [guardian.firstName, guardian.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const guardianName =
      payload.guardian_name ?? (guardianCandidate || "Apoderado");

    const callId = crypto.randomUUID();

    const agentPayload: VoiceAgentCallRequest = {
      student_id: payload.student_id,
      student_name: studentName,
      guardian_name: guardianName,
      guardian_phone: payload.guardian_phone,
      guardian_id: guardianId,
      call_id: callId,
      risk_level: payload.risk_level ?? "medium",
      pattern_type: payload.pattern_type ?? "manual",
      reasoning:
        payload.reason ??
        `Llamada ${payload.initiated_by ?? "manual"} desde API`,
      // Optional extra context for agent prompt
      class_name: undefined,
      time: undefined,
    };

    // Forward to AI Agents first
    const resp = await fetch(`${aiAgentsUrl}/api/voice/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentPayload),
    });

    const resultText = await resp.text();
    let result: VoiceCallResponse;
    try {
      result = JSON.parse(resultText) as VoiceCallResponse;
    } catch {
      result = { status: "error", message: resultText };
    }
    if (!resp.ok) {
      return new Response(resultText, {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Persist minimal call record

    await db
      .insert(calls)
      .values({
        id: callId,
        studentId: payload.student_id,
        guardianId,
        guardianPhone: payload.guardian_phone,
        sessionId: payload.session_id ?? null,
        classId: payload.class_id ?? null,
        initiatedBy: payload.initiated_by ?? "manual",
        riskLevel: payload.risk_level ?? null,
        status: "initiated",
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();

    return c.json({ ...result, call_id: callId });
  } catch (error) {
    console.error("Voice call proxy error:", error);
    return c.json({ error: "Failed to initiate call" }, 500);
  }
});

voice.all("/*", async (c) => {
  const aiAgentsUrl = c.env.AI_AGENTS_URL;

  if (!aiAgentsUrl) {
    return c.json(
      {
        error: "AI Agents service not configured",
        details: "AI_AGENTS_URL environment variable is not set",
      },
      500,
    );
  }

  // Get the path after /api/voice
  const path = c.req.path.replace("/api/voice", "");
  const targetUrl = `${aiAgentsUrl}/api/voice${path}`;

  try {
    // Convert headers to plain object
    const headerEntries: [string, string][] = [];
    c.req.raw.headers.forEach((value, key) => {
      headerEntries.push([key, value]);
    });

    // Forward the request
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headerEntries),
      },
      body:
        c.req.method !== "GET" && c.req.method !== "HEAD"
          ? await c.req.raw.text()
          : undefined,
    });

    // Return the response from AI Agents
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Voice proxy error:", error);
    return c.json(
      {
        error: "Failed to connect to AI Agents service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      503,
    );
  }
});

export default voice;
