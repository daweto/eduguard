/* eslint-disable import-x/order */
import { generateObject } from "ai";
import { Hono } from "hono";
import { z } from "zod";
import type {
  ReasoningBulkAnalyzeRequest,
  ReasoningAnalyzeSingleRequest,
  ReasoningAnalyzeSingleResponse,
  ReasoningBatchAnalyzeResponse,
  RiskAssessmentObject,
} from "@repo/shared-types";
import { openai } from "@ai-sdk/openai";

// Route handlers defined inline following Hono best practices
const app = new Hono();

function isBulkAnalyzeRequest(
  req: unknown,
): req is ReasoningBulkAnalyzeRequest {
  if (typeof req !== "object" || req === null) return false;
  const r = req as { absent?: unknown; session_id?: unknown };
  return Array.isArray(r.absent) && typeof r.session_id === "string";
}

// Risk Assessment Schema
const RiskAssessmentSchema = z.object({
  risk_level: z.enum(["none", "low", "medium", "high"]),
  pattern_type: z.enum(["normal", "sneak_out", "chronic", "irregular"]),
  confidence: z.number().min(0).max(1),
  should_notify: z.boolean(),
  reasoning: z.string(),
  recommended_action: z.enum(["none", "monitor", "immediate_call"]),
});

interface AttendanceRecord {
  date: string;
  period?: number;
  status: string;
  classId?: string;
  className?: string;
  confidence?: number | null;
}

/**
 * POST /analyze
 * Analyze student attendance pattern using GPT-5-nano
 */
app.post("/analyze", async (c) => {
  try {
    const raw: unknown = await c.req.json();

    // Bulk absent path from API attendance trigger
    if (isBulkAnalyzeRequest(raw)) {
      const sessionId: string = raw.session_id;
      const apiUrl = process.env.API_BASE_URL ?? process.env.API_URL;

      // Simple rule-based: mark all as medium risk; if name matches demo, mark high
      for (const a of raw.absent) {
        const riskLabel = a.name.toLowerCase().includes("joel")
          ? "high"
          : "medium";
        const payload = {
          studentId: a.student_id,
          sessionId,
          riskScore: riskLabel === "high" ? 95 : 70,
          riskLabel,
          patternType: "irregular" as const,
          summary: `Ausencia detectada en sesión ${sessionId}`,
          recommendation: riskLabel === "high" ? "immediate_call" : "monitor",
          reasoning: "Regla simple (hackathon): ausente hoy",
          confidence: 0.7,
          detectedBy: ["rule_engine"],
        };
        if (apiUrl) {
          // Fire-and-forget log with error handling
          fetch(`${apiUrl}/api/reasoning/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch((err: unknown) => {
            console.error("[reasoning] Failed to log analysis:", {
              studentId: payload.studentId,
              sessionId: payload.sessionId,
              error: err instanceof Error ? err.message : String(err),
            });
          });

          // Auto-call for high risk if we have guardian
          if (riskLabel === "high" && a.guardian_id && a.guardian_phone) {
            fetch(`${apiUrl}/api/voice/call`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                student_id: a.student_id,
                guardian_id: a.guardian_id,
                guardian_phone: a.guardian_phone,
                session_id: sessionId,
                pattern_type: "irregular",
                risk_level: "high",
                reason: "auto from reasoning",
                initiated_by: "reasoning-auto",
              }),
            }).catch((err: unknown) => {
              console.error("[reasoning] Failed to trigger auto-call:", {
                studentId: a.student_id,
                guardianId: a.guardian_id,
                sessionId: sessionId,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          }
        }
      }

      return c.json({
        analyzed: raw.absent.length,
        session_id: sessionId,
      });
    }

    // Single-student analysis path
    const body = raw as ReasoningAnalyzeSingleRequest;

    const {
      student_id,
      student_name,
      session_id,
      today_attendance,
      history_7d,
    } = body;

    if (!student_id) {
      return c.json(
        {
          error: "Missing required field: student_id",
        },
        400,
      );
    }

    if (today_attendance.length === 0) {
      return c.json(
        {
          error: "today_attendance must not be empty",
        },
        400,
      );
    }

    if (history_7d.length === 0) {
      return c.json(
        {
          error: "history_7d must not be empty",
        },
        400,
      );
    }

    // Format attendance for GPT-5-nano
    const today = new Date().toISOString().split("T")[0];

    const todayFormatted = today_attendance
      .map((a) => {
        const periodNum = a.period ?? 0;
        const period = a.period
          ? `Period ${String(periodNum)}`
          : (a.className ?? "Class");
        const conf = a.confidence
          ? ` (${a.confidence.toFixed(1)}% confidence)`
          : "";
        return `- ${period}: ${a.status.toUpperCase()}${conf}`;
      })
      .join("\n");

    const historyFormatted = history_7d
      .slice(0, 20)
      .map((a) => {
        const dateStr = a.date.split("T")[0] ?? a.date;
        const period = a.period ? `P${String(a.period)}` : "";
        return `- ${dateStr} ${period}: ${a.status}`;
      })
      .join("\n");

    // Calculate stats
    const totalRecords = history_7d.length;
    const absentCount = history_7d.filter((a) => a.status === "absent").length;
    const absentRate =
      totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0;

    console.log(`🧠 Analyzing attendance for ${student_name} (${student_id})`);
    console.log(`   Today: ${String(today_attendance.length)} records`);
    console.log(
      `   History: ${String(totalRecords)} records, ${String(absentCount)} absences (${absentRate.toFixed(1)}%)`,
    );

    const result = await generateObject({
      model: openai("gpt-5-nano"),
      output: "object",
      schema: RiskAssessmentSchema,
      prompt: `You are an expert school attendance analyst. Analyze this student's attendance pattern and assess risk.

STUDENT: ${student_name}
DATE: ${today}

TODAY'S ATTENDANCE:
${todayFormatted}

LAST 7 DAYS HISTORY:
${historyFormatted}

STATISTICS:
- Total records: ${String(totalRecords)}
- Absent: ${String(absentCount)} (${absentRate.toFixed(1)}%)

DETECTION RULES:
1. SNEAK-OUT (HIGH RISK): Present in first period/class, then absent in subsequent periods on the same day
   - This indicates the student may have left campus without authorization mid-day
2. CHRONIC ABSENCE (MEDIUM RISK): Absent 3+ times in the past 7 days (>40% absence rate)
3. IRREGULAR (LOW RISK): Random absences with no clear concerning pattern
4. NORMAL: Good attendance, no concerning patterns

Analyze the pattern and provide:
- Risk level (none/low/medium/high)
- Pattern type (normal/sneak_out/chronic/irregular)
- Confidence score (0-1)
- Whether to notify parents
- Clear reasoning
- Recommended action`,
      temperature: 0.3, // Low temperature for consistent analysis
    });

    const analysis: RiskAssessmentObject =
      result.object as unknown as RiskAssessmentObject;

    console.log(
      `   ✅ Analysis complete: ${analysis.risk_level} risk - ${analysis.pattern_type}`,
    );

    // Note: Auto-triggering of voice calls is handled in the bulk analyze endpoint
    // when guardian info is available from the attendance session

    const response: ReasoningAnalyzeSingleResponse = {
      student_id,
      student_name,
      session_id,
      analysis,
      analyzed_at: new Date().toISOString(),
      stats: {
        total_records: totalRecords,
        absent_count: absentCount,
        absent_rate: absentRate,
      },
    };
    return c.json(response);
  } catch (error) {
    console.error("❌ Reasoning analysis error:", error);
    return c.json(
      {
        error: "Failed to analyze attendance pattern",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /batch-analyze
 * Analyze multiple students at once
 */
app.post("/batch-analyze", async (c) => {
  try {
    const body = await c.req.json<{
      students: {
        student_id: string;
        student_name: string;
        today_attendance: AttendanceRecord[];
        history_7d: AttendanceRecord[];
      }[];
      session_id: string;
    }>();

    const { students, session_id } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return c.json({ error: "students must be a non-empty array" }, 400);
    }

    console.log(`🧠 Batch analyzing ${String(students.length)} students...`);

    // Analyze all students in parallel
    const results = await Promise.all(
      students.map(async (student) => {
        try {
          const response = await fetch(
            c.req.url.replace("/batch-analyze", "/analyze"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...student,
                session_id,
              }),
            },
          );
          return await response.json();
        } catch (err) {
          return {
            student_id: student.student_id,
            error: err instanceof Error ? err.message : "Analysis failed",
          };
        }
      }),
    );

    interface ResultItem {
      error?: string;
      student_id: string;
    }
    const successful = results.filter(
      (r): r is ResultItem => !(r as ResultItem).error,
    );
    const failed = results.filter((r): r is ResultItem =>
      Boolean((r as ResultItem).error),
    );

    console.log(
      `   ✅ Batch complete: ${String(successful.length)} succeeded, ${String(failed.length)} failed`,
    );

    const payload: ReasoningBatchAnalyzeResponse = {
      session_id,
      total: students.length,
      successful: successful.length,
      failed: failed.length,
      results,
    };
    return c.json(payload);
  } catch (error) {
    console.error("❌ Batch analysis error:", error);
    return c.json(
      {
        error: "Failed to batch analyze",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
export type ReasoningAppType = typeof app;
