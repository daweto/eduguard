/**
 * Student API endpoints
 */

import { fetchApi } from './client';
import type {
  EnrollStudentRequest,
  EnrollStudentResponse,
  GetStudentsResponse,
  Student,
} from '@/types/student';

// Re-export types for convenience
export type { Student } from '@/types/student';

/**
 * Convert File to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Presign direct-to-R2 uploads for student photos
 */
export async function presignStudentPhotos(
  count: number,
  contentType = 'image/jpeg',
): Promise<{
  bucket: string;
  uploads: { key: string; upload_url: string; content_type: string }[];
}> {
  return fetchApi('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ purpose: 'student_photo', count, contentType }),
  });
}

/**
 * Enroll a new student with photos
 */
export async function enrollStudent(
  payload: {
    student: EnrollStudentRequest['student'];
    guardian: EnrollStudentRequest['guardian'];
  },
  photos: File[],
): Promise<EnrollStudentResponse> {
  console.log(`[ENROLLMENT CLIENT] Starting enrollment with ${photos.length} photo(s)`);
  
  // Preferred: presign and upload directly to R2, then send keys
  try {
    console.log('[ENROLLMENT CLIENT] Requesting presigned URLs...');
    const presign = await presignStudentPhotos(photos.length);
    console.log('[ENROLLMENT CLIENT] Received presigned URLs:', presign.uploads.map(u => ({ key: u.key, url: u.upload_url.substring(0, 50) + '...' })));
    
    console.log('[ENROLLMENT CLIENT] Uploading photos to R2...');
    await Promise.all(
      presign.uploads.map(async (u, idx) => {
        const file = photos[idx]!;
        console.log(`[ENROLLMENT CLIENT] Uploading photo ${idx + 1}/${photos.length} to ${u.key} (${file.size} bytes)`);
        
        const res = await fetch(u.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': u.content_type },
          body: file,
        });
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unable to read error');
          console.error(`[ENROLLMENT CLIENT] Upload ${idx + 1} failed with status ${res.status}:`, errorText);
          throw new Error(`Upload failed: ${res.status}`);
        }
        
        console.log(`[ENROLLMENT CLIENT] ✓ Photo ${idx + 1} uploaded successfully`);
      }),
    );
    
    console.log('[ENROLLMENT CLIENT] All photos uploaded, sending enrollment request with keys');
    const requestBody: EnrollStudentRequest = {
      student: payload.student,
      guardian: payload.guardian,
      photo_keys: presign.uploads.map((u) => u.key),
    };
    return fetchApi<EnrollStudentResponse>('/api/students', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error('[ENROLLMENT CLIENT] Presigned upload failed, falling back to base64:', err);
    
    // Fallback to base64 if presign/upload failed
    const photoPromises = photos.map(async (file) => {
      const base64 = await fileToBase64(file);
      return { data: base64, filename: file.name };
    });
    const encodedPhotos = await Promise.all(photoPromises);
    console.log(`[ENROLLMENT CLIENT] Converted ${encodedPhotos.length} photos to base64, sending enrollment request`);
    
    const requestBody: EnrollStudentRequest = {
      student: payload.student,
      guardian: payload.guardian,
      photos: encodedPhotos,
    };
    return fetchApi<EnrollStudentResponse>('/api/students', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }
}

/**
 * Get all students with pagination
 */
export async function getStudents(page: number = 1, perPage: number = 50): Promise<GetStudentsResponse> {
  return fetchApi<GetStudentsResponse>(`/api/students?page=${page}&per_page=${perPage}`);
}

/**
 * Get single student by ID
 */
export async function getStudent(id: string): Promise<Student> {
  return fetchApi<Student>(`/api/students/${id}`);
}

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<{ deleted: boolean; student_id: string }> {
  return fetchApi(`/api/students/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload photos to existing student using presigned URLs
 */
export async function uploadStudentPhotos(
  studentId: string,
  photos: File[],
): Promise<{
  success: boolean;
  student_id: string;
  photos_uploaded: number;
  faces_indexed: Array<{ face_id: string; photo_key: string }>;
}> {
  console.log(`[STUDENT PHOTOS] Starting upload for ${studentId} with ${photos.length} photo(s)`);
  
  // 1. Request presigned URLs
  console.log('[STUDENT PHOTOS] Requesting presigned URLs...');
  const presign = await presignStudentPhotos(photos.length, photos[0]?.type || 'image/jpeg');
  console.log('[STUDENT PHOTOS] Received presigned URLs');
  
  // 2. Upload photos to R2
  console.log('[STUDENT PHOTOS] Uploading photos to R2...');
  await Promise.all(
    presign.uploads.map(async (u, idx) => {
      const file = photos[idx]!;
      console.log(`[STUDENT PHOTOS] Uploading photo ${idx + 1}/${photos.length}`);
      
      const res = await fetch(u.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': u.content_type },
        body: file,
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed for photo ${idx + 1}: ${res.status}`);
      }
      
      console.log(`[STUDENT PHOTOS] ✓ Photo ${idx + 1} uploaded`);
    }),
  );
  
  // 3. Send photo keys to backend
  console.log('[STUDENT PHOTOS] Sending photo keys to backend...');
  return fetchApi<{
    success: boolean;
    student_id: string;
    photos_uploaded: number;
    faces_indexed: Array<{ face_id: string; photo_key: string }>;
  }>(`/api/students/${studentId}/photos`, {
    method: 'POST',
    body: JSON.stringify({ photo_keys: presign.uploads.map(u => u.key) }),
  });
}

/**
 * Student Attendance History
 */
export interface AttendanceFilters {
  classId?: string;
  courseId?: string;
  subject?: string;
  teacherId?: string;
  from?: string;
  to?: string;
  status?: "present" | "absent" | "excused" | "late";
}

export interface StudentAttendanceResponse {
  student_id: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    excused: number;
    late: number;
    attendanceRate: number;
  };
  records: Array<{
    attendance: {
      id: string;
      status: string;
      confidence: number | null;
      markedAt: string | null;
      markedBy: string | null;
      corrected: boolean;
      correctedAt: string | null;
      correctedBy: string | null;
      notes: string | null;
    };
    session: {
      id: string;
      timestamp: string;
    };
    class: {
      id: string;
      section: string;
      period: number;
    };
    course: {
      id: string;
      name: string;
      subject: string;
      courseCode: string;
    };
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  filters: {
    classId: string | null;
    courseId: string | null;
    subject: string | null;
    teacherId: string | null;
    from: string | null;
    to: string | null;
    status: string | null;
  };
}

export async function getStudentAttendance(
  studentId: string,
  filters?: AttendanceFilters
): Promise<StudentAttendanceResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const url = `/api/students/${studentId}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchApi(url);
}
