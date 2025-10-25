// Student types matching backend API

export interface Student {
  id: string;
  name: string;
  grade: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  preferred_language: string;
  enrollment_date: string;
  status: string;
  aws_collection_id: string;
  created_at: string;
  photo_urls?: string[];
  face_ids?: string[];
}

export interface EnrollmentFormData {
  name: string;
  grade: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  photos: File[];
}

export interface PhotoPreview {
  file: File;
  preview: string;
  base64?: string;
}

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
  students: Student[];
  total: number;
  page: number;
  per_page: number;
}
