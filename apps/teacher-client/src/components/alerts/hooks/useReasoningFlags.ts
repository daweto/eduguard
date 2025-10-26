import { useQuery } from "@tanstack/react-query";
import { getReasoningFlags } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ReasoningFlagsResponse } from "@repo/shared-types";

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
    queryFn: () => getReasoningFlags(from, to),
  });
}
