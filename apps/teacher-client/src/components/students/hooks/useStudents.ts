/**
 * Hook for fetching and managing students
 */

import { useEffect, useState, useCallback } from 'react';
import { getStudents, deleteStudent, ApiError } from '@/lib/api';
import type { Student } from '@/types/student';

export interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  deleting: string | null;
  refetch: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useStudents(refreshTrigger?: number): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getStudents();
      setStudents(response.students);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('No pudimos cargar los estudiantes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    const confirmed = confirm('¿Estás seguro que deseas eliminar este estudiante? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setDeleting(id);
    setError(null);

    try {
      await deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete student:', err);
      const message =
        err instanceof ApiError ? err.message : 'No pudimos eliminar el estudiante. Intenta nuevamente.';
      setError(message);
      throw err;
    } finally {
      setDeleting(null);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents, refreshTrigger]);

  return {
    students,
    loading,
    error,
    deleting,
    refetch: loadStudents,
    remove,
  };
}
