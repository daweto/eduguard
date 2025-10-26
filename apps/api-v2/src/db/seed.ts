// Seed data for Chilean school stages and grades
import { drizzle } from 'drizzle-orm/d1';
import { 
  stages, 
  grades, 
  teachers, 
  classrooms, 
  courses, 
  classes,
  legalGuardians,
  students,
  classEnrollments,
} from './schema';

export const stagesData = [
  {
    id: 'preschool',
    name: 'preschool',
    displayName: 'Educación Parvularia',
    order: 1,
    description: 'Preschool education level (Prekinder and Kinder)',
  },
  {
    id: 'elementary',
    name: 'elementary',
    displayName: 'Enseñanza Básica',
    order: 2,
    description: 'Elementary education from 1st to 8th grade',
  },
  {
    id: 'secondary',
    name: 'secondary',
    displayName: 'Enseñanza Media',
    order: 3,
    description: 'Secondary education from 1st to 4th year',
  },
];

export const gradesData = [
  // Preschool
  {
    id: 'prekinder',
    name: 'prekinder',
    displayName: 'Prekinder',
    stageId: 'preschool',
    order: 1,
  },
  {
    id: 'kinder',
    name: 'kinder',
    displayName: 'Kinder',
    stageId: 'preschool',
    order: 2,
  },

  // Elementary
  {
    id: '1st-elementary',
    name: '1st-elementary',
    displayName: '1° Básico',
    stageId: 'elementary',
    order: 3,
  },
  {
    id: '2nd-elementary',
    name: '2nd-elementary',
    displayName: '2° Básico',
    stageId: 'elementary',
    order: 4,
  },
  {
    id: '3rd-elementary',
    name: '3rd-elementary',
    displayName: '3° Básico',
    stageId: 'elementary',
    order: 5,
  },
  {
    id: '4th-elementary',
    name: '4th-elementary',
    displayName: '4° Básico',
    stageId: 'elementary',
    order: 6,
  },
  {
    id: '5th-elementary',
    name: '5th-elementary',
    displayName: '5° Básico',
    stageId: 'elementary',
    order: 7,
  },
  {
    id: '6th-elementary',
    name: '6th-elementary',
    displayName: '6° Básico',
    stageId: 'elementary',
    order: 8,
  },
  {
    id: '7th-elementary',
    name: '7th-elementary',
    displayName: '7° Básico',
    stageId: 'elementary',
    order: 9,
  },
  {
    id: '8th-elementary',
    name: '8th-elementary',
    displayName: '8° Básico',
    stageId: 'elementary',
    order: 10,
  },

  // Secondary
  {
    id: '1st-secondary',
    name: '1st-secondary',
    displayName: '1° Medio',
    stageId: 'secondary',
    order: 11,
  },
  {
    id: '2nd-secondary',
    name: '2nd-secondary',
    displayName: '2° Medio',
    stageId: 'secondary',
    order: 12,
  },
  {
    id: '3rd-secondary',
    name: '3rd-secondary',
    displayName: '3° Medio',
    stageId: 'secondary',
    order: 13,
  },
  {
    id: '4th-secondary',
    name: '4th-secondary',
    displayName: '4° Medio',
    stageId: 'secondary',
    order: 14,
  },
];

// Teachers seed data
export const teachersData = [
  {
    id: 'teacher-001',
    firstName: 'María',
    middleName: 'Isabel',
    lastName: 'González',
    secondLastName: 'Pérez',
    email: 'maria.gonzalez@school.cl',
    phone: '+56912345001',
    subjects: 'Matemáticas,Física',
    department: 'Ciencias',
    status: 'active',
  },
  {
    id: 'teacher-002',
    firstName: 'Carlos',
    middleName: 'Alberto',
    lastName: 'Rodríguez',
    secondLastName: 'Silva',
    email: 'carlos.rodriguez@school.cl',
    phone: '+56912345002',
    subjects: 'Lenguaje,Historia',
    department: 'Humanidades',
    status: 'active',
  },
  {
    id: 'teacher-003',
    firstName: 'Ana',
    middleName: 'Patricia',
    lastName: 'Martínez',
    secondLastName: 'López',
    email: 'ana.martinez@school.cl',
    phone: '+56912345003',
    subjects: 'Química,Biología',
    department: 'Ciencias',
    status: 'active',
  },
];

// Classrooms seed data
export const classroomsData = [
  {
    id: 'room-a1',
    name: 'A1',
    building: 'Edificio A',
    floor: 'Primer Piso',
    capacity: 35,
    roomType: 'classroom',
    facilities: 'proyector,pizarra,computadores',
  },
  {
    id: 'room-a2',
    name: 'A2',
    building: 'Edificio A',
    floor: 'Primer Piso',
    capacity: 30,
    roomType: 'classroom',
    facilities: 'proyector,pizarra',
  },
  {
    id: 'room-b1',
    name: 'B1',
    building: 'Edificio B',
    floor: 'Primer Piso',
    capacity: 25,
    roomType: 'classroom',
    facilities: 'pizarra',
  },
  {
    id: 'room-lab1',
    name: 'Lab Ciencias 1',
    building: 'Edificio C',
    floor: 'Segundo Piso',
    capacity: 30,
    roomType: 'lab',
    facilities: 'microscopios,equipamiento_laboratorio,pizarra',
  },
];

// Courses seed data
export const coursesData = [
  {
    id: 'course-math-1m',
    courseCode: 'MAT101',
    name: 'Matemática I',
    subject: 'Matemáticas',
    gradeLevel: '1st-secondary',
    credits: 1.0,
    description: 'Álgebra y geometría básica',
    prerequisites: '',
    department: 'Ciencias',
    status: 'active',
  },
  {
    id: 'course-lang-1m',
    courseCode: 'LEN101',
    name: 'Lenguaje y Comunicación I',
    subject: 'Lenguaje',
    gradeLevel: '1st-secondary',
    credits: 1.0,
    description: 'Comprensión lectora y expresión escrita',
    prerequisites: '',
    department: 'Humanidades',
    status: 'active',
  },
  {
    id: 'course-chem-1m',
    courseCode: 'QUI101',
    name: 'Química I',
    subject: 'Química',
    gradeLevel: '1st-secondary',
    credits: 1.0,
    description: 'Introducción a la química',
    prerequisites: '',
    department: 'Ciencias',
    status: 'active',
  },
  {
    id: 'course-phys-1m',
    courseCode: 'FIS101',
    name: 'Física I',
    subject: 'Física',
    gradeLevel: '1st-secondary',
    credits: 1.0,
    description: 'Mecánica y cinemática',
    prerequisites: '',
    department: 'Ciencias',
    status: 'active',
  },
];

// Classes seed data (specific sections taught by teachers)
export const classesData = [
  // María González teaches Math and Physics
  {
    id: 'class-math-1m-a',
    courseId: 'course-math-1m',
    section: 'A',
    teacherId: 'teacher-001',
    classroomId: 'room-a1',
    period: 1,
    scheduleDay: 'daily',
    startTime: '08:00',
    endTime: '08:50',
    academicYear: '2025',
    semester: 'Anual',
    maxStudents: 30,
    status: 'active',
  },
  {
    id: 'class-phys-1m-a',
    courseId: 'course-phys-1m',
    section: 'A',
    teacherId: 'teacher-001',
    classroomId: 'room-a1',
    period: 3,
    scheduleDay: 'daily',
    startTime: '10:00',
    endTime: '10:50',
    academicYear: '2025',
    semester: 'Anual',
    maxStudents: 30,
    status: 'active',
  },
  // Carlos Rodríguez teaches Language
  {
    id: 'class-lang-1m-a',
    courseId: 'course-lang-1m',
    section: 'A',
    teacherId: 'teacher-002',
    classroomId: 'room-a2',
    period: 2,
    scheduleDay: 'daily',
    startTime: '09:00',
    endTime: '09:50',
    academicYear: '2025',
    semester: 'Anual',
    maxStudents: 30,
    status: 'active',
  },
  // Ana Martínez teaches Chemistry
  {
    id: 'class-chem-1m-a',
    courseId: 'course-chem-1m',
    section: 'A',
    teacherId: 'teacher-003',
    classroomId: 'room-lab1',
    period: 4,
    scheduleDay: 'daily',
    startTime: '11:00',
    endTime: '11:50',
    academicYear: '2025',
    semester: 'Anual',
    maxStudents: 25,
    status: 'active',
  },
];

// Sample guardians
export const guardiansData = [
  {
    id: 'guardian-001',
    firstName: 'Pedro',
    middleName: 'José',
    lastName: 'Muñoz',
    secondLastName: 'García',
    identificationNumber: '12345678-9',
    phone: '+56987654321',
    email: 'pedro.munoz@email.cl',
    preferredLanguage: 'es',
    relation: 'Padre',
    address: 'Av. Libertador 123, Santiago',
  },
  {
    id: 'guardian-002',
    firstName: 'Carmen',
    middleName: 'Rosa',
    lastName: 'Fernández',
    secondLastName: 'Soto',
    identificationNumber: '23456789-0',
    phone: '+56987654322',
    email: 'carmen.fernandez@email.cl',
    preferredLanguage: 'es',
    relation: 'Madre',
    address: 'Calle Principal 456, Santiago',
  },
  {
    id: 'guardian-003',
    firstName: 'Luis',
    middleName: 'Andrés',
    lastName: 'Castro',
    secondLastName: 'Ramírez',
    identificationNumber: '34567890-1',
    phone: '+56987654323',
    email: 'luis.castro@email.cl',
    preferredLanguage: 'es',
    relation: 'Padre',
    address: 'Pasaje Los Robles 789, Santiago',
  },
];

// Sample students
export const studentsData = [
  {
    id: 'student-001',
    firstName: 'Joel',
    lastName: 'Salas',
    identificationNumber: '25123456-7',
    gradeId: '1st-secondary',
    guardianId: 'guardian-001',
    enrollmentDate: '2025-03-01',
    status: 'active',
    awsCollectionId: 'eduguard-school-default',
    metadata: null,
  },
  {
    id: 'student-002',
    firstName: 'Sheen',
    lastName: 'Fernández',
    identificationNumber: '25234567-8',
    gradeId: '1st-secondary',
    guardianId: 'guardian-002',
    enrollmentDate: '2025-03-01',
    status: 'active',
    awsCollectionId: 'eduguard-school-default',
    metadata: null,
  },
  {
    id: 'student-003',
    firstName: 'Boris',
    lastName: 'Puentes',
    identificationNumber: '25345678-9',
    gradeId: '1st-secondary',
    guardianId: 'guardian-003',
    enrollmentDate: '2025-03-01',
    status: 'active',
    awsCollectionId: 'eduguard-school-default',
    metadata: null,
  },
];

// Class enrollments (students enrolled in classes)
export const enrollmentsData = [
  // Sofía enrolled in all classes
  { id: 'enroll-001', classId: 'class-math-1m-a', studentId: 'student-001', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-002', classId: 'class-lang-1m-a', studentId: 'student-001', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-003', classId: 'class-phys-1m-a', studentId: 'student-001', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-004', classId: 'class-chem-1m-a', studentId: 'student-001', enrolledDate: '2025-03-01', status: 'active' },
  
  // Diego enrolled in all classes
  { id: 'enroll-005', classId: 'class-math-1m-a', studentId: 'student-002', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-006', classId: 'class-lang-1m-a', studentId: 'student-002', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-007', classId: 'class-phys-1m-a', studentId: 'student-002', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-008', classId: 'class-chem-1m-a', studentId: 'student-002', enrolledDate: '2025-03-01', status: 'active' },
  
  // Catalina enrolled in all classes
  { id: 'enroll-009', classId: 'class-math-1m-a', studentId: 'student-003', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-010', classId: 'class-lang-1m-a', studentId: 'student-003', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-011', classId: 'class-phys-1m-a', studentId: 'student-003', enrolledDate: '2025-03-01', status: 'active' },
  { id: 'enroll-012', classId: 'class-chem-1m-a', studentId: 'student-003', enrolledDate: '2025-03-01', status: 'active' },
];

// Function to seed the database
export async function seedDatabase(db: D1Database) {
  const drizzleDb = drizzle(db);

  console.log('Seeding stages...');
  for (const stage of stagesData) {
    await drizzleDb.insert(stages).values(stage).onConflictDoNothing();
  }

  console.log('Seeding grades...');
  for (const grade of gradesData) {
    await drizzleDb.insert(grades).values(grade).onConflictDoNothing();
  }

  console.log('Seeding teachers...');
  for (const teacher of teachersData) {
    await drizzleDb.insert(teachers).values(teacher);
  }

  console.log('Seeding classrooms...');
  for (const classroom of classroomsData) {
    await drizzleDb.insert(classrooms).values(classroom);
  }

  console.log('Seeding courses...');
  for (const course of coursesData) {
    await drizzleDb.insert(courses).values(course);
  }

  console.log('Seeding classes...');
  for (const cls of classesData) {
    await drizzleDb.insert(classes).values(cls);
  }

  console.log('Seeding guardians...');
  for (const guardian of guardiansData) {
    await drizzleDb.insert(legalGuardians).values(guardian);
  }

  console.log('Seeding students...');
  for (const student of studentsData) {
    await drizzleDb.insert(students).values(student);
  }

  console.log('Seeding class enrollments...');
  for (const enrollment of enrollmentsData) {
    await drizzleDb.insert(classEnrollments).values(enrollment);
  }

  console.log('Database seeded successfully!');
}
