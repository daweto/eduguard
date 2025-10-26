import {
  RekognitionClient,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  IndexFacesCommand,
  DeleteFacesCommand,
  SearchFacesCommand,
} from "@aws-sdk/client-rekognition";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
  students as studentsTable,
  studentFaces as studentFacesTable,
  classes as classesTable,
  classEnrollments as enrollmentsTable,
  sessions as sessionsTable,
  attendance as attendanceTable,
  teachers as teachersTable,
  classrooms as classroomsTable,
} from "../db/schema";
import type { Bindings } from "../types";
import { 
  base64ToArrayBuffer, 
  fetchFromRemoteR2, 
  uploadToRemoteR2, 
  deleteFromRemoteR2,
  generatePresignedUrls
} from "../utils/storage";

const attendance = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/attendance/capture
 * Minimal MVP: accept base64 image, search faces in collection, map to students.
 */
/**
 * POST /api/attendance/session
 * Create attendance session for a class with 1-10 photos
 */
attendance.post("/session", async (c) => {
  try {
    const body = await c.req.json<{
      class_id: string;
      teacher_id: string;
      photos?: string[]; // Array of base64 images (legacy)
      photo_keys?: string[]; // Array of presigned upload keys (new)
      timestamp?: string;
      face_match_threshold?: number;
      max_faces?: number;
    }>();

    if (!body?.class_id || !body?.teacher_id) {
      return c.json(
        { error: "class_id and teacher_id are required" },
        400,
      );
    }

    // Must have either photos or photo_keys
    if (
      (!body.photos || body.photos.length === 0) &&
      (!body.photo_keys || body.photo_keys.length === 0)
    ) {
      return c.json(
        { error: "Either photos or photo_keys array is required" },
        400,
      );
    }

    const photoCount = body.photo_keys?.length || body.photos?.length || 0;
    if (photoCount > 10) {
      return c.json({ error: "Maximum 10 photos allowed per session" }, 400);
    }

    const db = drizzle(c.env.DB);

    // Get class details and enrolled students
    const classDetails = await db
      .select({
        classId: classesTable.id,
        classroomId: classesTable.classroomId,
        teacherId: classesTable.teacherId,
      })
      .from(classesTable)
      .where(eq(classesTable.id, body.class_id))
      .limit(1);

    if (classDetails.length === 0) {
      return c.json({ error: "Class not found" }, 404);
    }

    // Get enrolled students for this class
    const enrolledStudents = await db
      .select({
        studentId: studentsTable.id,
        firstName: studentsTable.firstName,
        middleName: studentsTable.middleName,
        lastName: studentsTable.lastName,
        secondLastName: studentsTable.secondLastName,
        identificationNumber: studentsTable.identificationNumber,
      })
      .from(enrollmentsTable)
      .innerJoin(
        studentsTable,
        eq(enrollmentsTable.studentId, studentsTable.id),
      )
      .where(
        and(
          eq(enrollmentsTable.classId, body.class_id),
          eq(enrollmentsTable.status, "active"),
        ),
      );

    // Generate session ID first (needed for moving photos to final location)
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = body.timestamp || new Date().toISOString();

    // Handle photo_keys: move from temp to final location
    const finalPhotoKeys: string[] = [];
    let photoBytesArray: Uint8Array[] = [];

    if (body.photo_keys && body.photo_keys.length > 0) {
      const accountId = c.env.R2_ACCOUNT_ID;
      const bucket = c.env.R2_BUCKET_NAME;
      const accessKeyId = c.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = c.env.R2_SECRET_ACCESS_KEY;

      if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
        return c.json({ error: "R2 configuration not found" }, 500);
      }

      const r2Config = { accountId, bucketName: bucket, accessKeyId, secretAccessKey };
      const movedKeys: string[] = [];

      try {
        for (let i = 0; i < body.photo_keys.length; i++) {
          const key = body.photo_keys[i];

          // Security: validate key is from temp attendance location
          if (!key.startsWith("uploads/tmp/attendance/")) {
            throw new Error(`Invalid photo key: ${key}`);
          }

          // Fetch from temp location
          const bytes = await fetchFromRemoteR2(key, r2Config);
          if (!bytes) {
            throw new Error(`Photo not found: ${key}`);
          }

          // Store bytes for Rekognition processing
          photoBytesArray.push(bytes);

          // Move to final location
          const ext = key.split('.').pop() || 'jpg';
          const destKey = `attendance/${sessionId}/photo-${i + 1}.${ext}`;
          
          // Infer content type from extension
          const contentType = ext === 'png' ? 'image/png' : 
                              ext === 'webp' ? 'image/webp' : 
                              ext === 'heic' ? 'image/heic' : 'image/jpeg';

          // Convert Uint8Array to ArrayBuffer
          const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
          await uploadToRemoteR2(destKey, arrayBuffer, r2Config, contentType);
          movedKeys.push(destKey);
          finalPhotoKeys.push(destKey);

          // Delete temp file
          await deleteFromRemoteR2(key, r2Config);
        }
      } catch (error) {
        console.error("Error moving photos from temp to final:", error);
        
        // Rollback: delete any moved photos
        for (const key of movedKeys) {
          await deleteFromRemoteR2(key, r2Config).catch(() => {});
        }
        
        return c.json({ 
          error: error instanceof Error ? error.message : "Failed to process photos" 
        }, 500);
      }
    } else if (body.photos && body.photos.length > 0) {
      // Legacy: convert base64 photos to bytes
      photoBytesArray = body.photos.map(photo => new Uint8Array(base64ToArrayBuffer(photo)));
    }

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      return c.json(
        { error: "AWS Rekognition credentials not configured" },
        500,
      );
    }

    const rekognition = new RekognitionClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const FaceMatchThreshold = body.face_match_threshold ?? 95;
    const MaxFaces = body.max_faces ?? 50;
    
    // Check if debug mode is enabled
    const debugEnabled = c.env.ENABLE_ATTENDANCE_DEBUG === 'true' || c.env.ENABLE_ATTENDANCE_DEBUG === '1';

    // Process all photos and collect all detected students
    const allDetectedFaces = new Map<
      string,
      {
        studentId: string;
        confidence: number;
        faceId: string;
        student: (typeof enrolledStudents)[number];
        boundingBox?: any;
      }
    >();

    let totalFacesDetected = 0;
    const debugInfo: {
      photoIndex: number;
      totalFacesInPhoto: number;
      faces: {
        boundingBox: any;
        confidence: number;
        matchedStudent?: {
          id: string;
          name: string;
          similarity: number;
        };
        faceId?: string;
        topMatches?: {
          studentName: string;
          similarity: number;
          belowThreshold: boolean;
        }[];
        noMatchReason?: string;
      }[];
    }[] = [];
    
    // Only collect debug info if enabled
    const collectDebug = debugEnabled;

    for (let photoIdx = 0; photoIdx < photoBytesArray.length; photoIdx++) {
      const bytes = photoBytesArray[photoIdx];
      
      const photoDebug: typeof debugInfo[0] = {
        photoIndex: photoIdx,
        totalFacesInPhoto: 0,
        faces: [],
      };
      
      // Temporary faces indexed from this photo (for cleanup)
      const tempFaceIds: string[] = [];

      try {
        // Step 1: Index ALL faces from the attendance photo into the student collection
        // Uses temporary external ID so we can delete them later
        const tempExternalId = `temp_attendance_${sessionId}_photo${photoIdx}`;
        
        if (debugEnabled) {
          console.log(`[ATTENDANCE] Photo ${photoIdx + 1}: Indexing all faces with temp ID: ${tempExternalId}`);
        }
        
        const indexCommand = new IndexFacesCommand({
          CollectionId: collectionId,
          Image: { Bytes: bytes },
          ExternalImageId: tempExternalId,
          MaxFaces: 50,
          QualityFilter: "AUTO",
          DetectionAttributes: ["DEFAULT"],
        });

        const indexResult = await rekognition.send(indexCommand);
        const indexedFaces = indexResult.FaceRecords ?? [];
        
        totalFacesDetected += indexedFaces.length;
        photoDebug.totalFacesInPhoto = indexedFaces.length;
        
        // Store temp face IDs for cleanup
        tempFaceIds.push(...indexedFaces.map(f => f.Face?.FaceId).filter((id): id is string => Boolean(id)));
        
        if (debugEnabled) {
          console.log(`[ATTENDANCE] Photo ${photoIdx + 1}: Indexed ${indexedFaces.length} faces`);
        }

        // Step 2: Search EACH indexed face against the collection
        for (let faceIdx = 0; faceIdx < indexedFaces.length; faceIdx++) {
          const faceRecord = indexedFaces[faceIdx];
          const tempFaceId = faceRecord.Face?.FaceId;
          const boundingBox = faceRecord.Face?.BoundingBox;
          const faceConfidence = faceRecord.FaceDetail?.Confidence ?? 100;
          
          if (!tempFaceId) {
            console.warn(`[ATTENDANCE] Face ${faceIdx + 1} has no face ID, skipping`);
            continue;
          }
          
          let matchedStudent: typeof photoDebug.faces[0]['matchedStudent'];
          let matchedFaceId: string | undefined;
          let topMatches: typeof photoDebug.faces[0]['topMatches'] = [];
          let noMatchReason: string | undefined;
          
          try {
            if (debugEnabled) {
              console.log(`[ATTENDANCE] Searching face ${faceIdx + 1}/${indexedFaces.length} (ID: ${tempFaceId})`);
            }
            
            // Search this face against the collection
            const searchCommand = new SearchFacesCommand({
              CollectionId: collectionId,
              FaceId: tempFaceId,
              FaceMatchThreshold: 50, // Lower threshold to see all potential matches
              MaxFaces: 5,
            });

            const searchResult = await rekognition.send(searchCommand);
            const allMatches = searchResult.FaceMatches ?? [];
            
            // Filter out the temp face itself (it will match itself!)
            const realMatches = allMatches.filter(m => m.Face?.FaceId !== tempFaceId);
            
            if (debugEnabled) {
              console.log(`[ATTENDANCE] Face ${faceIdx + 1} matched ${realMatches.length} potential students (excluding self)`);
            }
            
            // Get student info for all matches
            const allFaceIds = realMatches
              .map((m) => m.Face?.FaceId)
              .filter((id): id is string => Boolean(id));

            let faceToStudent = new Map<string, string>();
            
            if (allFaceIds.length > 0) {
              const faceRecords = await db
                .select({
                  faceId: studentFacesTable.faceId,
                  studentId: studentFacesTable.studentId,
                })
                .from(studentFacesTable)
                .where(inArray(studentFacesTable.faceId, allFaceIds));

              faceToStudent = new Map(
                faceRecords.map((r) => [r.faceId, r.studentId]),
              );
            }
            
            // Process all matches for this face
            const faceMatches: {student: any; similarity: number; meetsThreshold: boolean; faceId: string}[] = [];
            
            for (const match of realMatches) {
              const fid = match.Face?.FaceId;
              const similarity = match.Similarity ?? 0;
              
              if (!fid) continue;
              
              const studentId = faceToStudent.get(fid);
              if (!studentId) continue;
              
              const student = enrolledStudents.find((s) => s.studentId === studentId);
              if (!student) continue;
              
              const meetsThreshold = similarity >= FaceMatchThreshold;
              
              faceMatches.push({
                student,
                similarity,
                meetsThreshold,
                faceId: fid,
              });
              
              // Add to global matches if meets threshold
              if (meetsThreshold) {
                const existing = allDetectedFaces.get(studentId);
                if (!existing || similarity > existing.confidence) {
                  allDetectedFaces.set(studentId, {
                    studentId,
                    confidence: similarity,
                    faceId: fid,
                    student,
                    boundingBox,
                  });
                }
              }
            }
            
            // Sort matches by similarity and take top 3 for debug
            faceMatches.sort((a, b) => b.similarity - a.similarity);
            const bestMatch = faceMatches[0];
            
            if (bestMatch?.meetsThreshold) {
              matchedStudent = {
                id: bestMatch.student.id,
                name: `${bestMatch.student.firstName} ${bestMatch.student.lastName}`,
                similarity: bestMatch.similarity,
              };
              matchedFaceId = bestMatch.faceId;
            }
            
            // Only collect detailed debug info if enabled
            if (collectDebug) {
              topMatches = faceMatches.slice(0, 3).map(m => ({
                studentName: `${m.student.firstName} ${m.student.lastName}`,
                similarity: m.similarity,
                belowThreshold: !m.meetsThreshold,
              }));
              
              // Determine why no match if applicable
              if (!matchedStudent) {
                if (realMatches.length === 0) {
                  noMatchReason = 'No hay rostros registrados en la colección que coincidan';
                } else if (faceMatches.length === 0) {
                  noMatchReason = 'Rostro no coincide con ningún estudiante de esta clase';
                } else if (faceMatches.every(m => !m.meetsThreshold)) {
                  noMatchReason = `Mejor coincidencia: ${bestMatch.student.firstName} ${bestMatch.student.lastName} con ${bestMatch.similarity.toFixed(1)}% (requiere ≥${FaceMatchThreshold}%)`;
                }
              }
            }
          } catch (searchError) {
            console.error(`[ATTENDANCE] Error searching face ${faceIdx + 1}:`, searchError);
            noMatchReason = `Error al buscar rostro: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`;
          }
          
          // Only add to debug if enabled
          if (collectDebug) {
            photoDebug.faces.push({
              boundingBox,
              confidence: faceConfidence,
              matchedStudent,
              faceId: matchedFaceId,
              topMatches: topMatches.length > 0 ? topMatches : undefined,
              noMatchReason,
            });
          }
        }
      } catch (indexError) {
        console.error(`[ATTENDANCE] Error indexing faces in photo ${photoIdx + 1}:`, indexError);
        photoDebug.totalFacesInPhoto = 0;
        photoDebug.faces = [{
          boundingBox: undefined,
          confidence: 0,
          noMatchReason: `Error al indexar rostros: ${indexError instanceof Error ? indexError.message : 'Unknown error'}`,
        }];
      } finally {
        // Step 3: CRITICAL - Delete temporary faces from collection
        if (tempFaceIds.length > 0) {
          try {
            if (debugEnabled) {
              console.log(`[ATTENDANCE] Cleaning up ${tempFaceIds.length} temporary faces`);
            }
            await rekognition.send(new DeleteFacesCommand({
              CollectionId: collectionId,
              FaceIds: tempFaceIds,
            }));
            if (debugEnabled) {
              console.log(`[ATTENDANCE] ✓ Cleaned up temporary faces`);
            }
          } catch (deleteError) {
            console.error(`[ATTENDANCE] ❌ Failed to cleanup temp faces:`, deleteError);
            // Don't fail the request, but log the error
          }
        }
      }
      
      // Only add to debug info if enabled
      if (collectDebug) {
        debugInfo.push(photoDebug);
      }
    }

    // Create session record (sessionId already generated earlier)
    await db.insert(sessionsTable).values({
      id: sessionId,
      classId: body.class_id,
      teacherId: body.teacher_id,
      classroomId: classDetails[0].classroomId,
      timestamp,
      expectedStudents: enrolledStudents.length,
      presentCount: allDetectedFaces.size,
      absentCount: enrolledStudents.length - allDetectedFaces.size,
      photoUrls: JSON.stringify(finalPhotoKeys), // Store photo keys in R2
      awsFacesDetected: totalFacesDetected,
      metadata: JSON.stringify({ 
        photos_processed: photoBytesArray.length,
        photo_source: body.photo_keys ? 'presigned' : 'base64'
      }),
    });

    // Create attendance records for all enrolled students
    const attendanceRecords = enrolledStudents.map((student) => {
      const detected = allDetectedFaces.get(student.studentId);
      const attendanceId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: attendanceId,
        studentId: student.studentId,
        sessionId,
        classId: body.class_id,
        classroomId: classDetails[0].classroomId,
        status: detected ? "present" : "absent",
        confidence: detected?.confidence ?? null,
        faceId: detected?.faceId ?? null,
        markedAt: timestamp,
        markedBy: "auto",
        corrected: false,
        notes: null,
      };
    });

    // Insert all attendance records
    for (const record of attendanceRecords) {
      await db.insert(attendanceTable).values(record);
    }

    // Prepare response
    const presentStudents = Array.from(allDetectedFaces.values()).map((d) => ({
      student_id: d.studentId,
      name: `${d.student.firstName} ${d.student.middleName || ""} ${d.student.lastName} ${d.student.secondLastName || ""}`.trim(),
      confidence: d.confidence,
      face_id: d.faceId,
      identification: d.student.identificationNumber,
    }));

    const absentStudents = enrolledStudents
      .filter((s) => !allDetectedFaces.has(s.studentId))
      .map((s) => ({
        student_id: s.studentId,
        name: `${s.firstName} ${s.middleName || ""} ${s.lastName} ${s.secondLastName || ""}`.trim(),
        identification: s.identificationNumber,
      }));

    return c.json({
      session_id: sessionId,
      class_id: body.class_id,
      timestamp,
      photos_processed: photoBytesArray.length,
      photo_urls: finalPhotoKeys,
      expected_students: enrolledStudents.length,
      present_count: allDetectedFaces.size,
      absent_count: enrolledStudents.length - allDetectedFaces.size,
      present_students: presentStudents,
      absent_students: absentStudents,
      total_faces_detected: totalFacesDetected,
      ...(debugEnabled && { debug_info: debugInfo }), // Only include debug info if enabled
    });
  } catch (error) {
    console.error("/attendance/session error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

attendance.post("/capture", async (c) => {
  try {
    const body = await c.req.json<{
      photo: string; // base64 data URL or raw base64
      face_match_threshold?: number; // optional override
      max_faces?: number; // optional override
    }>();

    if (!body?.photo) {
      return c.json({ error: "photo is required (base64)" }, 400);
    }

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      return c.json(
        { error: "AWS Rekognition credentials not configured" },
        500,
      );
    }

    const rekognition = new RekognitionClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const bytes = new Uint8Array(base64ToArrayBuffer(body.photo));

    const FaceMatchThreshold = body.face_match_threshold ?? 95;
    const MaxFaces = body.max_faces ?? 50;

    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: { Bytes: bytes },
      FaceMatchThreshold,
      MaxFaces,
      QualityFilter: "AUTO",
    });

    const out = await rekognition.send(command);
    const matches = out.FaceMatches ?? [];

    // Map matched face IDs -> students
    const faceIds = matches
      .map((m) => m.Face?.FaceId)
      .filter((id): id is string => Boolean(id));

    const db = drizzle(c.env.DB);

    let students: {
      faceId: string;
      similarity: number | null;
      student: {
        id: string;
        firstName: string;
        lastName: string;
        secondLastName: string | null;
        identificationNumber: string;
        gradeId: string | null;
      } | null;
      externalImageId?: string;
    }[] = [];

    if (faceIds.length > 0) {
      // Fetch student records for matched face IDs
      const rows = await db
        .select({
          faceId: studentFacesTable.faceId,
          student: studentsTable,
        })
        .from(studentFacesTable)
        .innerJoin(
          studentsTable,
          eq(studentFacesTable.studentId, studentsTable.id),
        )
        .where(inArray(studentFacesTable.faceId, faceIds));

      const byFaceId = new Map<string, (typeof rows)[number]["student"]>();
      for (const r of rows) byFaceId.set(r.faceId, r.student);

      students = matches.map((m) => {
        const fid = m.Face?.FaceId ?? "";
        const similarity =
          typeof m.Similarity === "number" ? m.Similarity : null;
        return {
          faceId: fid,
          similarity,
          externalImageId: m.Face?.ExternalImageId,
          student: fid ? (byFaceId.get(fid) ?? null) : null,
        };
      });
    }

    // Dedupe by student (keep highest similarity)
    const byStudent = new Map<string, (typeof students)[number]>();
    const unknown: typeof students = [];
    for (const m of students) {
      if (!m.student) {
        unknown.push(m);
        continue;
      }
      const id = m.student.id;
      const prev = byStudent.get(id);
      if (!prev || (m.similarity ?? 0) > (prev.similarity ?? 0))
        byStudent.set(id, m);
    }
    const deduped = [...byStudent.values(), ...unknown];

    return c.json({
      collection_id: collectionId,
      detected_students: deduped,
      present_count: deduped.filter((s) => s.student).length,
      unmatched_faces: null,
      processing_time_ms: undefined,
    });
  } catch (error) {
    console.error("/attendance/capture error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Detect faces in a photo and return bounding boxes
attendance.post("/detect-faces", async (c) => {
  try {
    const body = await c.req.json<{ photo: string }>();
    if (!body?.photo)
      return c.json({ error: "photo is required (base64)" }, 400);

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      return c.json(
        { error: "AWS Rekognition credentials not configured" },
        500,
      );
    }

    const rekognition = new RekognitionClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const bytes = new Uint8Array(base64ToArrayBuffer(body.photo));
    const out = await rekognition.send(
      new DetectFacesCommand({
        Image: { Bytes: bytes },
        Attributes: ["DEFAULT"],
      }),
    );

    const faces = (out.FaceDetails ?? []).map((fd) => ({
      boundingBox: fd.BoundingBox,
      confidence: fd.Confidence,
    }));

    return c.json({ collection_id: collectionId, faces, count: faces.length });
  } catch (err) {
    console.error("/attendance/detect-faces error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Match a single cropped face against the collection and return best student
attendance.post("/match-face", async (c) => {
  try {
    const body = await c.req.json<{ face: string; threshold?: number }>();
    if (!body?.face) return c.json({ error: "face is required (base64)" }, 400);

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = c.env;
    const collectionId =
      c.env.AWS_REKOGNITION_COLLECTION ?? "eduguard-school-default";
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      return c.json(
        { error: "AWS Rekognition credentials not configured" },
        500,
      );
    }

    const rekognition = new RekognitionClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const bytes = new Uint8Array(base64ToArrayBuffer(body.face));

    let out;
    try {
      out = await rekognition.send(
        new SearchFacesByImageCommand({
          CollectionId: collectionId,
          Image: { Bytes: bytes },
          FaceMatchThreshold: body.threshold ?? 95,
          MaxFaces: 1,
          QualityFilter: "AUTO",
        }),
      );
    } catch (e: any) {
      if (
        e?.name === "InvalidParameterException" ||
        e?.Code === "InvalidParameterException"
      ) {
        return c.json({ match: null });
      }
      throw e;
    }

    const match = (out.FaceMatches ?? [])[0];
    if (!match?.Face?.FaceId) return c.json({ match: null });

    const faceId = match.Face.FaceId;
    const db = drizzle(c.env.DB);
    const rows = await db
      .select({ faceId: studentFacesTable.faceId, student: studentsTable })
      .from(studentFacesTable)
      .innerJoin(
        studentsTable,
        eq(studentFacesTable.studentId, studentsTable.id),
      )
      .where(eq(studentFacesTable.faceId, faceId))
      .limit(1);

    const student = rows[0]?.student ?? null;
    return c.json({
      match: student
        ? {
            student,
            faceId,
            similarity: match.Similarity ?? null,
          }
        : null,
    });
  } catch (err) {
    console.error("/attendance/match-face error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/attendance/sessions/:sessionId/photos
// Returns signed URLs for session photos
attendance.get("/sessions/:sessionId/photos", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    if (!sessionId) {
      return c.json({ error: "Session ID is required" }, 400);
    }

    const db = drizzle(c.env.DB);
    
    // Get session from database
    const sessionData = await db
      .select({ photoUrls: sessionsTable.photoUrls })
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);

    if (sessionData.length === 0) {
      return c.json({ error: "Session not found" }, 404);
    }

    const photoUrls = sessionData[0].photoUrls;
    
    // Parse photo URLs from JSON
    let photoKeys: string[] = [];
    try {
      photoKeys = photoUrls ? JSON.parse(photoUrls) : [];
    } catch (e) {
      console.error("Failed to parse photo URLs:", e);
      return c.json({ error: "Invalid photo data" }, 500);
    }

    if (photoKeys.length === 0) {
      return c.json({ photos: [] });
    }

    // Generate presigned URLs
    const accountId = c.env.R2_ACCOUNT_ID;
    const bucket = c.env.R2_BUCKET_NAME;
    const accessKeyId = c.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = c.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      return c.json({ error: "R2 configuration not found" }, 500);
    }

    const signedUrls = await generatePresignedUrls(photoKeys, {
      accountId,
      bucketName: bucket,
      accessKeyId,
      secretAccessKey,
      expiresIn: 60 * 60, // 1 hour
    });

    return c.json({
      session_id: sessionId,
      photos: signedUrls,
      count: signedUrls.length,
    });
  } catch (error) {
    console.error("/attendance/sessions/:sessionId/photos error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default attendance;
