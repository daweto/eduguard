import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, count } from 'drizzle-orm';
import type { Bindings, EnrollStudentRequest, EnrollStudentResponse, GetStudentsResponse } from '../types';
import { students as studentsTable, studentFaces as studentFacesTable } from '../db/schema';
import { uploadPhoto, base64ToArrayBuffer } from '../utils/storage';

const students = new Hono<{ Bindings: Bindings }>();

// POST /api/students - Enroll new student
students.post('/', async (c) => {
  try {
    const body = await c.req.json<EnrollStudentRequest>();
    const db = drizzle(c.env.DB);

    // Validation
    if (!body.name || !body.guardian_name || !body.guardian_phone) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!body.photos || body.photos.length === 0) {
      return c.json({ error: 'At least one photo is required' }, 400);
    }

    if (body.photos.length > 3) {
      return c.json({ error: 'Maximum 3 photos allowed' }, 400);
    }

    // Generate student ID
    const studentId = crypto.randomUUID();
    const enrollmentDate = new Date().toISOString();

    // Insert student record using Drizzle
    await db.insert(studentsTable).values({
      id: studentId,
      name: body.name,
      grade: body.grade || null,
      guardianName: body.guardian_name,
      guardianPhone: body.guardian_phone,
      guardianEmail: body.guardian_email || null,
      enrollmentDate,
      status: 'active',
    });

    // Process and store photos
    const faceIds: string[] = [];
    for (let i = 0; i < body.photos.length; i++) {
      const photo = body.photos[i];

      // Generate unique IDs
      const faceId = `mock-face-${crypto.randomUUID()}`; // Mock AWS Rekognition face ID
      const photoKey = `students/${studentId}/photo-${i + 1}.jpg`;

      try {
        // Convert base64 to ArrayBuffer and upload to R2
        const photoData = base64ToArrayBuffer(photo.data);
        await uploadPhoto(c.env.PHOTOS, photoKey, photoData);

        // Insert face record using Drizzle
        await db.insert(studentFacesTable).values({
          id: crypto.randomUUID(),
          studentId,
          faceId,
          photoUrl: photoKey,
          indexedAt: new Date().toISOString(),
          qualityScore: 0.95, // Mock quality score
        });

        faceIds.push(faceId);
      } catch (error) {
        console.error(`Error processing photo ${i + 1}:`, error);
        // Continue processing other photos
      }
    }

    const response: EnrollStudentResponse = {
      student_id: studentId,
      status: 'enrolled',
      photos_stored: faceIds.length,
      aws_faces_indexed: faceIds.length,
      face_ids: faceIds,
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Error enrolling student:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/students - List all students
students.get('/', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const page = parseInt(c.req.query('page') || '1');
    const perPage = parseInt(c.req.query('per_page') || '50');
    const offset = (page - 1) * perPage;

    // Get total count using Drizzle
    const countResult = await db
      .select({ count: count() })
      .from(studentsTable)
      .where(eq(studentsTable.status, 'active'));

    const total = countResult[0]?.count || 0;

    // Get students using Drizzle
    const studentsList = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.status, 'active'))
      .orderBy(desc(studentsTable.createdAt))
      .limit(perPage)
      .offset(offset);

    // For each student, get their photo URLs
    const studentsWithPhotos = await Promise.all(
      studentsList.map(async (student) => {
        const faces = await db
          .select({ photoUrl: studentFacesTable.photoUrl })
          .from(studentFacesTable)
          .where(eq(studentFacesTable.studentId, student.id))
          .orderBy(studentFacesTable.createdAt);

        const photoUrls = faces.map(f => f.photoUrl || '');

        return {
          ...student,
          photo_urls: photoUrls,
        };
      })
    );

    const response: GetStudentsResponse = {
      students: studentsWithPhotos as any,
      total,
      page,
      per_page: perPage,
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching students:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/students/:id - Get single student
students.get('/:id', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const studentId = c.req.param('id');

    const student = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .limit(1);

    if (!student || student.length === 0) {
      return c.json({ error: 'Student not found' }, 404);
    }

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
      face_ids: faces.map(f => f.faceId),
      photo_urls: faces.map(f => f.photoUrl),
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/students/:id - Delete student
students.delete('/:id', async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const studentId = c.req.param('id');

    // Get face records to delete photos from R2
    const faces = await db
      .select({ photoUrl: studentFacesTable.photoUrl })
      .from(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId));

    // Delete photos from R2
    for (const face of faces) {
      if (face.photoUrl) {
        await c.env.PHOTOS.delete(face.photoUrl);
      }
    }

    // Delete student faces (using Drizzle)
    await db
      .delete(studentFacesTable)
      .where(eq(studentFacesTable.studentId, studentId));

    // Delete student (using Drizzle)
    await db
      .delete(studentsTable)
      .where(eq(studentsTable.id, studentId));

    return c.json({
      deleted: true,
      student_id: studentId,
      faces_removed: faces.length,
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default students;
