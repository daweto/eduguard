import { Hono } from "hono";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Route handlers defined inline following Hono best practices
const app = new Hono();

// In-memory call tracking (use database in production)
const activeCalls = new Map<string, any>();

/**
 * POST /call
 * Initiate voice call to parent/guardian
 */
app.post("/call", async (c) => {
  try {
    const body = await c.req.json<{
      student_id: string;
      student_name: string;
      guardian_name: string;
      guardian_phone: string;
      risk_level: string;
      pattern_type: string;
      reasoning: string;
      class_name?: string;
      time?: string;
    }>();

    const {
      student_id,
      student_name,
      guardian_name,
      guardian_phone,
      risk_level,
      pattern_type,
      reasoning,
      class_name = "clase",
      time = new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    } = body;

    if (!student_id || !student_name || !guardian_phone) {
      return c.json(
        {
          error:
            "Missing required fields: student_id, student_name, guardian_phone",
        },
        400,
      );
    }

    // Validate phone number (basic check)
    if (!guardian_phone.match(/^\+?\d{10,15}$/)) {
      return c.json(
        {
          error:
            "Invalid phone number format. Use international format: +56912345678",
        },
        400,
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return c.json(
        {
          error: "ElevenLabs credentials not configured",
          details: "ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID must be set",
        },
        500,
      );
    }

    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
    if (!phoneNumberId) {
      return c.json(
        {
          error: "Missing ELEVENLABS_PHONE_NUMBER_ID",
          details: "Configure your ElevenLabs/Twilio phone number id",
        },
        500,
      );
    }

    const schoolName = process.env.SCHOOL_NAME || "Colegio Skyward";

    console.log(
      `📞 Initiating call to ${guardian_name} (${guardian_phone}) for ${student_name}`,
    );
    console.log(`   Risk: ${risk_level} | Pattern: ${pattern_type}`);

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({ apiKey });

    // Build natural conversation prompt in Spanish
    const systemPrompt = `Eres un asistente de voz de asistencia del ${schoolName}.
Hablas español chileno, profesional y cercano.

CONTEXTO:
- Estudiante: ${student_name}
- Apoderado: ${guardian_name}
- Clase: ${class_name}
- Hora: ${time}
- Patrón detectado: ${pattern_type === "sneak_out" ? "presente en primera clase, ausente después" : reasoning}

OBJETIVO: Notificar la inasistencia de hoy y registrar el motivo.

REGLAS:
- Conversación natural (no menús DTMF, a menos que el flujo lo requiera en el futuro).
- Confirma identidad de quien atiende antes de revelar datos.
- Sé breve (máx. 90s), empático y claro.
- Si el apoderado desconoce la situación, ofrece canal de contacto del colegio.
`;

    try {
      console.log(
        `   📞 Initiating ElevenLabs Twilio outbound call to: ${guardian_phone}`,
      );

      const resp = await client.conversationalAi.twilio.outboundCall({
        agentId: agentId,
        agentPhoneNumberId: phoneNumberId,
        toNumber: guardian_phone,
        conversationInitiationClientData: {
          // Avoid overriding restricted fields like first_message; rely on agent config
          // If prompt overrides are also restricted in your agent, remove the next block
          // and keep only dynamicVariables
          // conversationConfigOverride: { agent: { prompt: { prompt: systemPrompt } } },
          sourceInfo: { source: "node_js_sdk" },
          dynamicVariables: {
            student_name,
            guardian_name,
            class_name,
            absence_date: new Date().toISOString().slice(0, 10),
            school_name: schoolName,
            risk_level,
            pattern_type,
          },
        },
      });

      const callId =
        resp.conversationId ||
        resp.callSid ||
        `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Track the call
      const callData = {
        call_id: callId,
        conversation_id: resp.conversationId || null,
        call_sid: resp.callSid || null,
        student_id,
        student_name,
        guardian_name,
        guardian_phone,
        risk_level,
        pattern_type,
        status: "initiated",
        initiated_at: new Date().toISOString(),
      };

      activeCalls.set(callId, callData);

      console.log(`   ✅ Call initiated: ${callId}`);

      return c.json(callData);
    } catch (elevenLabsError) {
      console.error("❌ ElevenLabs API error:", elevenLabsError);

      if (elevenLabsError instanceof Error) {
        if (elevenLabsError.message.includes("agent_id")) {
          return c.json(
            {
              error: "Invalid ElevenLabs Agent ID",
              details: "Set ELEVENLABS_AGENT_ID to a valid agent",
              guide: "https://elevenlabs.io/docs/agents-platform/quickstart",
            },
            400,
          );
        }
      }

      return c.json(
        {
          error: "Failed to initiate call",
          details:
            elevenLabsError instanceof Error
              ? elevenLabsError.message
              : "Unknown error",
        },
        500,
      );
    }
  } catch (error) {
    console.error("❌ Voice call error:", error);
    return c.json(
      {
        error: "Failed to process call request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * GET /call/:call_id
 * Get call status
 */
app.get("/call/:call_id", async (c) => {
  try {
    const callId = c.req.param("call_id");

    // Check local tracking first
    const trackedCall = activeCalls.get(callId);
    if (!trackedCall) {
      return c.json({ error: "Call not found" }, 404);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "ElevenLabs API key not configured" }, 500);
    }

    const client = new ElevenLabsClient({ apiKey });

    // TODO: Update with correct ElevenLabs v2 API
    // Placeholder for development
    const status = {
      status: trackedCall.status || "in_progress",
      callId,
    };

    // Update tracked call
    trackedCall.status = status.status;
    trackedCall.updated_at = new Date().toISOString();

    return c.json({
      ...trackedCall,
      live_status: status,
    });
  } catch (error) {
    console.error("❌ Get call status error:", error);
    return c.json(
      {
        error: "Failed to get call status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /webhook/call-completed
 * Webhook to receive call completion from ElevenLabs
 */
app.post("/webhook/call-completed", async (c) => {
  try {
    const payload = await c.req.json();

    console.log("📥 Call completed webhook:", JSON.stringify(payload, null, 2));

    const {
      call_id,
      conversation_id,
      status,
      duration,
      dtmf_input,
      transcript,
    } = payload;

    // Update tracked call
    const trackedCall = activeCalls.get(call_id);
    if (trackedCall) {
      trackedCall.status = "completed";
      trackedCall.completed_at = new Date().toISOString();
      trackedCall.duration = duration;
      trackedCall.dtmf_response = dtmf_input;
      trackedCall.transcript = transcript;
      trackedCall.outcome = status;

      console.log(
        `   ✅ Call ${call_id} completed: ${duration}s, DTMF: ${dtmf_input || "none"}`,
      );
    }

    // Optionally forward to API webhook for persistence
    const apiUrl = process.env.API_BASE_URL || process.env.API_URL;
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/api/webhooks/elevenlabs/call-completed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            call_id,
            conversation_id,
            status,
            duration,
            dtmf_input,
            transcript,
          }),
        });
      } catch (e) {
        console.warn("Forward webhook to API failed:", (e as Error).message);
      }
    }

    return c.json({ received: true, processed: true });
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

/**
 * GET /calls
 * List all tracked calls
 */
app.get("/calls", (c) => {
  const calls = Array.from(activeCalls.values());
  return c.json({
    total: calls.length,
    calls: calls.sort(
      (a, b) =>
        new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime(),
    ),
  });
});

export default app;
export type VoiceAppType = typeof app;
