import { Hono } from "hono";
import type { Bindings } from "../types";

const reasoning = new Hono<{ Bindings: Bindings }>();

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
      500
    );
  }

  // Get the path after /api/reasoning
  const path = c.req.path.replace("/api/reasoning", "");
  const targetUrl = `${aiAgentsUrl}/api/reasoning${path}`;

  try {
    // Forward the request
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(c.req.raw.headers),
      },
      body: c.req.method !== "GET" && c.req.method !== "HEAD" ? await c.req.raw.text() : undefined,
    });

    // Return the response from AI Agents
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Reasoning proxy error:", error);
    return c.json(
      {
        error: "Failed to connect to AI Agents service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
});

export default reasoning;
