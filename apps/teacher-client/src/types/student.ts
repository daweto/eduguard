import type { LegalGuardian, GuardianProfileInput } from "@/types/guardian";

export interface Student {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  identificationNumber: string;
  gradeId: string | null;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  preferredLanguage: string;
  enrollmentDate: string;
  status: string;
  awsCollectionId: string | null;
  metadata: string | null;
  createdAt: string;
  photo_urls?: string[];
  face_ids?: string[];
  guardian?: LegalGuardian | null;
  gradeDisplayName?: string | null;
}

export interface StudentProfileInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationNumber: string;
  gradeId?: string;
  gradeSectionId?: string;
  academicYear?: string;
}

export interface EnrollStudentRequest {
  student: StudentProfileInput;
  guardian: GuardianProfileInput;
  photo_keys?: string[];
  photos?: {
    data: string;
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
