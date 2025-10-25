/**
 * API client - centralized exports
 */

// Base client
export { ApiError, fetchApi, API_BASE_URL } from './client';

// Students
export { enrollStudent, getStudents, getStudent, deleteStudent, fileToBase64, presignStudentPhotos } from './students';

// Guardians
export { getGuardians, createGuardian } from './guardians';

// Grades
export { getStages, getGrades } from './grades';
