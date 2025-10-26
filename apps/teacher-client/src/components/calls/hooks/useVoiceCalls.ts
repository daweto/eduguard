import { useQuery } from "@tanstack/react-query";
import { getVoiceCalls } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { VoiceCallsListResponse } from "@repo/shared-types";

/**
 * Hook to fetch all voice calls
 */
export function useVoiceCalls() {
  return useQuery<VoiceCallsListResponse>({
    queryKey: queryKeys.voiceCalls,
    queryFn: getVoiceCalls,
  });
}
