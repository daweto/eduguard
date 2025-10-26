import { Hono } from 'hono';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Route handlers defined inline following Hono best practices
const app = new Hono();

// Risk Assessment Schema
const RiskAssessmentSchema = z.object({
  risk_level: z.enum(['none', 'low', 'medium', 'high']),
  pattern_type: z.enum(['normal', 'sneak_out', 'chronic', 'irregular']),
  confidence: z.number().min(0).max(1),
  should_notify: z.boolean(),
  reasoning: z.string(),
  recommended_action: z.enum(['none', 'monitor', 'immediate_call']),
});

type AttendanceRecord = {
  date: string;
  period?: number;
  status: string;
  classId?: string;
  className?: string;
  confidence?: number | null;
};

/**
 * POST /analyze
 * Analyze student attendance pattern using GPT-4
 */
app.post('/analyze', async (c) => {
  try {
    const body = await c.req.json<{
      student_id: string;
      student_name: string;
      session_id: string;
      today_attendance: AttendanceRecord[];
      history_7d: AttendanceRecord[];
    }>();

    const { student_id, student_name, session_id, today_attendance, history_7d } = body;

    if (!student_id || !today_attendance || !history_7d) {
      return c.json({
        error: 'Missing required fields: student_id, today_attendance, history_7d',
      }, 400);
    }

    // Format attendance for GPT-4
    const today = new Date().toISOString().split('T')[0];
    
    const todayFormatted = today_attendance.map((a) => {
      const period = a.period ? `Period ${a.period}` : a.className || 'Class';
      const conf = a.confidence ? ` (${a.confidence.toFixed(1)}% confidence)` : '';
      return `- ${period}: ${a.status.toUpperCase()}${conf}`;
    }).join('\n');

    const historyFormatted = history_7d.slice(0, 20).map((a) => {
      const dateStr = a.date.split('T')[0];
      const period = a.period ? `P${a.period}` : '';
      return `- ${dateStr} ${period}: ${a.status}`;
    }).join('\n');

    // Calculate stats
    const totalRecords = history_7d.length;
    const absentCount = history_7d.filter(a => a.status === 'absent').length;
    const absentRate = totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0;

    console.log(`🧠 Analyzing attendance for ${student_name} (${student_id})`);
    console.log(`   Today: ${today_attendance.length} records`);
    console.log(`   History: ${totalRecords} records, ${absentCount} absences (${absentRate.toFixed(1)}%)`);

    // Call GPT-4 for pattern analysis
    const result = await generateObject({
      model: openai('gpt-4o-mini') as any, // Fast and cost-effective
      schema: RiskAssessmentSchema,
      prompt: `You are an expert school attendance analyst. Analyze this student's attendance pattern and assess risk.

STUDENT: ${student_name}
DATE: ${today}

TODAY'S ATTENDANCE:
${todayFormatted}

LAST 7 DAYS HISTORY:
${historyFormatted}

STATISTICS:
- Total records: ${totalRecords}
- Absent: ${absentCount} (${absentRate.toFixed(1)}%)

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

    const analysis = result.object;

    console.log(`   ✅ Analysis complete: ${analysis.risk_level} risk - ${analysis.pattern_type}`);

    return c.json({
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
    });

  } catch (error) {
    console.error('❌ Reasoning analysis error:', error);
    return c.json({
      error: 'Failed to analyze attendance pattern',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /batch-analyze
 * Analyze multiple students at once
 */
app.post('/batch-analyze', async (c) => {
  try {
    const body = await c.req.json<{
      students: Array<{
        student_id: string;
        student_name: string;
        today_attendance: AttendanceRecord[];
        history_7d: AttendanceRecord[];
      }>;
      session_id: string;
    }>();

    const { students, session_id } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return c.json({ error: 'students array is required' }, 400);
    }

    console.log(`🧠 Batch analyzing ${students.length} students...`);

    // Analyze all students in parallel
    const results = await Promise.all(
      students.map(async (student) => {
        try {
          const response = await fetch(`${c.req.url.replace('/batch-analyze', '/analyze')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...student,
              session_id,
            }),
          });
          return await response.json();
        } catch (err) {
          return {
            student_id: student.student_id,
            error: err instanceof Error ? err.message : 'Analysis failed',
          };
        }
      })
    );

    const successful = results.filter((r: any) => !r.error);
    const failed = results.filter((r: any) => r.error);

    console.log(`   ✅ Batch complete: ${successful.length} succeeded, ${failed.length} failed`);

    return c.json({
      session_id,
      total: students.length,
      successful: successful.length,
      failed: failed.length,
      results,
    });

  } catch (error) {
    console.error('❌ Batch analysis error:', error);
    return c.json({
      error: 'Failed to batch analyze',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;
export type ReasoningAppType = typeof app;

