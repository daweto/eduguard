import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { legalGuardians } from "../db/schema";
import type { Bindings, CreateGuardianRequest } from "../types";

const guardians = new Hono<{ Bindings: Bindings }>();

// POST /api/guardians - Create guardian
guardians.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateGuardianRequest>();
    const db = drizzle(c.env.DB);

    if (
      !body.firstName.trim() ||
      !body.lastName.trim() ||
      !body.identificationNumber.trim() ||
      !body.phone.trim() ||
      !body.email.trim()
    ) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const id = crypto.randomUUID();

    await db.insert(legalGuardians).values({
      id,
      firstName: body.firstName.trim(),
      middleName: body.middleName?.trim() ?? null,
      lastName: body.lastName.trim(),
      secondLastName: body.secondLastName?.trim() ?? null,
      identificationNumber: body.identificationNumber.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      preferredLanguage: body.preferredLanguage ?? "es",
      relation: body.relation ?? null,
      address: body.address ?? null,
    });

    const [inserted] = await db
      .select()
      .from(legalGuardians)
      .where(eq(legalGuardians.id, id))
      .limit(1);

    return c.json(inserted, 201);
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
