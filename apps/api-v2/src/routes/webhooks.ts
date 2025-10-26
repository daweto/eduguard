import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { calls } from "../db/schema";
import type { Bindings } from "../types";

const webhooks = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/webhooks/elevenlabs/call-completed
 * Webhook to receive call completion events from ElevenLabs
 */
webhooks.post("/elevenlabs/call-completed", async (c) => {
  try {
    const payload = await c.req.json<{
      call_id: string;
      conversation_id?: string;
      status: string;
      duration?: number;
      dtmf_input?: string;
      dtmf_response?: string;
      transcript?: string;
      recording_url?: string;
    }>();

    console.log("📥 ElevenLabs webhook received:", JSON.stringify(payload, null, 2));

    const { call_id, status, duration, dtmf_input, dtmf_response, transcript, recording_url } = payload;

    if (!call_id) {
      return c.json({ error: "call_id is required" }, 400);
    }

    const db = drizzle(c.env.DB);

    // Update the call record
    const dtmfValue = dtmf_response || dtmf_input;

    await db
      .update(calls)
      .set({
        status: status || "completed",
        duration: duration || null,
        dtmfResponse: dtmfValue || null,
        transcript: transcript || null,
        recordingUrl: recording_url || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(calls.id, call_id));

    console.log(`✅ Call ${call_id} updated: status=${status}, duration=${duration}s`);

    return c.json({
      received: true,
      processed: true,
      call_id,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return c.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default webhooks;
