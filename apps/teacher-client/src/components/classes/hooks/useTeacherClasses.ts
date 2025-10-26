import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export interface TeacherClass {
  id: string;
  section: string;
  period: number;
  scheduleDay: string;
  startTime: string;
  endTime: string;
  academicYear: string;
  semester: string;
  maxStudents: number;
  status: string;
  enrolledStudents: number;
  displayName: string;
  course: {
    id: string;
    courseCode: string;
    name: string;
    subject: string;
    gradeLevel: string;
  };
  classroom: {
    id: string;
    name: string;
    building: string;
    capacity: number;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    secondLastName: string;
  };
}

export interface TeacherClassesResponse {
  teacher_id: string;
  classes: TeacherClass[];
  total: number;
}

export function useTeacherClasses(teacherId: string) {
  const [classes, setClasses] = useState<TeacherClassesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/classes/teacher/${teacherId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setClasses(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (teacherId) {
      fetchClasses();
    }
  }, [teacherId]);

  return { classes, isLoading, error };
}

