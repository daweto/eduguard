import { RekognitionClient, ListFacesCommand } from "@aws-sdk/client-rekognition";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { studentFaces } from "../db/schema";
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

// POST /api/seed/sync-faces - Sync face IDs from AWS Rekognition
// This updates the database with actual AWS face IDs based on externalImageId
seedRouter.post("/sync-faces", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const collectionId = c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";

    // Check AWS credentials
    if (!c.env.AWS_ACCESS_KEY_ID || !c.env.AWS_SECRET_ACCESS_KEY) {
      return c.json({ error: "AWS credentials not configured" }, 500);
    }

    // Initialize Rekognition client
    const rekognition = new RekognitionClient({
      region: c.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: c.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // List all faces from AWS Rekognition
    console.log("[SYNC] Fetching faces from AWS Rekognition...");
    const listCommand = new ListFacesCommand({
      CollectionId: collectionId,
      MaxResults: 1000,
    });
    const listResult = await rekognition.send(listCommand);
    const awsFaces = listResult.Faces ?? [];

    console.log(`[SYNC] Found ${awsFaces.length} faces in AWS Rekognition`);

    // Create map of externalImageId -> faceId
    const faceMap = new Map<string, string>();
    for (const face of awsFaces) {
      if (face.ExternalImageId && face.FaceId) {
        faceMap.set(face.ExternalImageId, face.FaceId);
      }
    }

    // Get all student faces from database that have externalImageId
    const dbFaces = await db
      .select()
      .from(studentFaces)
      .where(eq(studentFaces.faceId, "placeholder"))
      .all();

    console.log(`[SYNC] Found ${dbFaces.length} faces to sync in database`);

    // Update each face with the correct faceId from AWS
    let syncedCount = 0;
    let notFoundCount = 0;

    for (const dbFace of dbFaces) {
      if (dbFace.externalImageId) {
        const awsFaceId = faceMap.get(dbFace.externalImageId);
        
        if (awsFaceId) {
          await db
            .update(studentFaces)
            .set({ faceId: awsFaceId })
            .where(eq(studentFaces.id, dbFace.id));
          
          console.log(`[SYNC] ✓ Updated ${dbFace.externalImageId} -> ${awsFaceId}`);
          syncedCount++;
        } else {
          console.log(`[SYNC] ✗ No AWS face found for ${dbFace.externalImageId}`);
          notFoundCount++;
        }
      }
    }

    return c.json({
      success: true,
      message: "Face IDs synced from AWS Rekognition",
      synced: syncedCount,
      notFound: notFoundCount,
      totalAwsFaces: awsFaces.length,
    });
  } catch (error) {
    console.error("[SYNC] Error syncing faces:", error);
    return c.json(
      {
        error: "Failed to sync face IDs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default seedRouter;
