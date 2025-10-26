import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export interface ClassStudent {
  enrollment: {
    id: string;
    enrolledDate: string;
    status: string;
  };
  student: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    identificationNumber: string;
    gradeId: string;
  };
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  faceCount: number;
  fullName: string;
}

export interface ClassStudentsResponse {
  class: {
    id: string;
    section: string;
    period: number;
    course: {
      name: string;
      subject: string;
    };
    classroom: {
      name: string;
      building: string;
    };
  };
  students: ClassStudent[];
  total: number;
}

export function useClassStudents(classId: string | undefined) {
  const [classData, setClassData] = useState<ClassStudentsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!classId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/classes/${classId}/students`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setClassData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassStudents();
  }, [classId]);

  const refetch = async () => {
    if (!classId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/classes/${classId}/students`,
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setClassData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return { classData, isLoading, error, refetch };
}
