import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { agentLogs } from "../db/schema";
import type { Bindings } from "../types";

const agents = new Hono<{ Bindings: Bindings }>();

agents.post("/log", async (c) => {
  try {
    const body = await c.req.json<{
      id?: string;
      agent: string;
      decisionType: string;
      sessionId?: string;
      studentId?: string;
      callId?: string;
      details?: unknown;
    }>();

    if (!body.agent || !body.decisionType) {
      return c.json({ error: "agent and decisionType are required" }, 400);
    }

    const db = drizzle(c.env.DB);
    const id = body.id ?? crypto.randomUUID();

    await db.insert(agentLogs).values({
      id,
      agent: body.agent,
      decisionType: body.decisionType,
      sessionId: body.sessionId ?? null,
      studentId: body.studentId ?? null,
      callId: body.callId ?? null,
      details: body.details ? JSON.stringify(body.details) : null,
    });

    return c.json({ id });
  } catch (e) {
    console.error("/agents/log error", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default agents;
