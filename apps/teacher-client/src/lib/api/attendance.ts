import { fetchApi } from "./client";

export interface AttendanceCaptureResponse {
  collection_id: string;
  detected_students: Array<{
    faceId: string;
    similarity: number | null;
    externalImageId?: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      secondLastName: string | null;
      identificationNumber: string;
      gradeId: string | null;
    } | null;
  }>;
  present_count: number;
  unmatched_faces: number | null;
  processing_time_ms?: number;
}

export async function captureAttendance(
  base64Photo: string,
  options?: { threshold?: number; max?: number },
): Promise<AttendanceCaptureResponse> {
  return fetchApi<AttendanceCaptureResponse>("/api/attendance/capture", {
    method: "POST",
    body: JSON.stringify({
      photo: base64Photo,
      face_match_threshold: options?.threshold,
      max_faces: options?.max,
    }),
  });
}

export interface DetectFacesResponse {
  collection_id: string;
  faces: Array<{
    boundingBox?: {
      Left?: number;
      Top?: number;
      Width?: number;
      Height?: number;
    };
    confidence?: number;
  }>;
  count: number;
}

export async function detectFaces(
  base64Photo: string,
): Promise<DetectFacesResponse> {
  return fetchApi<DetectFacesResponse>("/api/attendance/detect-faces", {
    method: "POST",
    body: JSON.stringify({ photo: base64Photo }),
  });
}

export async function matchFace(
  base64Face: string,
  threshold = 95,
): Promise<{
  match: null | {
    student: {
      id: string;
      firstName: string;
      lastName: string;
      secondLastName: string | null;
      identificationNumber: string;
      gradeId: string | null;
    };
    faceId: string;
    similarity: number | null;
  };
}> {
  return fetchApi("/api/attendance/match-face", {
    method: "POST",
    body: JSON.stringify({ face: base64Face, threshold }),
  });
}

// Class Sessions
export interface SessionSummary {
  id: string;
  classId: string;
  teacherId: string;
  classroomId: string;
  timestamp: string;
  expectedStudents: number | null;
  presentCount: number | null;
  absentCount: number | null;
  photoUrls: string | null;
  awsFacesDetected: number | null;
  metadata: string | null;
  createdAt: string;
  attendanceSummary: {
    present: number;
    absent: number;
    excused: number;
    late: number;
    total: number;
  };
}

export interface ClassSessionsResponse {
  class_id: string;
  sessions: SessionSummary[];
  total: number;
}

export async function getClassSessions(
  classId: string,
): Promise<ClassSessionsResponse> {
  return fetchApi(`/api/attendance/classes/${classId}/sessions`);
}

// Session Detail
export interface AttendanceRecord {
  attendance: {
    id: string;
    status: string;
    confidence: number | null;
    faceId: string | null;
    markedAt: string | null;
    markedBy: string | null;
    corrected: boolean;
    correctedAt: string | null;
    correctedBy: string | null;
    notes: string | null;
  };
  student: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    identificationNumber: string;
    gradeId: string | null;
    gradeSectionId: string | null;
  };
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;
}

export interface SessionDetailResponse {
  session: {
    id: string;
    classId: string;
    teacherId: string;
    classroomId: string;
    timestamp: string;
    expectedStudents: number | null;
    presentCount: number | null;
    absentCount: number | null;
    photoUrls: string | null;
    awsFacesDetected: number | null;
    metadata: string | null;
    createdAt: string;
  };
  attendance: AttendanceRecord[];
  total: number;
}

export async function getSessionDetail(
  sessionId: string,
): Promise<SessionDetailResponse> {
  return fetchApi(`/api/attendance/sessions/${sessionId}`);
}

// Override Attendance
export interface OverrideAttendanceRequest {
  status: "present" | "absent" | "excused" | "late";
  teacher_id: string;
  notes?: string;
}

export async function overrideAttendance(
  attendanceId: string,
  data: OverrideAttendanceRequest,
): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/api/attendance/${attendanceId}/override`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
