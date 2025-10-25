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
  // Preferred: presign and upload directly to R2, then send keys
  try {
    const presign = await presignStudentPhotos(photos.length);
    await Promise.all(
      presign.uploads.map(async (u, idx) => {
        const file = photos[idx]!;
        const res = await fetch(u.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': u.content_type },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      }),
    );
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
    // Fallback to base64 if presign/upload failed
    const photoPromises = photos.map(async (file) => {
      const base64 = await fileToBase64(file);
      return { data: base64, filename: file.name };
    });
    const encodedPhotos = await Promise.all(photoPromises);
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
