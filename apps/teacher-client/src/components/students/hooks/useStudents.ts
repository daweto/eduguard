/**
 * Hook for fetching and managing students using React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, deleteStudent, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Student } from "@/types/student";
import { useState } from "react";

export interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  deleting: string | null;
  refetch: () => void;
  remove: (id: string) => Promise<void>;
}

export function useStudents(): UseStudentsReturn {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch students query
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.students,
    queryFn: async () => {
      const response = await getStudents();
      return response.students;
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteStudent(id);
      return id;
    },
    onMutate: async (id: string) => {
      setDeleting(id);
    },
    onSuccess: () => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
    onError: (err: unknown) => {
      console.error("Failed to delete student:", err);
    },
    onSettled: () => {
      setDeleting(null);
    },
  });

  // Delete handler with confirmation
  const remove = async (id: string): Promise<void> => {
    const confirmed = confirm(
      "¿Estás seguro que deseas eliminar este estudiante? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos eliminar el estudiante. Intenta nuevamente.";
      throw new Error(message);
    }
  };

  return {
    students: data ?? [],
    loading: isLoading,
    error: queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "No pudimos cargar los estudiantes. Intenta nuevamente."
      : null,
    deleting,
    refetch: () => {
      refetch();
    },
    remove,
  };
}
