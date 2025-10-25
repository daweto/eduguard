import { Hono } from "hono";
import { cors } from "hono/cors";
import grades from "./routes/grades";
import guardians from "./routes/guardians";
import seed from "./routes/seed";
import students from "./routes/students";
import uploads from "./routes/uploads";
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

export default app;
