import { Hono } from "hono";
import { seedDatabase } from "../db/seed";
import type { Bindings } from "../types";

const seedRouter = new Hono<{ Bindings: Bindings }>();

// POST /api/seed - Seed the database with reference data (grades/stages)
seedRouter.post("/", async (c) => {
  try {
    // Only allow seeding in development or with explicit permission
    // You can add authentication here if needed for production
    const isProduction = c.env.ENVIRONMENT === "production";

    if (isProduction) {
      return c.json(
        {
          error:
            "Seeding is disabled in production. Use seed endpoint with authentication.",
        },
        403,
      );
    }

    // Run the seed function
    await seedDatabase(c.env.DB);

    return c.json({
      success: true,
      message:
        "Database seeded successfully with Chilean school grades and stages",
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return c.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// GET /api/seed/status - Check if database has been seeded
seedRouter.get("/status", async (c) => {
  try {
    const { drizzle } = await import("drizzle-orm/d1");
    const { stages, grades } = await import("../db/schema");

    const db = drizzle(c.env.DB);

    const stagesCount = await db.select().from(stages).all();
    const gradesCount = await db.select().from(grades).all();

    return c.json({
      seeded: stagesCount.length > 0 && gradesCount.length > 0,
      counts: {
        stages: stagesCount.length,
        grades: gradesCount.length,
      },
      expected: {
        stages: 3,
        grades: 14,
      },
    });
  } catch (error) {
    console.error("Error checking seed status:", error);
    return c.json(
      {
        error: "Failed to check seed status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default seedRouter;
