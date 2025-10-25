/**
 * Hook for fetching and managing grades/stages metadata
 */

import { useEffect, useState } from 'react';
import { getStages, getGrades } from '@/lib/api';
import type { Grade, Stage } from '@/types/grade';

export interface GradeGroup extends Stage {
  grades: Grade[];
}

export interface UseGradesReturn {
  gradeGroups: GradeGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGrades(): UseGradesReturn {
  const [gradeGroups, setGradeGroups] = useState<GradeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGrades = async () => {
    setLoading(true);
    setError(null);

    try {
      const [stagesResponse, gradesResponse] = await Promise.all([getStages(), getGrades()]);

      const stagesSorted = [...stagesResponse.stages].sort((a, b) => a.order - b.order);
      const gradesSorted = [...gradesResponse.grades].sort((a, b) => a.order - b.order);

      const grouped = stagesSorted.map((stage) => ({
        ...stage,
        grades: gradesSorted.filter((grade) => grade.stageId === stage.id),
      }));

      setGradeGroups(grouped);
    } catch (err) {
      console.error('Failed to load grades metadata:', err);
      setError('No pudimos cargar la lista de cursos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGrades();
  }, []);

  return {
    gradeGroups,
    loading,
    error,
    refetch: loadGrades,
  };
}
