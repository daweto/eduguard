import { Hono } from 'hono';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Route handlers defined inline following Hono best practices
const app = new Hono();

// In-memory call tracking (use database in production)
const activeCalls = new Map<string, any>();

/**
 * POST /call
 * Initiate voice call to parent/guardian
 */
app.post('/call', async (c) => {
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
      class_name = 'clase',
      time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    } = body;

    if (!student_id || !student_name || !guardian_phone) {
      return c.json({
        error: 'Missing required fields: student_id, student_name, guardian_phone',
      }, 400);
    }

    // Validate phone number (basic check)
    if (!guardian_phone.match(/^\+?\d{10,15}$/)) {
      return c.json({
        error: 'Invalid phone number format. Use international format: +56912345678',
      }, 400);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return c.json({
        error: 'ElevenLabs credentials not configured',
        details: 'ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID must be set',
      }, 500);
    }

    console.log(`📞 Initiating call to ${guardian_name} (${guardian_phone}) for ${student_name}`);
    console.log(`   Risk: ${risk_level} | Pattern: ${pattern_type}`);

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({ apiKey });

    // Build natural conversation prompt in Spanish
    const systemPrompt = `Eres un asistente virtual de asistencia escolar del Colegio Skyward.
Hablas español de forma NATURAL y profesional, como una persona real.

CONTEXTO:
- Estudiante: ${student_name}
- Apoderado: ${guardian_name}
- Situación: El estudiante no asistió a ${class_name} hoy
- Hora de clase: ${time}
- Patrón detectado: ${pattern_type === 'sneak_out' ? 'Presente en primera clase, ausente después' : reasoning}

OBJETIVO: Notificar y verificar si el apoderado está al tanto

FLUJO DE CONVERSACIÓN NATURAL:

1. APERTURA:
   "Hola, buenos días/tardes. Soy el asistente virtual del Colegio San José.
    ¿Hablo con ${guardian_name}?"
   
   [Espera respuesta hablada del padre]

2. NOTIFICACIÓN:
   "Le llamo para informarle que ${student_name} no asistió a ${class_name} hoy a las ${time}.
    ¿Está usted al tanto de esta ausencia?"
   
   [Escucha la respuesta HABLADA del padre]

3. ADAPTA SEGÚN RESPUESTA:
   
   Si dice "Sí" / "Está enfermo" / "Tiene cita":
     - Pregunta brevemente el motivo
     - Confirma: "Perfecto, registraré la ausencia como justificada"
     - Agradece y despídete
   
   Si dice "¿Qué?" / "No sabía" / "¡Imposible!":
     - Mantén calma: "Entiendo su preocupación"
     - Informa: "Un administrador contactará pronto"
     - Ofrece: "Puede llamar al colegio al..."
     - Despídete profesionalmente
   
   Si cuestiona o disputa:
     - Escucha con empatía
     - Ofrece verificar información
     - Promete llamada de administrador con detalles

4. CIERRE:
   "Gracias por su tiempo. Que tenga buen día."

IMPORTANTE:
- Esto es una CONVERSACIÓN REAL, no un menú de opciones
- El apoderado HABLA libremente, tú ESCUCHAS y respondes
- NO uses "presione 1, presione 2" - eso es robótico
- Adapta tu tono según la emoción del padre (calma, alarma, etc.)
- Máximo 90 segundos de llamada
- Habla en español chileno natural

TONO: Profesional pero humano, empático, claro, NO alarmista.`;

    try {
      // Note: ElevenLabs API may have changed
      // This is a placeholder - need to update based on actual API docs
      // For now, we'll create a mock response for development
      
      console.log(`   📞 Would call: ${guardian_phone}`);
      console.log(`   📋 Prompt: ${systemPrompt.substring(0, 100)}...`);

      // TODO: Update this with correct ElevenLabs v2 API
      // Placeholder response for development
      const call = {
        call_id: `call_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        conversation_id: `conv_${Date.now()}`,
      };

      // Track the call
      const callData = {
        call_id: call.call_id,
        conversation_id: call.conversation_id,
        student_id,
        student_name,
        guardian_name,
        guardian_phone,
        risk_level,
        pattern_type,
        status: 'initiated',
        initiated_at: new Date().toISOString(),
      };

      activeCalls.set(call.call_id, callData);

      console.log(`   📞 Call initiated: ${call.call_id}`);

      return c.json(callData);

    } catch (elevenLabsError) {
      console.error('❌ ElevenLabs API error:', elevenLabsError);
      
      // Check if it's a known error
      if (elevenLabsError instanceof Error) {
        if (elevenLabsError.message.includes('agent_id')) {
          return c.json({
            error: 'Invalid ElevenLabs Agent ID',
            details: 'Please create a Conversational AI agent in ElevenLabs dashboard and set ELEVENLABS_AGENT_ID',
            guide: 'https://elevenlabs.io/docs/conversational-ai/quickstart',
          }, 400);
        }
      }

      return c.json({
        error: 'Failed to initiate call',
        details: elevenLabsError instanceof Error ? elevenLabsError.message : 'Unknown error',
      }, 500);
    }

  } catch (error) {
    console.error('❌ Voice call error:', error);
    return c.json({
      error: 'Failed to process call request',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /call/:call_id
 * Get call status
 */
app.get('/call/:call_id', async (c) => {
  try {
    const callId = c.req.param('call_id');

    // Check local tracking first
    const trackedCall = activeCalls.get(callId);
    if (!trackedCall) {
      return c.json({ error: 'Call not found' }, 404);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'ElevenLabs API key not configured' }, 500);
    }

    const client = new ElevenLabsClient({ apiKey });

    // TODO: Update with correct ElevenLabs v2 API
    // Placeholder for development
    const status = {
      status: trackedCall.status || 'in_progress',
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
    console.error('❌ Get call status error:', error);
    return c.json({
      error: 'Failed to get call status',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /webhook/call-completed
 * Webhook to receive call completion from ElevenLabs
 */
app.post('/webhook/call-completed', async (c) => {
  try {
    const payload = await c.req.json();

    console.log('📥 Call completed webhook:', JSON.stringify(payload, null, 2));

    const { call_id, conversation_id, status, duration, dtmf_input, transcript } = payload;

    // Update tracked call
    const trackedCall = activeCalls.get(call_id);
    if (trackedCall) {
      trackedCall.status = 'completed';
      trackedCall.completed_at = new Date().toISOString();
      trackedCall.duration = duration;
      trackedCall.dtmf_response = dtmf_input;
      trackedCall.transcript = transcript;
      trackedCall.outcome = status;

      console.log(`   ✅ Call ${call_id} completed: ${duration}s, DTMF: ${dtmf_input || 'none'}`);
    }

    // TODO: Store in database for persistence
    // TODO: Notify Cloudflare Workers API about call result

    return c.json({ received: true, processed: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return c.json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /calls
 * List all tracked calls
 */
app.get('/calls', (c) => {
  const calls = Array.from(activeCalls.values());
  return c.json({
    total: calls.length,
    calls: calls.sort((a, b) => 
      new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime()
    ),
  });
});

export default app;
export type VoiceAppType = typeof app;

