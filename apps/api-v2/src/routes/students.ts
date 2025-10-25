import { eq, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
  students as studentsTable,
  studentFaces as studentFacesTable,
  legalGuardians as legalGuardiansTable,
  grades as gradesTable,
} from "../db/schema";
import type { NewStudent, NewLegalGuardian } from "../db/schema";
import type {
  Bindings,
  EnrollStudentRequest,
  EnrollStudentResponse,
  GetStudentsResponse,
  Student,
  LegalGuardian,
} from "../types";
import {
  createRekognition,
  indexFaceBytes,
  deleteFaces as awsDeleteFaces,
} from "../utils/aws";
import { normalizeRut } from "../utils/rut";
import { uploadPhoto, base64ToArrayBuffer, generatePresignedUrls, fetchFromRemoteR2, deleteFromRemoteR2, uploadToRemoteR2 } from "../utils/storage";

const students = new Hono<{ Bindings: Bindings }>();

type GuardianInsertFields = Pick<
  NewLegalGuardian,
  | "firstName"
  | "middleName"
  | "lastName"
  | "secondLastName"
  | "identificationNumber"
  | "phone"
  | "email"
  | "preferredLanguage"
  | "relation"
  | "address"
>;

const toNullable = (value?: string | null) => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function convertKeysToPresignedUrls(
  keys: (string | null)[],
  env: Bindings
): Promise<string[]> {
  const validKeys = keys.filter((k): k is string => Boolean(k));
  if (validKeys.length === 0) {
    console.log("[PRESIGNED-URLS] No keys to convert");
    return [];
  }

  console.log(`[PRESIGNED-URLS] Converting ${String(validKeys.length)} storage key(s) to presigned URLs`);
  
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  
  // If R2 credentials are not configured, return the keys as-is
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn("[PRESIGNED-URLS] ⚠️  R2 credentials not configured, returning storage keys instead of presigned URLs");
    return validKeys;
  }

  try {
    const urls = await generatePresignedUrls(validKeys, {
      accountId: R2_ACCOUNT_ID,
      bucketName: R2_BUCKET_NAME,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      expiresIn: 60 * 60, // 1 hour
    });
    console.log(`[PRESIGNED-URLS] ✓ Generated ${String(urls.length)} presigned URL(s)`);
    return urls;
  } catch (error: unknown) {
    console.error("[PRESIGNED-URLS] ❌ Failed to generate presigned URLs:", error);
    return validKeys; // Fallback to returning keys
  }
}

// POST /api/students - Enroll new student
students.post("/", async (c) => {
  try {
    const body = await c.req.json<EnrollStudentRequest>();
    const db = drizzle(c.env.DB);

    const { student: studentPayload, guardian: guardianPayload } = body;

    const studentFirstName = studentPayload.firstName.trim();
    const studentLastName = studentPayload.lastName.trim();
    const studentIdentification = normalizeRut(
      studentPayload.identificationNumber.trim(),
    );
    const studentMiddleName = toNullable(studentPayload.middleName ?? null);
    const studentSecondLastName = toNullable(
      studentPayload.secondLastName ?? null,
    );
    const studentGradeId = toNullable(studentPayload.gradeId ?? null);

    if (
      studentFirstName.length === 0 ||
      studentLastName.length === 0 ||
      studentIdentification.length === 0
    ) {
      return c.json(
        {
          error:
            "Student firstName, lastName, and identificationNumber are required",
        },
        400,
      );
    }

    const base64Count = body.photos?.length ?? 0;
    const keyCount = body.photo_keys?.length ?? 0;
    const totalPhotos = base64Count + keyCount;
    
    console.log(`[ENROLLMENT] Photo validation - base64: ${String(base64Count)}, presigned keys: ${String(keyCount)}, total: ${String(totalPhotos)}`);
    
    if (totalPhotos === 0)
      return c.json({ error: "At least one photo is required" }, 400);
    if (totalPhotos > 3)
      return c.json({ error: "Maximum 3 photos allowed" }, 400);

    // Resolve guardian
    let guardianRecord: LegalGuardian | null = null;

    if ("id" in guardianPayload && guardianPayload.id) {
      const guardianRows = await db
        .select()
        .from(legalGuardiansTable)
        .where(eq(legalGuardiansTable.id, guardianPayload.id))
        .limit(1);
      if (!guardianRows.length) {
        return c.json({ error: "Guardian not found" }, 404);
      }
      guardianRecord = guardianRows[0];
    } else {
      const guardianDetails = guardianPayload as GuardianInsertFields;
      const guardianFirstName = guardianDetails.firstName.trim();
      const guardianLastName = guardianDetails.lastName.trim();
      const guardianIdentification = normalizeRut(
        guardianDetails.identificationNumber.trim(),
      );
      const guardianPhone = guardianDetails.phone.trim();
      const guardianMiddleName = toNullable(guardianDetails.middleName ?? null);
      const guardianSecondLastName = toNullable(
        guardianDetails.secondLastName ?? null,
      );
      const guardianEmail = guardianDetails.email.trim();
      const guardianPreferredLanguage =
        toNullable(guardianDetails.preferredLanguage ?? null) ?? "es";
      const guardianRelation = toNullable(guardianDetails.relation ?? null);
      const guardianAddress = toNullable(guardianDetails.address ?? null);

      if (
        guardianFirstName.length === 0 ||
        guardianLastName.length === 0 ||
        guardianIdentification.length === 0 ||
        guardianPhone.length === 0 ||
        guardianEmail.length === 0
      ) {
        return c.json(
          {
            error:
              "Guardian firstName, lastName, identificationNumber, phone, and email are required",
          },
          400,
        );
      }

      const guardianId = crypto.randomUUID();

      const newGuardianValues: NewLegalGuardian = {
        id: guardianId,
        firstName: guardianFirstName,
        middleName: guardianMiddleName,
        lastName: guardianLastName,
        secondLastName: guardianSecondLastName,
        identificationNumber: guardianIdentification,
        phone: guardianPhone,
        email: guardianEmail,
        preferredLanguage: guardianPreferredLanguage,
        relation: guardianRelation,
        address: guardianAddress,
      };

      await db.insert(legalGuardiansTable).values(newGuardianValues);

      const insertedGuardianRows = await db
        .select()
        .from(legalGuardiansTable)
        .where(eq(legalGuardiansTable.id, guardianId))
        .limit(1);

      if (insertedGuardianRows.length === 0) {
        return c.json({ error: "Unable to resolve guardian" }, 500);
      }

      guardianRecord = insertedGuardianRows[0];
    }

    // Create student
    const studentId = crypto.randomUUID();
    const enrollmentDate = new Date().toISOString();
    const studentValues: NewStudent = {
      id: studentId,
      firstName: studentFirstName,
      middleName: studentMiddleName,
      lastName: studentLastName,
      secondLastName: studentSecondLastName,
      identificationNumber: studentIdentification,
      gradeId: studentGradeId,
      guardianId: guardianRecord.id,
      enrollmentDate,
      status: "active",
    };

    await db.insert(studentsTable).values(studentValues);
    console.log(`[ENROLLMENT] Student created - ID: ${studentId}, Name: ${studentFirstName} ${studentLastName}`);

    // Require Rekognition configuration for enrollment
    const faceIds: string[] = [];
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    
    console.log(`[ENROLLMENT] AWS Rekognition config - Collection: ${collectionId}, Region: ${AWS_REGION ?? 'N/A'}`);
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      console.error(`[ENROLLMENT] Missing AWS credentials - cannot proceed with face indexing`);
      return c.json(
        {
          error:
            "AWS Rekognition credentials are required for enrollment.",
        },
        500,
      );
    }
    const rek = createRekognition({
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
      AWS_REKOGNITION_COLLECTION: collectionId,
    });
    console.log(`[ENROLLMENT] Starting photo processing for student ${studentId}`);

    const saveFace = async (
      index: number,
      bytes: Uint8Array,
      sourceKey?: string,
      r2Config?: {
        accountId: string;
        bucketName: string;
        accessKeyId: string;
        secretAccessKey: string;
      }
    ) => {
      const destKey = `students/${studentId}/photo-${String(index + 1)}.jpg`;
      const photoNumber = index + 1;
      
      console.log(`[PHOTO ${String(photoNumber)}] Starting processing - Size: ${String(bytes.length)} bytes, Dest: ${destKey}${sourceKey ? `, Source: ${sourceKey}` : ''}`);
      
      try {
        // Step 1: Upload to R2
        console.log(`[PHOTO ${String(photoNumber)}] Uploading to R2...`);
        
        // Use remote R2 if config provided (presigned uploads), otherwise use local binding (base64)
        if (r2Config) {
          await uploadToRemoteR2(destKey, bytes.buffer as ArrayBuffer, r2Config);
          console.log(`[PHOTO ${String(photoNumber)}] ✓ Uploaded to remote R2 successfully`);
        } else {
          await uploadPhoto(c.env.PHOTOS, destKey, bytes.buffer as ArrayBuffer);
          console.log(`[PHOTO ${String(photoNumber)}] ✓ Uploaded to local R2 successfully`);
        }
        
        // Note: Temp file cleanup (if sourceKey exists) is handled by the caller
        // for presigned uploads using deleteFromRemoteR2()

        // Step 2: Index face with AWS Rekognition
        console.log(`[PHOTO ${String(photoNumber)}] Indexing face with AWS Rekognition...`);
        const result = await indexFaceBytes({
          client: rek,
          collectionId,
          bytes,
          externalImageId: `student_${studentId}_photo_${String(photoNumber)}`,
        });
        const qualityScoreStr = result.qualityScore !== undefined ? String(result.qualityScore) : 'N/A';
        console.log(`[PHOTO ${String(photoNumber)}] ✓ Face indexed - FaceID: ${result.faceId}, Quality: ${qualityScoreStr}`);

        // Step 3: Save to database
        console.log(`[PHOTO ${String(photoNumber)}] Saving face record to database...`);
        await db.insert(studentFacesTable).values({
          id: crypto.randomUUID(),
          studentId,
          faceId: result.faceId,
          photoUrl: destKey,
          indexedAt: new Date().toISOString(),
          qualityScore:
            typeof result.qualityScore === "number"
              ? result.qualityScore
              : null,
        });
        console.log(`[PHOTO ${String(photoNumber)}] ✓ Database record saved`);

        faceIds.push(result.faceId);
        console.log(`[PHOTO ${String(photoNumber)}] ✅ Complete - Successfully processed`);
      } catch (error: unknown) {
        console.error(`[PHOTO ${String(photoNumber)}] ❌ ERROR:`, error);
        if (error instanceof Error) {
          console.error(`[PHOTO ${String(photoNumber)}] Error details - Message: ${error.message}, Stack: ${error.stack ?? 'N/A'}`);
        }
      }
    };

    // Base64 photos
    if (base64Count > 0) {
      console.log(`[ENROLLMENT] Processing ${String(base64Count)} base64 photo(s)...`);
      for (let i = 0; i < (body.photos?.length ?? 0); i++) {
        const photo = body.photos?.[i];
        if (!photo) continue;
        const bytes = new Uint8Array(base64ToArrayBuffer(photo.data));
        await saveFace(i, bytes);
      }
    }

    // Presigned keys
    if (keyCount > 0) {
      console.log(`[ENROLLMENT] Processing ${String(keyCount)} presigned photo key(s)...`);
      
      const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = c.env;
      
      if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        console.error('[ENROLLMENT] R2 credentials missing - cannot fetch presigned uploads');
        return c.json({ error: "R2 configuration missing for presigned uploads" }, 500);
      }
      
      const r2Config = {
        accountId: R2_ACCOUNT_ID,
        bucketName: R2_BUCKET_NAME,
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      };
      
      for (let i = 0; i < (body.photo_keys?.length ?? 0); i++) {
        const key = body.photo_keys?.[i];
        if (!key) continue;
        
        console.log(`[PRESIGNED ${String(i + 1)}] Fetching from remote R2: ${key}`);
        const bytes = await fetchFromRemoteR2(key, r2Config);
        
        if (!bytes) {
          console.warn(`[PRESIGNED ${String(i + 1)}] ⚠️  Key not found in remote R2: ${key}`);
          continue;
        }
        console.log(`[PRESIGNED ${String(i + 1)}] ✓ Retrieved from remote R2 - Size: ${String(bytes.length)} bytes`);
        
        await saveFace(
          (body.photos?.length ?? 0) + i,
          bytes,
          key,
          r2Config, // Pass config to use remote R2 storage
        );
        
        // Clean up temp file from remote R2
        console.log(`[PRESIGNED ${String(i + 1)}] Deleting temp file from remote R2`);
        await deleteFromRemoteR2(key, r2Config);
      }
    }

    console.log(`[ENROLLMENT] Photo processing complete - Success: ${String(faceIds.length)}/${String(totalPhotos)}`);
    
    const response: EnrollStudentResponse = {
      student_id: studentId,
      status: "enrolled",
      photos_stored: faceIds.length,
      aws_faces_indexed: faceIds.length,
      face_ids: faceIds,
    };

    console.log(`[ENROLLMENT] ✅ Student enrolled successfully - ID: ${studentId}, Photos: ${String(faceIds.length)}, FaceIDs: ${faceIds.join(', ')}`);
    
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
      .select({
        student: studentsTable,
        guardian: legalGuardiansTable,
        grade: gradesTable,
      })
      .from(studentsTable)
      .leftJoin(
        legalGuardiansTable,
        eq(studentsTable.guardianId, legalGuardiansTable.id),
      )
      .leftJoin(gradesTable, eq(studentsTable.gradeId, gradesTable.id))
      .where(eq(studentsTable.status, "active"))
      .orderBy(desc(studentsTable.createdAt))
      .limit(perPage)
      .offset(offset);

    const studentsWithPhotos = await Promise.all(
      studentsList.map(async ({ student, guardian, grade }) => {
        const faces = await db
          .select({ photoUrl: studentFacesTable.photoUrl })
          .from(studentFacesTable)
          .where(eq(studentFacesTable.studentId, student.id))
          .orderBy(studentFacesTable.createdAt);

        const photoKeys = faces.map((f) => f.photoUrl);
        const photoUrls = await convertKeysToPresignedUrls(photoKeys, c.env);

        return {
          ...student,
          photo_urls: photoUrls,
          guardian: guardian ?? null,
          gradeDisplayName: grade?.displayName ?? null,
        } satisfies Student & {
          photo_urls: string[];
          guardian: LegalGuardian | null;
          gradeDisplayName: string | null;
        };
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

    const rows = await db
      .select({
        student: studentsTable,
        guardian: legalGuardiansTable,
        grade: gradesTable,
      })
      .from(studentsTable)
      .leftJoin(
        legalGuardiansTable,
        eq(studentsTable.guardianId, legalGuardiansTable.id),
      )
      .leftJoin(gradesTable, eq(studentsTable.gradeId, gradesTable.id))
      .where(eq(studentsTable.id, studentId))
      .limit(1);
    if (!rows.length) return c.json({ error: "Student not found" }, 404);

    const { student, guardian, grade } = rows[0];

    const faces = await db
      .select({
        faceId: studentFacesTable.faceId,
        photoUrl: studentFacesTable.photoUrl,
      })
      .from(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId))
      .orderBy(studentFacesTable.createdAt);

    const photoKeys = faces.map((f) => f.photoUrl);
    const photoUrls = await convertKeysToPresignedUrls(photoKeys, c.env);

    return c.json({
      ...student,
      face_ids: faces.map((f) => f.faceId),
      photo_urls: photoUrls,
      guardian: guardian ?? null,
      gradeDisplayName: grade?.displayName ?? null,
    } satisfies Student & {
      face_ids: string[];
      photo_urls: string[];
      guardian: LegalGuardian | null;
      gradeDisplayName: string | null;
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
