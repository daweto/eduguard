# AI Agents Architecture - Hono Best Practices

This codebase follows **Hono framework best practices** for building scalable Node.js applications.

## 📐 Structure

```
apps/ai-agents/
├── src/
│   ├── index.ts           → Main app (mounts sub-apps)
│   └── routes/
│       ├── reasoning.ts   → Reasoning agent sub-app
│       └── voice.ts       → Voice agent sub-app
├── package.json
└── tsconfig.json
```

## ✅ Best Practices Implemented

### 1. **Handlers Defined Inline (Not Controllers)**

❌ **DON'T** create Rails-like controllers:

```typescript
// 🙁 Bad - type inference doesn't work
const analyzeHandler = (c: Context) => {
  const id = c.req.param("id"); // Can't infer path param
  return c.json("result");
};
app.get("/analyze/:id", analyzeHandler);
```

✅ **DO** define handlers inline:

```typescript
// 😃 Good - type inference works!
app.post("/analyze", async (c) => {
  const body = await c.req.json(); // Fully typed
  return c.json({ result: "ok" });
});
```

**Why?** TypeScript can properly infer path parameters, request body types, and response types when handlers are defined inline.

### 2. **Use `app.route()` for Larger Applications**

Our structure separates concerns into sub-apps:

**`src/routes/reasoning.ts`**

```typescript
import { Hono } from "hono";

const app = new Hono();

// All reasoning routes
app.post("/analyze", async (c) => {
  /* ... */
});
app.post("/batch-analyze", async (c) => {
  /* ... */
});

export default app;
export type ReasoningAppType = typeof app; // For RPC
```

**`src/routes/voice.ts`**

```typescript
import { Hono } from "hono";

const app = new Hono();

// All voice routes
app.post("/call", async (c) => {
  /* ... */
});
app.get("/call/:call_id", async (c) => {
  /* ... */
});

export default app;
export type VoiceAppType = typeof app; // For RPC
```

**`src/index.ts`** (Main app)

```typescript
import reasoningApp from "./routes/reasoning.js";
import voiceApp from "./routes/voice.js";

const app = new Hono();

// Mount sub-apps
app.route("/api/reasoning", reasoningApp);
app.route("/api/voice", voiceApp);

export default app;
export type AppType = typeof app; // For RPC
```

**Benefits:**

- ✅ Clean separation of concerns
- ✅ Each sub-app is independently testable
- ✅ Type-safe RPC client support
- ✅ Easy to scale (add more sub-apps)

### 3. **Export Types for RPC Support**

Each sub-app exports its type for type-safe RPC clients:

```typescript
// reasoning.ts
export default app;
export type ReasoningAppType = typeof app;

// voice.ts
export default app;
export type VoiceAppType = typeof app;

// index.ts
export default app;
export type AppType = typeof app;
```

This enables type-safe API clients using `hono/client`:

```typescript
import { hc } from "hono/client";
import type { AppType } from "./src/index.js";

// Fully typed client!
const client = hc<AppType>("http://localhost:3001");

// TypeScript knows the exact endpoints and types
const response = await client.api.reasoning.analyze.$post({
  json: {
    student_id: "123",
    student_name: "Sofia",
    // ... TypeScript validates this!
  },
});

const data = await response.json(); // Typed response!
```

### 4. **Avoid Unnecessary Abstractions**

We don't use:

- ❌ Separate controller files
- ❌ Service layers for simple CRUD
- ❌ Complex middleware chains

We keep it simple:

- ✅ Routes defined directly
- ✅ Business logic inline (or extracted to utils if reused)
- ✅ Minimal middleware (only CORS)

### 5. **Path Parameter Type Safety**

```typescript
// ✅ Type-safe path params
app.get("/call/:call_id", async (c) => {
  const callId = c.req.param("call_id"); // Fully typed!
  return c.json({ callId });
});
```

TypeScript knows:

- `call_id` exists in the path
- Its type is `string`
- Autocomplete works!

### 6. **Consistent Error Handling**

All endpoints follow the same error pattern:

```typescript
app.post("/analyze", async (c) => {
  try {
    // Happy path
    const result = await analyzePattern();
    return c.json(result);
  } catch (error) {
    console.error("Error:", error);
    return c.json(
      {
        error: "Failed to analyze",
        details: error instanceof Error ? error.message : "Unknown",
      },
      500,
    );
  }
});
```

## 🔧 When to Use `createFactory()`

If you **must** create reusable handlers (like Rails controllers), use `createFactory()`:

```typescript
import { createFactory } from "hono/factory";

const factory = createFactory();

// Reusable handler with proper typing
const analyzeHandler = factory.createHandlers(async (c) => {
  const id = c.req.param("id"); // Now this works!
  return c.json({ id });
});

app.get("/analyze/:id", ...analyzeHandler);
```

**We don't use this** because our handlers aren't reused across routes.

## 📊 Comparison: Before vs After

### Before (Not Following Best Practices)

```typescript
// ❌ controllers/reasoning.ts
export class ReasoningController {
  async analyze(c: Context) {
    const id = c.req.param("id"); // Type error!
    return c.json("result");
  }
}

// ❌ routes/reasoning.ts
import { ReasoningController } from "../controllers/reasoning";
const controller = new ReasoningController();
app.post("/analyze/:id", controller.analyze);
```

**Problems:**

- No type inference
- Verbose boilerplate
- Harder to test
- Not idiomatic Hono

### After (Following Best Practices)

```typescript
// ✅ routes/reasoning.ts
const app = new Hono();

app.post("/analyze/:id", async (c) => {
  const id = c.req.param("id"); // Fully typed!
  const body = await c.req.json(); // Fully typed!
  return c.json({ id, body });
});

export default app;
export type ReasoningAppType = typeof app;
```

**Benefits:**

- ✅ Full type inference
- ✅ Minimal code
- ✅ Easy to test
- ✅ Idiomatic Hono
- ✅ RPC-ready

## 🧪 Testing

Each sub-app can be tested independently:

```typescript
import { describe, it, expect } from "vitest";
import reasoningApp from "../src/routes/reasoning";

describe("Reasoning Agent", () => {
  it("should analyze attendance", async () => {
    const req = new Request("http://localhost/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "test",
        student_name: "Test",
        today_attendance: [],
        history_7d: [],
      }),
    });

    const res = await reasoningApp.fetch(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("analysis");
  });
});
```

## 📚 References

- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono RPC](https://hono.dev/docs/guides/rpc)
- [Hono Factory](https://hono.dev/docs/helpers/factory)

## 🎯 Summary

This architecture provides:

- ✅ **Type Safety** - Full TypeScript inference
- ✅ **Scalability** - Easy to add new sub-apps
- ✅ **Testability** - Each sub-app is independent
- ✅ **RPC Support** - Type-safe client generation
- ✅ **Simplicity** - Minimal abstractions
- ✅ **Performance** - No unnecessary overhead

Following these best practices makes the codebase:

1. Easier to understand for new developers
2. Safer (TypeScript catches errors)
3. Faster to develop (autocomplete works)
4. More maintainable (clear structure)
