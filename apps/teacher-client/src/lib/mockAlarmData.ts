/**
 * Mock alarm data for demo purposes
 * Simulates reasoning analysis results from AI agents
 */

import type {
  ReasoningFlagsResponse,
  ReasoningFlagView,
} from "@repo/shared-types";

// Helper to get dates relative to today
function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Mock reasoning flags (AI risk assessments)
const mockFlags: ReasoningFlagView[] = [
  // Boris Puentes - HIGH RISK - Chronic absence pattern (TODAY)
  {
    id: "reasoning-001",
    studentId: "student-003",
    sessionId: "session-today-math",
    riskScore: 58,
    riskLabel: "medium",
    patternType: "chronic",
    summary:
      "Boris Puentes ausente recientemente, pero apoderado informó enfermedad. Ausencias registradas como justificadas; riesgo moderado.",
    recommendation: "monitor",
    reasoning:
      "Se detecta patrón de ausencias, pero el apoderado indicó que el estudiante está enfermo. Considerar excusa médica y hacer seguimiento en los próximos días.",
    confidence: 0.8,
    createdAt: getDateDaysAgo(0),
    studentName: "Boris Puentes",
    identification: "11794411-5",
    className: "Matemática I - Única",
    guardianName: "Luis Andrés Castro Ramírez",
    guardianPhone: "+56968357637",
  },
  // Felipe Torres - HIGH RISK - Sneak-out pattern (2 DAYS AGO)
  {
    id: "reasoning-002",
    studentId: "student-004",
    sessionId: "session-2days-phys",
    riskScore: 97,
    riskLabel: "high",
    patternType: "sneak_out",
    summary:
      "Felipe Torres presente en Matemáticas por la mañana y ausente en todas las clases posteriores el mismo día. Con historial previo de fuga de clases: caso muy preocupante.",
    recommendation: "immediate_call",
    reasoning:
      "Evidencia específica de asistencia en la primera hora y ausencia total después. Antecedentes de escaparse reportados por los apoderados elevan el nivel de riesgo y requieren intervención inmediata.",
    confidence: 0.94,
    createdAt: getDateDaysAgo(2),
    studentName: "Felipe Torres",
    identification: "11985894-1",
    className: "Física I - Única",
    guardianName: "David Felipe Weinstein",
    guardianPhone: "+56968357637",
  },
  // Boris Puentes - HIGH RISK - Additional chronic pattern (3 DAYS AGO)
  {
    id: "reasoning-004",
    studentId: "student-003",
    sessionId: "session-3days-chem",
    riskScore: 62,
    riskLabel: "medium",
    patternType: "chronic",
    summary:
      "Se mantiene patrón de ausencias, pero apoderado informó enfermedad durante el periodo. Registrar como ausencias justificadas y monitorear.",
    recommendation: "monitor",
    reasoning:
      "Ausencias en días previos, pero con justificación médica reportada por el apoderado. Mantener seguimiento sin escalar de inmediato.",
    confidence: 0.82,
    createdAt: getDateDaysAgo(3),
    studentName: "Boris Puentes",
    identification: "11794411-5",
    className: "Química I - Única",
    guardianName: "Luis Andrés Castro Ramírez",
    guardianPhone: "+56968357637",
  },
  // Felipe Torres - HIGH RISK - Sneak-out pattern (TODAY)
  {
    id: "reasoning-005",
    studentId: "student-004",
    sessionId: "session-today-math",
    riskScore: 90,
    riskLabel: "high",
    patternType: "sneak_out",
    summary:
      "Presente en Matemáticas en la mañana, ausente en todas las clases posteriores hoy. Patrón consistente con fuga de clases; riesgo muy alto por historial previo.",
    recommendation: "immediate_call",
    reasoning:
      "Caso de hoy muestra asistencia inicial y luego ausencia total. Con historial previo reportado por apoderados de saltarse clases, se recomienda escalar e intervenir.",
    confidence: 0.85,
    createdAt: getDateDaysAgo(0),
    studentName: "Felipe Torres",
    identification: "11985894-1",
    className: "Matemática I - Única",
    guardianName: "David Felipe Weinstein",
    guardianPhone: "+56968357637",
  },
  // Joel Salas - LOW RISK - Irregular pattern (3 DAYS AGO)
  {
    id: "reasoning-003",
    studentId: "student-001",
    sessionId: "session-3days-chem",
    riskScore: 35,
    riskLabel: "low",
    patternType: "irregular",
    summary:
      "Joel Salas tuvo una ausencia aislada en química. Su asistencia general es buena, pero se recomienda monitoreo preventivo.",
    recommendation: "monitor",
    reasoning:
      "El estudiante tiene un historial de asistencia generalmente positivo (presente en 4 de 5 sesiones). Esta ausencia parece ser un evento aislado, pero vale la pena mantener seguimiento.",
    confidence: 0.72,
    createdAt: getDateDaysAgo(3),
    studentName: "Joel Salas",
    identification: "4871402-1",
    className: "Química I - Única",
    guardianName: "Pedro José Muñoz García",
    guardianPhone: "+56968357637",
  },
  // Sheen Fernández - MEDIUM RISK - Late pattern (1 DAY AGO)
  {
    id: "reasoning-006",
    studentId: "student-002",
    sessionId: "session-yesterday-lang",
    riskScore: 55,
    riskLabel: "medium",
    patternType: "irregular",
    summary:
      "Sheen Fernández ha llegado tarde en 3 ocasiones esta semana. Patrón de puntualidad irregular que puede afectar su rendimiento académico.",
    recommendation: "monitor",
    reasoning:
      "El estudiante muestra un patrón de llegadas tardías frecuentes. Aunque está presente, el retraso constante puede indicar problemas en casa o en el transporte que merecen seguimiento.",
    confidence: 0.75,
    createdAt: getDateDaysAgo(1),
    studentName: "Sheen Fernández",
    identification: "9878848-4",
    className: "Lenguaje y Comunicación I - Única",
    guardianName: "Carmen Rosa Fernández Soto",
    guardianPhone: "+56968357637",
  },
];

/**
 * Simulates fetching reasoning flags from API with a promise
 * @param from - Start date filter (ISO string)
 * @param to - End date filter (ISO string)
 * @param delay - Simulated network delay in ms (default: 800ms)
 */
export async function getMockReasoningFlags(
  from?: string,
  to?: string,
  delay = 800,
): Promise<ReasoningFlagsResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Filter flags by date range if provided
  let filteredFlags = [...mockFlags];

  if (from || to) {
    filteredFlags = mockFlags.filter((flag) => {
      const flagDate = new Date(flag.createdAt);

      // Compare dates only (ignore time)
      const flagDateOnly = new Date(flagDate.toISOString().split("T")[0]);

      if (from) {
        const fromDate = new Date(from);
        if (flagDateOnly < fromDate) {
          return false;
        }
      }

      if (to) {
        const toDate = new Date(to);
        if (flagDateOnly > toDate) {
          return false;
        }
      }

      return true;
    });
  }

  // Sort by date (most recent first)
  filteredFlags.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    flags: filteredFlags,
    total: filteredFlags.length,
  };
}

/**
 * Use this flag to enable/disable mock data in development
 * Set to true to use mock data instead of real API
 */
export const USE_MOCK_ALARM_DATA = true;
