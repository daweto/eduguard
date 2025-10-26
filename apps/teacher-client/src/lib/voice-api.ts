const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export interface InitiateCallParams {
  student_id: string;
  student_name: string;
  guardian_name: string;
  guardian_phone: string;
  risk_level?: string;
  pattern_type?: string;
  reasoning?: string;
  session_id?: string;
  class_name?: string;
}

export interface CallResponse {
  call_id: string;
  conversation_id?: string;
  student_id: string;
  student_name: string;
  guardian_name: string;
  guardian_phone: string;
  risk_level?: string;
  status: string;
  initiated_at: string;
}

export interface CallStatus {
  call_id: string;
  status: string;
  duration?: number;
  dtmf_response?: string;
  transcript?: string;
  recording_url?: string;
}

/**
 * Initiate a voice call to a guardian
 */
export async function initiateCall(params: InitiateCallParams): Promise<CallResponse> {
  const response = await fetch(`${API_BASE_URL}/api/voice/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get the status of a call
 */
export async function getCallStatus(callId: string): Promise<CallStatus> {
  const response = await fetch(`${API_BASE_URL}/api/voice/call/${callId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
