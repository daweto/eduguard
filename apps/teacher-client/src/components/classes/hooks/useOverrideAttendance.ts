import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  overrideAttendance,
  type OverrideAttendanceRequest,
} from "@/lib/api/attendance";
import { toast } from "sonner";

export function useOverrideAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attendanceId,
      ...data
    }: OverrideAttendanceRequest & { attendanceId: string }) =>
      overrideAttendance(attendanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["student", "attendance"] });
      toast.success("Asistencia actualizada correctamente");
    },
    onError: (error) => {
      console.error("Error updating attendance:", error);
      toast.error("Error al actualizar la asistencia");
    },
  });
}
