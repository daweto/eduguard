import { useQuery } from "@tanstack/react-query";
import { getSessionDetail, type SessionDetailResponse } from "@/lib/api/attendance";

export function useSessionDetail(sessionId: string) {
  return useQuery<SessionDetailResponse>({
    queryKey: ["session", sessionId],
    queryFn: () => getSessionDetail(sessionId),
    enabled: !!sessionId,
  });
}

