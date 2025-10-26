/* eslint-disable import-x/order */
import { Hono } from "hono";
import type { Bindings } from "../types";

import type {
  ReasoningAnalysisInput,
  ReasoningFlagsResponse,
  RiskLevel,
  RecommendationType,
  PatternType,
} from "@repo/shared-types";

const reasoning = new Hono<{ Bindings: Bindings }>();

// Log reasoning analysis
reasoning.post("/log", async (c) => {
  try {
    const body = await c.req.json<ReasoningAnalysisInput>();

    const { drizzle } = await import("drizzle-orm/d1");
    const { reasoningAnalyses } = await import("../db/schema");
    const db = drizzle(c.env.DB);

    const id = crypto.randomUUID();

    await db.insert(reasoningAnalyses).values({
      id,
      studentId: body.studentId,
      sessionId: body.sessionId,
      riskScore: body.riskScore,
      riskLabel: body.riskLabel,
      patternType: body.patternType ?? null,
      summary: body.summary,
      recommendation: body.recommendation,
      reasoning: body.reasoning ?? null,
      confidence: body.confidence ?? null,
    });

    return c.json({ id });
  } catch (e) {
    console.error("/reasoning/log error", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Flags view (today or range)
reasoning.get("/flags", async (c) => {
  try {
    const url = new URL(c.req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const { drizzle } = await import("drizzle-orm/d1");
    const {
      reasoningAnalyses,
      students,
      legalGuardians,
      sessions,
      classes,
      courses,
    } = await import("../db/schema");
    const { and, gte, lte, eq, desc } = await import("drizzle-orm");

    const db = drizzle(c.env.DB);

    // Build time window
    const whereClause =
      from && to
        ? and(
            gte(reasoningAnalyses.createdAt, from),
            lte(reasoningAnalyses.createdAt, to),
          )
        : (() => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setUTCDate(today.getUTCDate() + 1);
            return and(
              gte(reasoningAnalyses.createdAt, today.toISOString()),
              lte(reasoningAnalyses.createdAt, tomorrow.toISOString()),
            );
          })();

    const rows = await db
      .select({
        analysis: reasoningAnalyses,
        student: students,
        guardian: legalGuardians,
        session: sessions,
        class: classes,
        course: courses,
      })
      .from(reasoningAnalyses)
      .leftJoin(students, eq(reasoningAnalyses.studentId, students.id))
      .leftJoin(legalGuardians, eq(students.guardianId, legalGuardians.id))
      .leftJoin(sessions, eq(reasoningAnalyses.sessionId, sessions.id))
      .leftJoin(classes, eq(sessions.classId, classes.id))
      .leftJoin(courses, eq(classes.courseId, courses.id))
      .where(whereClause)
      .orderBy(desc(reasoningAnalyses.createdAt));

    const result = rows.map((r) => ({
      id: r.analysis.id,
      studentId: r.analysis.studentId,
      sessionId: r.analysis.sessionId,
      riskScore: r.analysis.riskScore,
      riskLabel: r.analysis.riskLabel as RiskLevel,
      patternType: (r.analysis.patternType ?? undefined) as
        | PatternType
        | undefined,
      summary: r.analysis.summary,
      recommendation: r.analysis.recommendation as RecommendationType,
      reasoning: r.analysis.reasoning ?? undefined,
      confidence: r.analysis.confidence ?? undefined,
      createdAt: r.analysis.createdAt ?? new Date().toISOString(),
      studentName: r.student
        ? `${r.student.firstName} ${r.student.middleName ?? ""} ${r.student.lastName} ${r.student.secondLastName ?? ""}`.trim()
        : "",
      identification: r.student?.identificationNumber ?? "",
      className: r.course
        ? `${r.course.name} - ${r.class?.section ?? ""}`.trim()
        : undefined,
      guardianName: r.guardian
        ? `${r.guardian.firstName} ${r.guardian.lastName}`
        : undefined,
      guardianPhone: r.guardian?.phone,
    }));

    const payload: ReasoningFlagsResponse = {
      flags: result,
      total: result.length,
    };
    return c.json(payload);
  } catch (e) {
    console.error("/reasoning/flags error", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * Proxy all requests to the AI Agents reasoning service
 * Forwards to AI_AGENTS_URL/api/reasoning/*
 */
reasoning.all("/*", async (c) => {
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

  // Get the path after /api/reasoning
  const path = c.req.path.replace("/api/reasoning", "");
  const targetUrl = `${aiAgentsUrl}/api/reasoning${path}`;

  try {
    // Forward the request
    // Convert headers to plain object
    const headerEntries: [string, string][] = [];
    c.req.raw.headers.forEach((value, key) => {
      headerEntries.push([key, value]);
    });

    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headerEntries),
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
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Reasoning proxy error:", error);
    return c.json(
      {
        error: "Failed to connect to AI Agents service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      503,
    );
  }
});

export default reasoning;
