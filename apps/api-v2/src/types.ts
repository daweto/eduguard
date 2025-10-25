import type { Student, StudentFace } from './db/schema';

// Cloudflare bindings types
export type Bindings = {
  DB: D1Database;
  PHOTOS: R2Bucket;
};

// Re-export DB types
export type { Student, StudentFace };

// API request/response types
export interface EnrollStudentRequest {
  name: string;
  grade?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  photos: {
    data: string; // base64 encoded
    filename: string;
  }[];
}

export interface EnrollStudentResponse {
  student_id: string;
  status: string;
  photos_stored: number;
  aws_faces_indexed: number;
  face_ids: string[];
}

export interface GetStudentsResponse {
  students: (Student & { photo_urls: string[] })[];
  total: number;
  page: number;
  per_page: number;
}
