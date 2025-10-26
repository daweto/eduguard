import { useQuery } from "@tanstack/react-query";
import {
  getClassSessions,
  type ClassSessionsResponse,
} from "@/lib/api/attendance";

export function useClassSessions(classId: string) {
  return useQuery<ClassSessionsResponse>({
    queryKey: ["class", classId, "sessions"],
    queryFn: () => getClassSessions(classId),
    enabled: !!classId,
  });
}
