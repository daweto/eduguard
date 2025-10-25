/**
 * Hook for fetching and managing guardians
 */

import { useEffect, useState, useCallback } from 'react';
import { getGuardians, createGuardian, ApiError } from '@/lib/api';
import type { LegalGuardian, CreateGuardianRequest } from '@/types/guardian';

export interface UseGuardiansReturn {
  guardians: LegalGuardian[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  refetch: () => Promise<void>;
  create: (data: CreateGuardianRequest) => Promise<LegalGuardian>;
}

export function useGuardians(): UseGuardiansReturn {
  const [guardians, setGuardians] = useState<LegalGuardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadGuardians = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getGuardians();
      setGuardians(response.guardians);
    } catch (err) {
      console.error('Failed to load guardians:', err);
      setError('No pudimos cargar la lista de apoderados. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (data: CreateGuardianRequest): Promise<LegalGuardian> => {
      setCreating(true);
      setError(null);

      try {
        const newGuardian = await createGuardian(data);
        setGuardians((prev) => [...prev, newGuardian]);
        return newGuardian;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'No pudimos crear el apoderado. Intenta nuevamente.';
        setError(message);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadGuardians();
  }, [loadGuardians]);

  return {
    guardians,
    loading,
    error,
    creating,
    refetch: loadGuardians,
    create,
  };
}
