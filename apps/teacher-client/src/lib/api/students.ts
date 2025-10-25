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
