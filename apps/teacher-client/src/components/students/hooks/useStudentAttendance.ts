import { useQuery } from "@tanstack/react-query";
import {
  getStudentAttendance,
  type AttendanceFilters,
  type StudentAttendanceResponse,
} from "@/lib/api/students";

export function useStudentAttendance(
  studentId: string,
  filters?: AttendanceFilters,
) {
  return useQuery<StudentAttendanceResponse>({
    queryKey: ["student", studentId, "attendance", filters],
    queryFn: () => getStudentAttendance(studentId, filters),
    enabled: !!studentId,
  });
}
