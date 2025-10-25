// API client for EduGuard backend

import type {
  EnrollStudentRequest,
  EnrollStudentResponse,
  GetStudentsResponse,
  Student
} from '@/types/student';
import type { GetStagesResponse, GetGradesResponse } from '@/types/grade';

// API base URL - update this based on your deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Convert File to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Enroll a new student
export async function enrollStudent(
  data: {
    name: string;
    grade?: string;
    guardian_name: string;
    guardian_phone: string;
    guardian_email?: string;
  },
  photos: File[]
): Promise<EnrollStudentResponse> {
  // Convert photos to base64
  const photoPromises = photos.map(async (file) => {
    const base64 = await fileToBase64(file);
    return {
      data: base64,
      filename: file.name,
    };
  });

  const encodedPhotos = await Promise.all(photoPromises);

  const requestBody: EnrollStudentRequest = {
    ...data,
    photos: encodedPhotos,
  };

  return fetchApi<EnrollStudentResponse>('/api/students', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

// Get all students
export async function getStudents(
  page: number = 1,
  perPage: number = 50
): Promise<GetStudentsResponse> {
  return fetchApi<GetStudentsResponse>(
    `/api/students?page=${page}&per_page=${perPage}`
  );
}

// Get single student by ID
export async function getStudent(id: string): Promise<Student> {
  return fetchApi<Student>(`/api/students/${id}`);
}

// Delete student
export async function deleteStudent(id: string): Promise<{ deleted: boolean; student_id: string }> {
  return fetchApi(`/api/students/${id}`, {
    method: 'DELETE',
  });
}

// Get all stages
export async function getStages(): Promise<GetStagesResponse> {
  return fetchApi<GetStagesResponse>('/api/grades/stages');
}

// Get all grades (optionally filtered by stage)
export async function getGrades(stageId?: string): Promise<GetGradesResponse> {
  const query = stageId ? `?stage_id=${stageId}` : '';
  return fetchApi<GetGradesResponse>(`/api/grades${query}`);
}

export { ApiError };
