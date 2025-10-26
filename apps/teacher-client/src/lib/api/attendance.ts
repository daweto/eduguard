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
