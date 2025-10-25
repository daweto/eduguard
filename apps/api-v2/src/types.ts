import type { Student, StudentFace, LegalGuardian } from "./db/schema";

type Environment = "dev" | "production";

// Cloudflare bindings types
export interface Bindings {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: Environment;
  // AWS Rekognition
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_REKOGNITION_COLLECTION?: string;
  // R2 S3-compatible presign creds
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}

// Re-export DB types
export type { Student, StudentFace, LegalGuardian };

// API request/response types
export interface EnrollStudentRequest {
  name: string;
  grade?: string;
  guardian_id?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  // New preferred flow: provide uploaded R2 object keys
  photo_keys?: string[];
  // Legacy fallback: base64 upload from client
  photos?: {
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

export interface CreateGuardianRequest {
  name: string;
  phone: string;
  email?: string;
  preferred_language?: string;
  relation?: string;
  address?: string;
}

export interface GetGuardiansResponse {
  guardians: LegalGuardian[];
}
