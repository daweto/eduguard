import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { ReasoningFlagsResponse } from "@repo/shared-types";
import { getMockReasoningFlags } from "@/lib/mockAlarmData";

interface UseReasoningFlagsParams {
  from?: string;
  to?: string;
}

/**
 * Hook to fetch reasoning flags (risk assessments for students)
 * @param params - Optional date range filters
 */
export function useReasoningFlags(params?: UseReasoningFlagsParams) {
  const { from, to } = params || {};

  return useQuery<ReasoningFlagsResponse>({
    queryKey: queryKeys.reasoningFlags(from, to),
    queryFn: () => {
      // Use mock data for demo if enabled
      return getMockReasoningFlags(from, to);
      // Otherwise use real API
    },
  });
}
