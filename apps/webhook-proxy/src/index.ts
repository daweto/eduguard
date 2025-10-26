import { Hono } from "hono";
import { cors } from "hono/cors";

interface Bindings {
  FORWARD_TO_URL?: string;
  WEBHOOK_SECRET?: string;
  ELEVENLABS_CONVAI_WEBHOOK_SECRET?: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS similar to api-v2
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
  }),
);

app.get("/", (c) =>
  c.json({
    status: "ok",
    service: "webhook-proxy",
    time: new Date().toISOString(),
  }),
);

app.post("/elevenlabs/call-completed", async (c) => {
  try {
    const bodyText = await c.req.text();

    // Verify HMAC signature
    const header =
      c.req.header("ElevenLabs-Signature") ??
      c.req.header("elevenlabs-signature");
    const secret =
      c.env.WEBHOOK_SECRET ?? c.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET;

    if (!secret || !header) {
      console.warn("[Webhook] 401 unauthorized", {
        hasSecret: Boolean(secret),
        hasHeader: Boolean(header),
      });
      return c.json({ error: "unauthorized" }, 401);
    }

    const parts = header.split(",");
    const t = parts.find((p) => p.startsWith("t="))?.slice(2);
    const v0 = parts.find((p) => p.startsWith("v0="));
    if (!t || !v0) {
      console.warn("[Webhook] 401 invalid signature format", { header });
      return c.json({ error: "invalid signature" }, 401);
    }

    // Timestamp tolerance: 30 minutes
    const tsMs = Number(t) * 1000;
    const tolerance = Date.now() - 30 * 60 * 1000;
    if (Number.isFinite(tsMs) && tsMs < tolerance) {
      console.warn("[Webhook] 401 expired signature", { t, tsMs, tolerance });
      return c.json({ error: "expired" }, 401);
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${t}.${bodyText}`),
    );
    const hex = [...new Uint8Array(signature)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `v0=${hex}`;

    if (expected !== v0) {
      console.warn("[Webhook] 401 signature mismatch", {
        match: expected === v0,
        provided: v0.slice(0, 14),
        expected: expected.slice(0, 14),
      });
      return c.json({ error: "invalid signature" }, 401);
    }

    // Parse JSON now that signature is valid
    try {
      JSON.parse(bodyText);
    } catch {
      return c.json({ error: "invalid payload" }, 400);
    }

    // Log truncated version to avoid exceeding log size limits
    const truncated =
      bodyText.slice(0, 1000) + (bodyText.length > 1000 ? "..." : "");
    console.log(
      "[Webhook] webhook-proxy elevenlabs call-completed (truncated)",
      truncated,
    );

    let forwarded = false;
    let forwardStatus: number | undefined;
    let forwardError: string | undefined;

    if (c.env.FORWARD_TO_URL) {
      try {
        const resp = await fetch(c.env.FORWARD_TO_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyText, // forward original JSON
        });
        forwardStatus = resp.status;
        forwarded = true;
      } catch (e) {
        forwardError = e instanceof Error ? e.message : String(e);
        console.warn("[Webhook] forward failed:", forwardError);
      }
    } else {
      throw new Error("FORWARD_TO_URL not configured");
    }

    return c.json({ received: true, forwarded, forwardStatus, forwardError });
  } catch (e) {
    return c.json(
      { error: "failed", details: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});

export default app;
