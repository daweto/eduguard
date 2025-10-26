import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { calls } from "../db/schema";
import type { Bindings } from "../types";

const voice = new Hono<{ Bindings: Bindings }>();

// List calls from DB (most recent first)
voice.get("/calls", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const rows = await db
      .select()
      .from(calls)
      .orderBy(desc(calls.createdAt))
      .all();
    return c.json({ total: rows.length, calls: rows });
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
    const rows = await db.select().from(calls).where(eq(calls.id, id)).limit(1);
    if (!rows.length) return c.json({ error: "Not found" }, 404);
    return c.json(rows[0]);
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
    const payload = await c.req.json<any>();
    const guardianId = payload.guardian_id || payload.guardianId;
    if (!payload.student_id || !payload.guardian_phone || !guardianId) {
      return c.json(
        { error: "student_id, guardian_id and guardian_phone are required" },
        400,
      );
    }

    // Forward to AI Agents first
    const resp = await fetch(`${aiAgentsUrl}/api/voice/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resultText = await resp.text();
    let result: any;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }
    if (!resp.ok) {
      return new Response(resultText, {
        status: resp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Persist minimal call record
    const callId: string =
      result.call_id ||
      result.conversation_id ||
      result.call_sid ||
      `call_${Date.now()}`;
    const db = drizzle(c.env.DB);
    await db
      .insert(calls)
      .values({
        id: callId,
        studentId: payload.student_id,
        guardianId,
        guardianPhone: payload.guardian_phone,
        sessionId: payload.session_id ?? null,
        classId: payload.class_id ?? null,
        initiatedBy:
          payload.pattern_type === "manual" ? "manual" : "reasoning-auto",
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
    // Forward the request
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(c.req.raw.headers),
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
          response.headers.get("Content-Type") || "application/json",
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
