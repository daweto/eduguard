/**
 * Hook for fetching and managing guardians using React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGuardians, createGuardian, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { LegalGuardian, CreateGuardianRequest } from "@/types/guardian";

export interface UseGuardiansReturn {
  guardians: LegalGuardian[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  refetch: () => void;
  create: (data: CreateGuardianRequest) => Promise<LegalGuardian>;
}

export function useGuardians(): UseGuardiansReturn {
  const queryClient = useQueryClient();

  // Fetch guardians query
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.guardians,
    queryFn: async () => {
      const response = await getGuardians();
      return response.guardians;
    },
  });

  // Create guardian mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGuardianRequest) => {
      return await createGuardian(data);
    },
    onSuccess: (newGuardian) => {
      // Optimistic update: add new guardian to cache immediately
      queryClient.setQueryData<LegalGuardian[]>(queryKeys.guardians, (old) => {
        return old ? [...old, newGuardian] : [newGuardian];
      });

      // Also invalidate to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
    },
    onError: (err: unknown) => {
      console.error("Failed to create guardian:", err);
    },
  });

  // Create handler
  const create = async (
    data: CreateGuardianRequest,
  ): Promise<LegalGuardian> => {
    try {
      return await createMutation.mutateAsync(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos crear el apoderado. Intenta nuevamente.";
      throw new Error(message);
    }
  };

  return {
    guardians: data ?? [],
    loading: isLoading,
    error: queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "No pudimos cargar la lista de apoderados. Intenta nuevamente."
      : null,
    creating: createMutation.isPending,
    refetch: () => {
      refetch();
    },
    create,
  };
}
