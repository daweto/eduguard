/**
 * Voice API client
 * Handles voice calls to guardians
 */

import { fetchApi } from "./client";
import type {
  VoiceCallsListResponse,
  VoiceCallGetResponse,
  VoiceCallRequest,
  VoiceCallResponse,
} from "@repo/shared-types";

/**
 * Get all voice calls
 */
export async function getVoiceCalls(): Promise<VoiceCallsListResponse> {
  return fetchApi<VoiceCallsListResponse>("/api/voice/calls");
}

/**
 * Get a single voice call by ID
 * @param callId - The call ID
 */
export async function getVoiceCall(
  callId: string,
): Promise<VoiceCallGetResponse> {
  return fetchApi<VoiceCallGetResponse>(`/api/voice/calls/${callId}`);
}

/**
 * Initiate a voice call to a guardian
 * @param request - Voice call request payload
 */
export async function initiateVoiceCall(
  request: VoiceCallRequest,
): Promise<VoiceCallResponse> {
  return fetchApi<VoiceCallResponse>("/api/voice/call", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
