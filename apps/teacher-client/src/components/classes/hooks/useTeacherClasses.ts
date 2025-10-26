import { useQuery } from "@tanstack/react-query";

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

async function fetchTeacherClasses(
  teacherId: string,
): Promise<TeacherClassesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/classes/teacher/${teacherId}`,
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useTeacherClasses(teacherId: string) {
  const { data, isLoading, error } = useQuery<TeacherClassesResponse>({
    queryKey: ["teacher", teacherId, "classes"],
    queryFn: () => fetchTeacherClasses(teacherId),
    enabled: !!teacherId,
  });

  return { classes: data, isLoading, error };
}
