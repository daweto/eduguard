import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import reasoningApp from "./routes/reasoning.js";
import voiceApp from "./routes/voice.js";
import "dotenv/config";

// Validate environment variables at startup
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "ELEVENLABS_PHONE_NUMBER_ID",
  "CLOUDFLARE_API_URL",
];

console.log("🔍 Checking environment variables...");
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(
    "⚠️  WARNING: Missing environment variables:",
    missingVars.join(", "),
  );
  console.warn("⚠️  Services will be marked as 'not_configured'");
  console.warn("⚠️  Server will start but some functionality may not work");
} else {
  console.log("✅ All required environment variables are configured");
}

// Main app following Hono best practices
const app = new Hono();

// Enable CORS for Cloudflare Workers API
app.use(
  "/*",
  cors({
    origin: "*", // In production, restrict to your domains
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
  }),
);

// Health check - handler defined inline
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "EduGuard AI Agents",
    agents: {
      reasoning: "GPT-5-nano via Vercel AI SDK",
      voice: "ElevenLabs Conversational AI",
    },
    timestamp: new Date().toISOString(),
  });
});

// Comprehensive health check
app.get("/health", (c) => {
  const checks = {
    openai: !!process.env.OPENAI_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    elevenlabs_agent: !!process.env.ELEVENLABS_AGENT_ID,
    elevenlabs_phone: !!process.env.ELEVENLABS_PHONE_NUMBER_ID,
    cloudflare_api: !!process.env.CLOUDFLARE_API_URL,
  };

  const allHealthy = Object.values(checks).every((check) => check);

  // Always return 200 so container doesn't crash on health check failures
  // Just mark the status as degraded if some services aren't configured
  return c.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      service: "EduGuard AI Agents",
      timestamp: new Date().toISOString(),
      message: allHealthy
        ? "All services configured and ready"
        : "Some services not configured. Check 'checks' for details.",
      checks: {
        openai_configured: checks.openai,
        elevenlabs_configured: checks.elevenlabs,
        elevenlabs_agent_configured: checks.elevenlabs_agent,
        elevenlabs_phone_configured: checks.elevenlabs_phone,
        cloudflare_api_configured: checks.cloudflare_api,
      },
      agents: {
        reasoning: {
          provider: "OpenAI GPT-5-nano",
          status: checks.openai ? "ready" : "not_configured",
        },
        voice: {
          provider: "ElevenLabs Conversational AI",
          status:
            checks.elevenlabs &&
            checks.elevenlabs_agent &&
            checks.elevenlabs_phone
              ? "ready"
              : "not_configured",
        },
      },
    },
    200, // Always return 200 so Docker healthcheck passes
  );
});

// Mount sub-apps with app.route() - Hono best practice for larger applications
app.route("/api/reasoning", reasoningApp);
app.route("/api/voice", voiceApp);

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`🤖 AI Agents Server starting on port ${String(port)}...`);

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ AI Agents Server running at http://localhost:${String(port)}`);
console.log(`📊 Reasoning Agent: Ready (GPT-5-nano)`);
console.log(`📞 Voice Agent: Ready (ElevenLabs)`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  server.close();
  throw new Error("Server shutting down due to SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  server.close((err) => {
    if (err) {
      console.error("Error during shutdown:", err);
      throw new Error("Server shutdown with errors");
    }
    throw new Error("Server shutting down due to SIGTERM");
  });
});

// Export app and type for RPC support
export default app;
export type AppType = typeof app;
