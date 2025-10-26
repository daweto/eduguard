import { Hono } from "hono";
import { cors } from "hono/cors";
import attendance from "./routes/attendance";
import classes from "./routes/classes";
import grades from "./routes/grades";
import guardians from "./routes/guardians";
import seed from "./routes/seed";
import students from "./routes/students";
import uploads from "./routes/uploads";
import reasoning from "./routes/reasoning";
import voice from "./routes/voice";
import webhooks from "./routes/webhooks";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend
app.use(
  "/*",
  cors({
    origin: "*", // In production, restrict to your frontend domain
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "EduGuard API v2",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route("/api/students", students);
app.route("/api/grades", grades);
app.route("/api/guardians", guardians);
app.route("/api/seed", seed);
app.route("/api/uploads", uploads);
app.route("/api/attendance", attendance);
app.route("/api/classes", classes);

// AI Agents proxy routes
app.route("/api/reasoning", reasoning);
app.route("/api/voice", voice);

// Webhooks
app.route("/api/webhooks", webhooks);

export default app;
