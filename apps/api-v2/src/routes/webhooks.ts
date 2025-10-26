import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
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
    const raw = (await c.req.json()) as unknown;

    // Log minimal, structured info (avoid logging full transcript twice)
    try {
      const snapshot = JSON.stringify(raw).slice(0, 2000);
      console.log(
        "[api-v2] webhook: elevenlabs call-completed (snapshot)",
        snapshot,
      );
    } catch {}

    // Support two shapes:
    // 1) Minimal proxy payload { call_id, status, duration, dtmf_input, transcript, recording_url }
    // 2) ElevenLabs full event { type: 'post_call_transcription', data: { ... } }

    let callId: string | undefined;
    let statusStr: string = "completed";
    let duration: number | undefined;
    let dtmf: string | undefined;
    let transcriptText: string | undefined;
    let recordingUrl: string | undefined;

    interface ElevenTranscriptItem {
      message?: string;
    }
    interface ElevenData {
      conversation_id?: string;
      status?: string;
      metadata?: { call_duration_secs?: number };
      transcript?: ElevenTranscriptItem[];
      phone_call?: { call_sid?: string };
      conversation_initiation_client_data?: {
        dynamic_variables?: { call_id?: string };
        user_id?: string;
      };
    }
    interface ElevenEvent {
      type?: string;
      data?: ElevenData;
    }
    interface MinimalPayload {
      call_id?: string;
      conversation_id?: string;
      status?: string;
      duration?: number;
      dtmf_input?: string;
      dtmf_response?: string;
      transcript?: string;
      recording_url?: string;
    }

    const obj = raw as ElevenEvent | MinimalPayload;

    const asEvent = obj as ElevenEvent;
    if (asEvent.type === "post_call_transcription" && asEvent.data) {
      const data = asEvent.data;
      const dyn = data.conversation_initiation_client_data?.dynamic_variables;

      callId =
        dyn?.call_id ?? data.conversation_id ?? data.phone_call?.call_sid;
      statusStr = data.status ?? "completed";
      duration = data.metadata?.call_duration_secs;

      // Build transcript from array of messages
      const arr = Array.isArray(data.transcript) ? data.transcript : [];
      const pieces: string[] = [];
      for (const t of arr) {
        const msg = t.message ?? "";
        if (msg) pieces.push(msg);
      }
      transcriptText = pieces.join("\n");
    } else {
      const p = obj as MinimalPayload;
      callId = p.call_id;
      statusStr = p.status ?? "completed";
      duration = p.duration;
      dtmf = p.dtmf_response ?? p.dtmf_input;
      transcriptText = p.transcript;
      recordingUrl = p.recording_url;
    }

    if (!callId) {
      return c.json({ error: "call_id missing" }, 400);
    }

    const db = drizzle(c.env.DB);

    // Truncate transcript to a safe size
    const transcriptSafe = transcriptText
      ? transcriptText.slice(0, 16000)
      : null;

    await db
      .update(calls)
      .set({
        status: statusStr,
        duration: duration ?? null,
        dtmfResponse: dtmf ?? null,
        transcript: transcriptSafe,
        recordingUrl: recordingUrl ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(calls.id, callId));

    console.log("[api-v2] webhook: call updated", {
      call_id: callId,
      status: statusStr,
      duration,
      transcript_len: transcriptSafe?.length ?? 0,
    });

    return c.json({ received: true, processed: true, call_id: callId });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return c.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default webhooks;
