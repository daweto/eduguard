"use client";

import * as React from "react";

export type TeacherSummary = {
  id: string;
  fullName: string;
  email: string;
  subjects: string[];
  department: string;
};

export type TeacherGroup = {
  label: string;
  teachers: TeacherSummary[];
};

type TeacherContextValue = {
  teacherGroups: TeacherGroup[];
  teachers: TeacherSummary[];
  activeTeacherId: string;
  activeTeacher: TeacherSummary | null;
  selectTeacher: (teacherId: string) => void;
};

// Mirrors the seed data from apps/api-v2/src/db/seed.ts so teachers stay in sync with the API.
const TEACHER_GROUPS: TeacherGroup[] = [
  {
    label: "Departamento de Ciencias",
    teachers: [
      {
        id: "teacher-001",
        fullName: "María Isabel González Pérez",
        email: "maria.gonzalez@school.cl",
        subjects: ["Matemáticas", "Física"],
        department: "Ciencias",
      },
      {
        id: "teacher-003",
        fullName: "Ana Patricia Martínez López",
        email: "ana.martinez@school.cl",
        subjects: ["Química", "Biología"],
        department: "Ciencias",
      },
    ],
  },
  {
    label: "Departamento de Humanidades",
    teachers: [
      {
        id: "teacher-002",
        fullName: "Carlos Alberto Rodríguez Silva",
        email: "carlos.rodriguez@school.cl",
        subjects: ["Lenguaje", "Historia"],
        department: "Humanidades",
      },
    ],
  },
];

const TEACHERS = TEACHER_GROUPS.flatMap((group) => group.teachers);

const TeacherContext = React.createContext<TeacherContextValue | null>(null);

function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [activeTeacherId, setActiveTeacherId] = React.useState<string>(
    TEACHERS[0]?.id ?? "",
  );

  const activeTeacher = React.useMemo(() => {
    return TEACHERS.find((teacher) => teacher.id === activeTeacherId) ?? null;
  }, [activeTeacherId]);

  const selectTeacher = React.useCallback((teacherId: string) => {
    setActiveTeacherId((prev) => {
      if (prev === teacherId) return prev;
      const exists = TEACHERS.some((teacher) => teacher.id === teacherId);
      return exists ? teacherId : prev;
    });
  }, []);

  const value = React.useMemo<TeacherContextValue>(
    () => ({
      teacherGroups: TEACHER_GROUPS,
      teachers: TEACHERS,
      activeTeacherId,
      activeTeacher,
      selectTeacher,
    }),
    [activeTeacher, activeTeacherId, selectTeacher],
  );

  return (
    <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>
  );
}

function useTeacherContext() {
  const context = React.useContext(TeacherContext);
  if (!context) {
    throw new Error("useTeacherContext must be used within a TeacherProvider");
  }
  return context;
}

export { TeacherProvider, useTeacherContext, TEACHER_GROUPS, TEACHERS };
