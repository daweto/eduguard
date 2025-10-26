import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required");

  const client = new ElevenLabsClient({ apiKey });

  const schoolName = process.env.SCHOOL_NAME ?? "Colegio Skyward";
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // set preferred Spanish voice

  const prompt = `
Eres un asistente de voz del ${schoolName} para notificar inasistencias y registrar el motivo.
Flujo natural de conversación (no menús DTMF para MVP).
Mantén el tono cordial, habla claro y breve. Confirma el nombre del estudiante.
Si justifican (enfermedad/llegada tarde): solicita detalle breve y fecha estimada de retorno.
Si refutan (sí asistió): solicita confirmación breve y registra para revisión.
Si nadie contesta: ofrece número de contacto.
Usa variables: {{student_name}}, {{guardian_name}}, {{rut}}, {{class_name}}, {{teacher_name}}, {{absence_date}}, {{school_name}}.
`;

  const agent = await client.conversationalAi.agents.create({
    name: "EduGuard – Llamadas de Asistencia",
    tags: ["prod", "attendance"],
    conversationConfig: {
      tts: { voiceId, modelId: "eleven_flash_v2_5" }, // v2_5 required for non-English
      agent: {
        language: "es",
        firstMessage: `Hola, habla ${schoolName}. ¿Puedo hablar con el apoderado/a de {{student_name}}?`,
        prompt: { prompt },
      },
    },
  });

  console.log("Agent created with ID:", agent.agentId);
}

main().catch((e: unknown) => {
  console.error(e);
  throw new Error("Failed to create agent");
});
