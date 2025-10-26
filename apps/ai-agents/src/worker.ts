/**
 * Cloudflare Worker for AI Agents Container
 *
 * This Worker routes requests to the AI Agents container running in a Durable Object.
 * The container runs the full Node.js server with Hono, Vercel AI SDK, and ElevenLabs.
 */

import { Container } from "@cloudflare/containers";

// Container-enabled Durable Object
export class AIAgentsContainer extends Container {
  // Port the Node.js server listens on inside the container
  defaultPort = 3001;

  // Sleep after 10 minutes of inactivity to save costs
  sleepAfter = "10m";

  override onStart() {
    console.log("🤖 AI Agents Container started successfully");
  }

  override onStop() {
    console.log("🛑 AI Agents Container shut down");
  }

  override onError(error: unknown) {
    console.error("❌ AI Agents Container error:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }

  // Durable Object alarm handler (invoked by Cloudflare for scheduled wake/sleep)
  // Ensures we observe any exceptions happening during alarm ticks
  override async alarm(alarmProps: {
    isRetry: boolean;
    retryCount: number;
  }): Promise<void> {
    await super.alarm(alarmProps);

    interface IdObj {
      toString(): string;
    }
    interface StateObj {
      id?: IdObj;
    }
    const state = (this as unknown as { state?: StateObj }).state;
    const id = state?.id?.toString();
    const now = new Date().toISOString();
    try {
      console.log("[ai-agents container] DO alarm fired", { id, now });
    } catch (err) {
      console.error("[ai-agents container] DO alarm error", {
        id,
        now,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check at worker level
    if (url.pathname === "/worker-health") {
      return Response.json({
        status: "ok",
        worker: "ai-agents-proxy",
        timestamp: new Date().toISOString(),
      });
    }

    // Comprehensive health check - tests container connectivity
    if (url.pathname === "/worker-health/full") {
      const container = env.AI_AGENTS_CONTAINER.getByName("ai-agents-primary");

      try {
        // Try to reach the container's health endpoint
        const healthUrl = new URL(request.url);
        healthUrl.pathname = "/health";
        const containerResponse = await container.fetch(healthUrl.toString());
        const containerHealth = await containerResponse.json();

        return Response.json({
          status: "ok",
          worker: "ai-agents-proxy",
          container: {
            reachable: true,
            health: containerHealth,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return Response.json(
          {
            status: "degraded",
            worker: "ai-agents-proxy",
            container: {
              reachable: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 503 },
        );
      }
    }

    // Route all other requests to the container
    // Using getByName with a fixed name ensures we use a single container instance
    // For load balancing across multiple containers, you could use getRandom or other routing logic
    const container = env.AI_AGENTS_CONTAINER.getByName("ai-agents-primary");

    try {
      // Start container with environment variables if not already running
      // This ensures env vars are passed on first request
      await container.startAndWaitForPorts({
        startOptions: {
          envVars: {
            PORT: "3001",
            NODE_ENV: "production",
            OPENAI_API_KEY: env.OPENAI_API_KEY ?? "",
            ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY ?? "",
            ELEVENLABS_AGENT_ID: env.ELEVENLABS_AGENT_ID ?? "",
            ELEVENLABS_PHONE_NUMBER_ID: env.ELEVENLABS_PHONE_NUMBER_ID ?? "",
            CLOUDFLARE_API_URL: env.CLOUDFLARE_API_URL ?? "",
            SCHOOL_NAME: env.SCHOOL_NAME ?? "Colegio Skyward",
          },
        },
      });

      // Forward the request to the container
      const response = await container.fetch(request);

      // Log unsuccessful responses for debugging
      if (!response.ok) {
        console.warn(
          `Container returned ${response.status.toString()} for ${url.pathname}`,
        );
      }

      return response;
    } catch (error) {
      console.error("❌ Error routing to container:", error);

      // Provide more helpful error messages
      let errorMessage = "Unknown error";
      let errorDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack ?? "";

        // Check for specific error types
        if (errorMessage.includes("not running")) {
          errorDetails =
            "The container has not been started. Try accessing any endpoint to trigger container startup.";
        } else if (errorMessage.includes("exit code")) {
          errorDetails =
            "The container crashed during startup. Check Cloudflare logs with: wrangler tail";
        }
      }

      return Response.json(
        {
          error: "Container unavailable",
          message: errorMessage,
          details: errorDetails,
          timestamp: new Date().toISOString(),
          tip: "Check container logs with: wrangler tail --config apps/ai-agents/wrangler.jsonc",
        },
        { status: 503 },
      );
    }
  },
};

// TypeScript types for environment bindings
export interface Env {
  AI_AGENTS_CONTAINER: DurableObjectNamespace<AIAgentsContainer>;

  // Secrets (set via wrangler secret put)
  OPENAI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_AGENT_ID?: string;
  ELEVENLABS_PHONE_NUMBER_ID?: string;
  CLOUDFLARE_API_URL?: string;
  SCHOOL_NAME?: string;
}
