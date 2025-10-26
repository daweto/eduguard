import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import reasoningApp from "./routes/reasoning.js";
import voiceApp from "./routes/voice.js";
import "dotenv/config";

// Main app following Hono best practices
const app = new Hono();

// Enable CORS for Cloudflare Workers API
app.use(
  "/*",
  cors({
    origin: "*", // In production, restrict to your domains
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check - handler defined inline
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "EduGuard AI Agents",
    agents: {
      reasoning: "GPT-4 via Vercel AI SDK",
      voice: "ElevenLabs Conversational AI",
    },
    timestamp: new Date().toISOString(),
  });
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
console.log(`📊 Reasoning Agent: Ready (GPT-4)`);
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
