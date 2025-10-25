import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { legalGuardians } from "../db/schema";
import type { Bindings } from "../types";

const guardians = new Hono<{ Bindings: Bindings }>();

// POST /api/guardians - Create guardian
guardians.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      phone: string;
      email?: string;
      preferred_language?: string;
      relation?: string;
      address?: string;
    }>();
    const db = drizzle(c.env.DB);

    if (!body.name || !body.phone) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const id = crypto.randomUUID();

    await db.insert(legalGuardians).values({
      id,
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      preferredLanguage: body.preferred_language ?? "es",
      relation: body.relation ?? null,
      address: body.address ?? null,
    });

    return c.json(
      { id, ...body, preferred_language: body.preferred_language ?? "es" },
      201,
    );
  } catch (error) {
    console.error("Error creating guardian:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/guardians - List guardians
guardians.get("/", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const guardiansList = await db
      .select()
      .from(legalGuardians)
      .orderBy(desc(legalGuardians.createdAt));

    return c.json({ guardians: guardiansList });
  } catch (error) {
    console.error("Error fetching guardians:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/guardians/:id - Get guardian by id
guardians.get("/:id", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const rows = await db
      .select()
      .from(legalGuardians)
      .where(eq(legalGuardians.id, id))
      .limit(1);
    if (!rows.length) return c.json({ error: "Guardian not found" }, 404);

    return c.json(rows[0]);
  } catch (error) {
    console.error("Error fetching guardian:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default guardians;
