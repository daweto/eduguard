/**
 * Hook for fetching and managing grades/stages metadata using React Query
 */

import { useQueries } from '@tanstack/react-query';
import { getStages, getGrades } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Grade, Stage } from '@/types/grade';

export interface GradeGroup extends Stage {
  grades: Grade[];
}

export interface UseGradesReturn {
  gradeGroups: GradeGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGrades(): UseGradesReturn {
  // Fetch stages and grades in parallel using useQueries
  const [stagesQuery, gradesQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.stages,
        queryFn: async () => {
          const response = await getStages();
          return response.stages;
        },
        // Stages rarely change, cache for longer
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: queryKeys.grades,
        queryFn: async () => {
          const response = await getGrades();
          return response.grades;
        },
        // Grades rarely change, cache for longer
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    ],
  });

  // Combine loading states
  const loading = stagesQuery.isLoading || gradesQuery.isLoading;

  // Combine error states
  const error =
    stagesQuery.error || gradesQuery.error
      ? 'No pudimos cargar la lista de cursos. Intenta nuevamente.'
      : null;

  // Transform and combine data
  const gradeGroups: GradeGroup[] = (() => {
    if (!stagesQuery.data || !gradesQuery.data) return [];

    const stagesSorted = [...stagesQuery.data].sort((a, b) => a.order - b.order);
    const gradesSorted = [...gradesQuery.data].sort((a, b) => a.order - b.order);

    return stagesSorted.map((stage) => ({
      ...stage,
      grades: gradesSorted.filter((grade) => grade.stageId === stage.id),
    }));
  })();

  // Refetch both queries
  const refetch = () => {
    stagesQuery.refetch();
    gradesQuery.refetch();
  };

  return {
    gradeGroups,
    loading,
    error,
    refetch,
  };
}
