import { Hono } from "hono";

type Bindings = {
  FORWARD_TO_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) =>
  c.json({
    status: "ok",
    service: "webhook-proxy",
    time: new Date().toISOString(),
  }),
);

app.post("/elevenlabs/call-completed", async (c) => {
  try {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      const text = await c.req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        return c.json({ error: "invalid payload" }, 400);
      }
    }

    console.log("[Webhook] elevenlabs call-completed", JSON.stringify(payload));

    let forwarded = false;
    let forwardStatus: number | undefined;
    let forwardError: string | undefined;

    if (c.env.FORWARD_TO_URL) {
      try {
        const resp = await fetch(c.env.FORWARD_TO_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        forwardStatus = resp.status;
        forwarded = true;
      } catch (e) {
        forwardError = e instanceof Error ? e.message : String(e);
        console.warn("[Webhook] forward failed:", forwardError);
      }
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
