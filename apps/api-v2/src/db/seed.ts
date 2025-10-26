// Seed data for a small Chilean public school (escuela municipal)
import { drizzle } from "drizzle-orm/d1";
import {
  courses,
  grades,
  classrooms,
  teachers,
  stages,
  legalGuardians,
  students,
  classEnrollments,
  gradeSections,
  classes,
} from "./schema";

export const stagesData = [
  {
    id: "preschool",
    name: "preschool",
    displayName: "Educación Parvularia",
    order: 1,
    description: "Preschool education level (Prekinder and Kinder)",
  },
  {
    id: "elementary",
    name: "elementary",
    displayName: "Enseñanza Básica",
    order: 2,
    description: "Elementary education from 1st to 8th grade",
  },
  {
    id: "secondary",
    name: "secondary",
    displayName: "Enseñanza Media",
    order: 3,
    description: "Secondary education from 1st to 4th year",
  },
];

export const gradesData = [
  // Preschool
  {
    id: "prekinder",
    name: "prekinder",
    displayName: "Prekinder",
    stageId: "preschool",
    order: 1,
  },
  {
    id: "kinder",
    name: "kinder",
    displayName: "Kinder",
    stageId: "preschool",
    order: 2,
  },

  // Elementary
  {
    id: "1st-elementary",
    name: "1st-elementary",
    displayName: "1° Básico",
    stageId: "elementary",
    order: 3,
  },
  {
    id: "2nd-elementary",
    name: "2nd-elementary",
    displayName: "2° Básico",
    stageId: "elementary",
    order: 4,
  },
  {
    id: "3rd-elementary",
    name: "3rd-elementary",
    displayName: "3° Básico",
    stageId: "elementary",
    order: 5,
  },
  {
    id: "4th-elementary",
    name: "4th-elementary",
    displayName: "4° Básico",
    stageId: "elementary",
    order: 6,
  },
  {
    id: "5th-elementary",
    name: "5th-elementary",
    displayName: "5° Básico",
    stageId: "elementary",
    order: 7,
  },
  {
    id: "6th-elementary",
    name: "6th-elementary",
    displayName: "6° Básico",
    stageId: "elementary",
    order: 8,
  },
  {
    id: "7th-elementary",
    name: "7th-elementary",
    displayName: "7° Básico",
    stageId: "elementary",
    order: 9,
  },
  {
    id: "8th-elementary",
    name: "8th-elementary",
    displayName: "8° Básico",
    stageId: "elementary",
    order: 10,
  },

  // Secondary
  {
    id: "1st-secondary",
    name: "1st-secondary",
    displayName: "1° Medio",
    stageId: "secondary",
    order: 11,
  },
  {
    id: "2nd-secondary",
    name: "2nd-secondary",
    displayName: "2° Medio",
    stageId: "secondary",
    order: 12,
  },
  {
    id: "3rd-secondary",
    name: "3rd-secondary",
    displayName: "3° Medio",
    stageId: "secondary",
    order: 13,
  },
  {
    id: "4th-secondary",
    name: "4th-secondary",
    displayName: "4° Medio",
    stageId: "secondary",
    order: 14,
  },
];

// Grade Sections seed data (Homerooms for academic year 2025)
// Small municipal schools typically have a single section per grade
export const gradeSectionsData = [
  // Parvularia
  {
    id: "gs-prekinder",
    gradeId: "prekinder",
    label: "Única",
    displayName: "Prekinder",
    academicYear: "2025",
    maxStudents: 20,
  },
  {
    id: "gs-kinder",
    gradeId: "kinder",
    label: "Única",
    displayName: "Kinder",
    academicYear: "2025",
    maxStudents: 22,
  },

  // Básica (selected examples)
  {
    id: "gs-1basico",
    gradeId: "1st-elementary",
    label: "Única",
    displayName: "1° Básico",
    academicYear: "2025",
    maxStudents: 28,
  },
  {
    id: "gs-4basico",
    gradeId: "4th-elementary",
    label: "Única",
    displayName: "4° Básico",
    academicYear: "2025",
    maxStudents: 30,
  },
  {
    id: "gs-8basico",
    gradeId: "8th-elementary",
    label: "Única",
    displayName: "8° Básico",
    academicYear: "2025",
    maxStudents: 30,
  },

  // Media
  {
    id: "gs-1medio",
    gradeId: "1st-secondary",
    label: "Única",
    displayName: "1° Medio",
    academicYear: "2025",
    homeroomTeacherId: "teacher-001",
    maxStudents: 35,
  },
  {
    id: "gs-2medio",
    gradeId: "2nd-secondary",
    label: "Única",
    displayName: "2° Medio",
    academicYear: "2025",
    maxStudents: 35,
  },
  {
    id: "gs-4medio-a",
    gradeId: "4th-secondary",
    label: "A",
    displayName: "4° Medio A",
    academicYear: "2025",
    maxStudents: 38,
  },
  {
    id: "gs-4medio-b",
    gradeId: "4th-secondary",
    label: "B",
    displayName: "4° Medio B",
    academicYear: "2025",
    maxStudents: 38,
  },
];

// Teachers seed data
export const teachersData = [
  {
    id: "teacher-001",
    firstName: "María",
    middleName: "Isabel",
    lastName: "González",
    secondLastName: "Pérez",
    email: "maria.gonzalez@school.cl",
    phone: "+56968357637",
    subjects: "Matemáticas,Física",
    department: "Ciencias",
    status: "active",
  },
  {
    id: "teacher-002",
    firstName: "Carlos",
    middleName: "Alberto",
    lastName: "Rodríguez",
    secondLastName: "Silva",
    email: "carlos.rodriguez@school.cl",
    phone: "+56968357637",
    subjects: "Lenguaje,Historia",
    department: "Humanidades",
    status: "active",
  },
  {
    id: "teacher-003",
    firstName: "Ana",
    middleName: "Patricia",
    lastName: "Martínez",
    secondLastName: "López",
    email: "ana.martinez@school.cl",
    phone: "+56968357637",
    subjects: "Química,Biología",
    department: "Ciencias",
    status: "active",
  },
];

// Classrooms seed data (no fancy buildings; one main site)
export const classroomsData = [
  {
    id: "room-1",
    name: "Sala 1",
    building: "Sede Principal",
    floor: "Primer Piso",
    capacity: 30,
    roomType: "classroom",
    facilities: "pizarra",
  },
  {
    id: "room-2",
    name: "Sala 2",
    building: "Sede Principal",
    floor: "Primer Piso",
    capacity: 28,
    roomType: "classroom",
    facilities: "pizarra",
  },
  {
    id: "room-multiuso",
    name: "Sala Multiuso",
    building: "Sede Principal",
    floor: "Primer Piso",
    capacity: 25,
    roomType: "classroom",
    facilities: "pizarra",
  },
];

// Courses seed data
export const coursesData = [
  {
    id: "course-math-1m",
    courseCode: "MAT101",
    name: "Matemática I",
    subject: "Matemáticas",
    gradeLevel: "1st-secondary",
    credits: 1.0,
    description: "Álgebra y geometría básica",
    prerequisites: "",
    department: "Ciencias",
    status: "active",
  },
  {
    id: "course-lang-1m",
    courseCode: "LEN101",
    name: "Lenguaje y Comunicación I",
    subject: "Lenguaje",
    gradeLevel: "1st-secondary",
    credits: 1.0,
    description: "Comprensión lectora y expresión escrita",
    prerequisites: "",
    department: "Humanidades",
    status: "active",
  },
  {
    id: "course-chem-1m",
    courseCode: "QUI101",
    name: "Química I",
    subject: "Química",
    gradeLevel: "1st-secondary",
    credits: 1.0,
    description: "Introducción a la química",
    prerequisites: "",
    department: "Ciencias",
    status: "active",
  },
  {
    id: "course-phys-1m",
    courseCode: "FIS101",
    name: "Física I",
    subject: "Física",
    gradeLevel: "1st-secondary",
    credits: 1.0,
    description: "Mecánica y cinemática",
    prerequisites: "",
    department: "Ciencias",
    status: "active",
  },
];

// Classes seed data (single section "Única")
export const classesData = [
  // María González teaches Math and Physics
  {
    id: "class-math-1m-u",
    courseId: "course-math-1m",
    section: "Única",
    teacherId: "teacher-001",
    classroomId: "room-1",
    period: 1,
    scheduleDay: "daily",
    startTime: "08:00",
    endTime: "08:50",
    academicYear: "2025",
    semester: "Anual",
    maxStudents: 30,
    status: "active",
  },
  {
    id: "class-phys-1m-u",
    courseId: "course-phys-1m",
    section: "Única",
    teacherId: "teacher-001",
    classroomId: "room-1",
    period: 3,
    scheduleDay: "daily",
    startTime: "10:00",
    endTime: "10:50",
    academicYear: "2025",
    semester: "Anual",
    maxStudents: 30,
    status: "active",
  },
  // Carlos Rodríguez teaches Language
  {
    id: "class-lang-1m-u",
    courseId: "course-lang-1m",
    section: "Única",
    teacherId: "teacher-002",
    classroomId: "room-2",
    period: 2,
    scheduleDay: "daily",
    startTime: "09:00",
    endTime: "09:50",
    academicYear: "2025",
    semester: "Anual",
    maxStudents: 30,
    status: "active",
  },
  // Ana Martínez teaches Chemistry (in multiuse room)
  {
    id: "class-chem-1m-u",
    courseId: "course-chem-1m",
    section: "Única",
    teacherId: "teacher-003",
    classroomId: "room-multiuso",
    period: 4,
    scheduleDay: "daily",
    startTime: "11:00",
    endTime: "11:50",
    academicYear: "2025",
    semester: "Anual",
    maxStudents: 25,
    status: "active",
  },
];

// Valid Chilean RUTs available for use:
// Used: 9677209-2, 17679737-1, 8274022-8, 5585167-0 (guardians)
//       4871402-1, 9878848-4, 11794411-5, 11985894-1 (students)
// Available: 17778813-9, 7136662-6, 10144074-5, 16884133-7, 1422696-6, 17018079-8,
//            7786045-2, 19906768-0, 6346960-2, 19734201-3, 21876999-3, 17348019-9,
//            23719337-7, 2488071-0, 8108386-K, 5296555-1, 23560178-8, 22937078-2,
//            15495967-K, 2034453-9, 23670066-6, 15641036-5

// Sample guardians
export const guardiansData = [
  {
    id: "guardian-001",
    firstName: "Pedro",
    middleName: "José",
    lastName: "Muñoz",
    secondLastName: "García",
    identificationNumber: "9677209-2",
    phone: "+56968357637",
    email: "pedro.munoz@email.cl",
    preferredLanguage: "es",
    relation: "Padre",
    address: "Av. Libertador 123, Santiago",
  },
  {
    id: "guardian-002",
    firstName: "Carmen",
    middleName: "Rosa",
    lastName: "Fernández",
    secondLastName: "Soto",
    identificationNumber: "17679737-1",
    phone: "+56968357637",
    email: "carmen.fernandez@email.cl",
    preferredLanguage: "es",
    relation: "Madre",
    address: "Calle Principal 456, Santiago",
  },
  {
    id: "guardian-003",
    firstName: "Luis",
    middleName: "Andrés",
    lastName: "Castro",
    secondLastName: "Ramírez",
    identificationNumber: "8274022-8",
    phone: "+56968357637",
    email: "luis.castro@email.cl",
    preferredLanguage: "es",
    relation: "Padre",
    address: "Pasaje Los Robles 789, Santiago",
  },
  {
    id: "guardian-004",
    firstName: "David",
    middleName: "Felipe",
    lastName: "Weinstein",
    identificationNumber: "5585167-0",
    phone: "+56968357637",
    email: "dweinsteint@gmail.com",
    preferredLanguage: "es",
    relation: "Padre",
    address: "Av Providencia 1000, Providencia",
  },
  {
    id: "guardian-005",
    firstName: "Marcela",
    lastName: "Ortiz",
    secondLastName: "Rojas",
    identificationNumber: "17778813-9",
    phone: "+56968357637",
    email: "marcela.ortiz@email.cl",
    preferredLanguage: "es",
    relation: "Madre",
    address: "Villa Los Alamos, San Bernardo",
  },
  {
    id: "guardian-006",
    firstName: "Jorge",
    lastName: "Álvarez",
    secondLastName: "Muñoz",
    identificationNumber: "7136662-6",
    phone: "+56968357637",
    email: "jorge.alvarez@email.cl",
    preferredLanguage: "es",
    relation: "Padre",
    address: "Población Santa Elena, Maipú",
  },
];

// Sample students
export const studentsData = [
  {
    id: "student-001",
    firstName: "Joel",
    lastName: "Salas",
    identificationNumber: "4871402-1",
    gradeId: "1st-secondary",
    gradeSectionId: "gs-1medio", // 1° Medio (Única)
    guardianId: "guardian-001",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
  {
    id: "student-002",
    firstName: "Sheen",
    lastName: "Fernández",
    identificationNumber: "9878848-4",
    gradeId: "1st-secondary",
    gradeSectionId: "gs-1medio", // 1° Medio (Única)
    guardianId: "guardian-002",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
  {
    id: "student-003",
    firstName: "Boris",
    lastName: "Puentes",
    identificationNumber: "11794411-5",
    gradeId: "1st-secondary",
    gradeSectionId: "gs-1medio", // 1° Medio (Única)
    guardianId: "guardian-003",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
  {
    id: "student-004",
    firstName: "Felipe",
    lastName: "Torres",
    identificationNumber: "11985894-1",
    gradeId: "1st-secondary",
    gradeSectionId: "gs-1medio", // 1° Medio (Única)
    guardianId: "guardian-004",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
  {
    id: "student-005",
    firstName: "Camila",
    lastName: "Ortiz",
    identificationNumber: "10144074-5",
    gradeId: "4th-secondary",
    gradeSectionId: "gs-4medio-a", // 4° Medio A
    guardianId: "guardian-005",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
  {
    id: "student-006",
    firstName: "Nicolás",
    lastName: "Álvarez",
    identificationNumber: "16884133-7",
    gradeId: "4th-secondary",
    gradeSectionId: "gs-4medio-b", // 4° Medio B
    guardianId: "guardian-006",
    enrollmentDate: "2025-03-01",
    academicYear: "2025",
    status: "active",
    awsCollectionId: "eduguard-school-default",
    metadata: null,
  },
];

// Student faces seed data - uses PREDICTABLE externalImageId
// Skipped in seeding flow; kept for reference
export const studentFacesData = [
  // Joel Salas (student-001) - 3 photos
  {
    id: "face-001-1",
    studentId: "student-001",
    faceId: "placeholder",
    externalImageId: "student-001-photo-1",
    photoUrl: "students/student-001/photo-1.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-001-2",
    studentId: "student-001",
    faceId: "placeholder",
    externalImageId: "student-001-photo-2",
    photoUrl: "students/student-001/photo-2.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-001-3",
    studentId: "student-001",
    faceId: "placeholder",
    externalImageId: "student-001-photo-3",
    photoUrl: "students/student-001/photo-3.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },

  // Sheen Fernández (student-002) - 3 photos
  {
    id: "face-002-1",
    studentId: "student-002",
    faceId: "placeholder",
    externalImageId: "student-002-photo-1",
    photoUrl: "students/student-002/photo-1.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-002-2",
    studentId: "student-002",
    faceId: "placeholder",
    externalImageId: "student-002-photo-2",
    photoUrl: "students/student-002/photo-2.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-002-3",
    studentId: "student-002",
    faceId: "placeholder",
    externalImageId: "student-002-photo-3",
    photoUrl: "students/student-002/photo-3.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },

  // Boris Puentes (student-003) - 3 photos
  {
    id: "face-003-1",
    studentId: "student-003",
    faceId: "placeholder",
    externalImageId: "student-003-photo-1",
    photoUrl: "students/student-003/photo-1.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-003-2",
    studentId: "student-003",
    faceId: "placeholder",
    externalImageId: "student-003-photo-2",
    photoUrl: "students/student-003/photo-2.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-003-3",
    studentId: "student-003",
    faceId: "placeholder",
    externalImageId: "student-003-photo-3",
    photoUrl: "students/student-003/photo-3.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },

  // Felipe Torres (student-004) - 3 photos
  {
    id: "face-004-1",
    studentId: "student-004",
    faceId: "placeholder",
    externalImageId: "student-004-photo-1",
    photoUrl: "students/student-004/photo-1.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-004-2",
    studentId: "student-004",
    faceId: "placeholder",
    externalImageId: "student-004-photo-2",
    photoUrl: "students/student-004/photo-2.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
  {
    id: "face-004-3",
    studentId: "student-004",
    faceId: "placeholder",
    externalImageId: "student-004-photo-3",
    photoUrl: "students/student-004/photo-3.jpg",
    indexedAt: "2024-10-25T10:00:00Z",
    qualityScore: 99.0,
  },
];

// Class enrollments (students enrolled in classes)
export const enrollmentsData = [
  // Joel enrolled in all classes
  {
    id: "enroll-001",
    classId: "class-math-1m-u",
    studentId: "student-001",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-002",
    classId: "class-lang-1m-u",
    studentId: "student-001",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-003",
    classId: "class-phys-1m-u",
    studentId: "student-001",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-004",
    classId: "class-chem-1m-u",
    studentId: "student-001",
    enrolledDate: "2025-03-01",
    status: "active",
  },

  // Sheen enrolled in all classes
  {
    id: "enroll-005",
    classId: "class-math-1m-u",
    studentId: "student-002",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-006",
    classId: "class-lang-1m-u",
    studentId: "student-002",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-007",
    classId: "class-phys-1m-u",
    studentId: "student-002",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-008",
    classId: "class-chem-1m-u",
    studentId: "student-002",
    enrolledDate: "2025-03-01",
    status: "active",
  },

  // Boris enrolled in all classes
  {
    id: "enroll-009",
    classId: "class-math-1m-u",
    studentId: "student-003",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-010",
    classId: "class-lang-1m-u",
    studentId: "student-003",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-011",
    classId: "class-phys-1m-u",
    studentId: "student-003",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-012",
    classId: "class-chem-1m-u",
    studentId: "student-003",
    enrolledDate: "2025-03-01",
    status: "active",
  },

  // Felipe enrolled in all classes
  {
    id: "enroll-013",
    classId: "class-math-1m-u",
    studentId: "student-004",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-014",
    classId: "class-lang-1m-u",
    studentId: "student-004",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-015",
    classId: "class-phys-1m-u",
    studentId: "student-004",
    enrolledDate: "2025-03-01",
    status: "active",
  },
  {
    id: "enroll-016",
    classId: "class-chem-1m-u",
    studentId: "student-004",
    enrolledDate: "2025-03-01",
    status: "active",
  },
];

// Function to seed the database
export async function seedDatabase(db: D1Database) {
  const drizzleDb = drizzle(db);

  console.log("Seeding stages...");
  for (const stage of stagesData) {
    await drizzleDb.insert(stages).values(stage).onConflictDoNothing();
  }

  console.log("Seeding grades...");
  for (const grade of gradesData) {
    await drizzleDb.insert(grades).values(grade).onConflictDoNothing();
  }

  console.log("Seeding teachers...");
  for (const teacher of teachersData) {
    await drizzleDb.insert(teachers).values(teacher).onConflictDoNothing();
  }

  console.log("Seeding grade sections...");
  for (const gradeSection of gradeSectionsData) {
    await drizzleDb
      .insert(gradeSections)
      .values(gradeSection)
      .onConflictDoNothing();
  }

  console.log("Seeding classrooms...");
  for (const classroom of classroomsData) {
    await drizzleDb.insert(classrooms).values(classroom).onConflictDoNothing();
  }

  console.log("Seeding courses...");
  for (const course of coursesData) {
    await drizzleDb.insert(courses).values(course).onConflictDoNothing();
  }

  console.log("Seeding classes...");
  for (const cls of classesData) {
    await drizzleDb.insert(classes).values(cls).onConflictDoNothing();
  }

  console.log("Seeding guardians...");
  for (const guardian of guardiansData) {
    await drizzleDb
      .insert(legalGuardians)
      .values(guardian)
      .onConflictDoNothing();
  }

  console.log("Seeding students...");
  for (const student of studentsData) {
    await drizzleDb.insert(students).values(student).onConflictDoNothing();
  }

  console.log("Skipping student faces seeding (manual upload flow).");

  console.log("Seeding class enrollments...");
  for (const enrollment of enrollmentsData) {
    await drizzleDb
      .insert(classEnrollments)
      .values(enrollment)
      .onConflictDoNothing();
  }

  console.log("Database seeded successfully!");
}
