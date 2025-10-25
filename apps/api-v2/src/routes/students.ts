import type { RekognitionClient } from "@aws-sdk/client-rekognition";
import { eq, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
  students as studentsTable,
  studentFaces as studentFacesTable,
  legalGuardians as legalGuardiansTable,
} from "../db/schema";
import type {
  Bindings,
  EnrollStudentRequest,
  EnrollStudentResponse,
  GetStudentsResponse,
  Student,
} from "../types";
import {
  createRekognition,
  indexFaceBytes,
  deleteFaces as awsDeleteFaces,
} from "../utils/aws";
import { uploadPhoto, base64ToArrayBuffer } from "../utils/storage";

const students = new Hono<{ Bindings: Bindings }>();

// POST /api/students - Enroll new student
students.post("/", async (c) => {
  try {
    const body = await c.req.json<EnrollStudentRequest>();
    const db = drizzle(c.env.DB);

    if (!body.name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const base64Count = body.photos?.length ?? 0;
    const keyCount = body.photo_keys?.length ?? 0;
    const totalPhotos = base64Count + keyCount;
    if (totalPhotos === 0)
      return c.json({ error: "At least one photo is required" }, 400);
    if (totalPhotos > 3)
      return c.json({ error: "Maximum 3 photos allowed" }, 400);

    // Resolve guardian
    let guardianId: string | null = body.guardian_id ?? null;
    let guardianFromId: {
      name: string;
      phone: string;
      email: string | null;
    } | null = null;
    if (guardianId) {
      const rows = await db
        .select()
        .from(legalGuardiansTable)
        .where(eq(legalGuardiansTable.id, guardianId))
        .limit(1);
      if (rows.length) {
        guardianFromId = {
          name: rows[0].name,
          phone: rows[0].phone,
          email: rows[0].email ?? null,
        };
      }
    } else {
      if (!body.guardian_name || !body.guardian_phone)
        return c.json({ error: "Guardian is required" }, 400);
      guardianId = crypto.randomUUID();
      await db.insert(legalGuardiansTable).values({
        id: guardianId,
        name: body.guardian_name,
        phone: body.guardian_phone,
        email: body.guardian_email ?? null,
        preferredLanguage: "es",
      });
      guardianFromId = {
        name: body.guardian_name,
        phone: body.guardian_phone,
        email: body.guardian_email ?? null,
      };
    }

    // Create student
    const studentId = crypto.randomUUID();
    const enrollmentDate = new Date().toISOString();
    await db.insert(studentsTable).values({
      id: studentId,
      name: body.name,
      gradeId: body.grade ?? null,
      guardianId,
      guardianName: guardianFromId?.name ?? body.guardian_name,
      guardianPhone: guardianFromId?.phone ?? body.guardian_phone,
      guardianEmail: guardianFromId?.email ?? body.guardian_email ?? null,
      enrollmentDate,
      status: "active",
    });

    // Prepare Rekognition (optional)
    const faceIds: string[] = [];
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    let rek: RekognitionClient | null = null;
    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION) {
      rek = createRekognition({
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_REGION,
        AWS_REKOGNITION_COLLECTION: collectionId,
      });
    }

    const saveFace = async (
      index: number,
      bytes: Uint8Array,
      sourceKey?: string,
    ) => {
      const destKey = `students/${studentId}/photo-${String(index + 1)}.jpg`;
      try {
        await uploadPhoto(c.env.PHOTOS, destKey, bytes.buffer as ArrayBuffer);
        if (sourceKey && sourceKey !== destKey) {
          await c.env.PHOTOS.delete(sourceKey).catch(() => {});
        }

        let faceId = `mock-face-${crypto.randomUUID()}`;
        let qualityScore: number | undefined;
        if (rek) {
          try {
            const result = await indexFaceBytes({
              client: rek,
              collectionId,
              bytes,
              externalImageId: `student_${studentId}_photo_${String(index + 1)}`,
            });
            faceId = result.faceId;
            qualityScore =
              typeof result.qualityScore === "number"
                ? result.qualityScore
                : undefined;
          } catch (e: unknown) {
            console.warn(
              "AWS Rekognition indexing failed; storing mock face ID",
              e,
            );
          }
        }

        await db.insert(studentFacesTable).values({
          id: crypto.randomUUID(),
          studentId,
          faceId,
          photoUrl: destKey,
          indexedAt: new Date().toISOString(),
          qualityScore: qualityScore ?? 0.95,
        });

        faceIds.push(faceId);
      } catch (error: unknown) {
        console.error(`Error processing photo ${String(index + 1)}:`, error);
      }
    };

    // Base64 photos
    for (let i = 0; i < (body.photos?.length ?? 0); i++) {
      const photo = body.photos?.[i];
      if (!photo) continue;
      const bytes = new Uint8Array(base64ToArrayBuffer(photo.data));
      await saveFace(i, bytes);
    }

    // Presigned keys
    for (let i = 0; i < (body.photo_keys?.length ?? 0); i++) {
      const key = body.photo_keys?.[i];
      if (!key) continue;
      const obj = await c.env.PHOTOS.get(key);
      if (!obj) {
        console.warn("Uploaded key not found in R2", key);
        continue;
      }
      const arrayBuffer = await obj.bytes();
      await saveFace(
        (body.photos?.length ?? 0) + i,
        new Uint8Array(arrayBuffer),
        key,
      );
    }

    const response: EnrollStudentResponse = {
      student_id: studentId,
      status: "enrolled",
      photos_stored: faceIds.length,
      aws_faces_indexed: faceIds.length,
      face_ids: faceIds,
    };

    return c.json(response, 201);
  } catch (error) {
    console.error("Error enrolling student:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/students - List all students
students.get("/", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const page = parseInt(c.req.query("page") ?? "1");
    const perPage = parseInt(c.req.query("per_page") ?? "50");
    const offset = (page - 1) * perPage;

    const countResult = await db
      .select({ count: count() })
      .from(studentsTable)
      .where(eq(studentsTable.status, "active"));
    const total = countResult[0]?.count ?? 0;

    const studentsList = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.status, "active"))
      .orderBy(desc(studentsTable.createdAt))
      .limit(perPage)
      .offset(offset);

    const studentsWithPhotos: (Student & { photo_urls: string[] })[] =
      await Promise.all(
        studentsList.map(async (student) => {
          const faces = await db
            .select({ photoUrl: studentFacesTable.photoUrl })
            .from(studentFacesTable)
            .where(eq(studentFacesTable.studentId, student.id))
            .orderBy(studentFacesTable.createdAt);
          const photoUrls = faces.map((f) => f.photoUrl ?? "");
          return { ...(student as Student), photo_urls: photoUrls };
        }),
      );

    const response: GetStudentsResponse = {
      students: studentsWithPhotos,
      total,
      page,
      per_page: perPage,
    };
    return c.json(response);
  } catch (error) {
    console.error("Error fetching students:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/students/:id - Get single student
students.get("/:id", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const studentId = c.req.param("id");

    const student = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .limit(1);
    if (student.length === 0)
      return c.json({ error: "Student not found" }, 404);

    const faces = await db
      .select({
        faceId: studentFacesTable.faceId,
        photoUrl: studentFacesTable.photoUrl,
      })
      .from(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId))
      .orderBy(studentFacesTable.createdAt);

    return c.json({
      ...student[0],
      face_ids: faces.map((f) => f.faceId),
      photo_urls: faces.map((f) => f.photoUrl ?? ""),
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/students/:id - Delete student
students.delete("/:id", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const studentId = c.req.param("id");

    const faces = await db
      .select({
        photoUrl: studentFacesTable.photoUrl,
        faceId: studentFacesTable.faceId,
      })
      .from(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId));

    for (const face of faces) {
      if (face.photoUrl) await c.env.PHOTOS.delete(face.photoUrl);
    }

    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION) {
      try {
        const rek = createRekognition({
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
          AWS_REKOGNITION_COLLECTION: collectionId,
        });
        const toDelete = faces
          .map((f) => f.faceId)
          .filter((id): id is string => Boolean(id));
        if (toDelete.length) {
          await awsDeleteFaces({
            client: rek,
            collectionId,
            faceIds: toDelete,
          });
        }
      } catch (e: unknown) {
        console.warn("Failed to delete faces from AWS Rekognition", e);
      }
    }

    await db
      .delete(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId));
    await db.delete(studentsTable).where(eq(studentsTable.id, studentId));

    return c.json({
      deleted: true,
      student_id: studentId,
      faces_removed: faces.length,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default students;
