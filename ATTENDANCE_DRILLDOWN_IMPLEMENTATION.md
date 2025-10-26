# Attendance Drilldown Implementation Guide

## Overview

This guide documents the implementation of the attendance drilldown feature, which allows teachers to:

- View their classes and sessions
- Drill down into session-level attendance details
- Review and override attendance records
- View per-student attendance history with flexible filtering

## Database Schema Changes

### New Tables

#### `grade_sections` (Homerooms)

Represents homeroom sections like "4° Básico A", "1° Medio B".

```sql
CREATE TABLE `grade_sections` (
  `id` text PRIMARY KEY NOT NULL,
  `grade_id` text NOT NULL,              -- FK to grades
  `label` text NOT NULL,                 -- "A", "B", "C"
  `display_name` text NOT NULL,          -- "4° Básico A"
  `academic_year` text NOT NULL,         -- "2024-2025"
  `homeroom_teacher_id` text,            -- Optional FK to teachers
  `max_students` integer,
  `status` text DEFAULT 'active',        -- 'active' | 'archived'
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`),
  FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`)
);
```

**Unique Constraint:** `(grade_id, label, academic_year)`

### Modified Tables

#### `students` table

- **Added:** `grade_section_id` (FK to grade_sections)
- **Added:** `academic_year` (text, e.g., "2024-2025")

#### `attendance` table

- **Added:** `corrected_at` (text, ISO timestamp)
- **Added:** `corrected_by` (text, teacher ID)

### New Indices

```sql
-- Grade sections
CREATE INDEX `idx_grade_sections_grade` ON `grade_sections`(`grade_id`);
CREATE INDEX `idx_grade_sections_academic_year` ON `grade_sections`(`academic_year`);
CREATE INDEX `idx_grade_sections_teacher` ON `grade_sections`(`homeroom_teacher_id`);
CREATE UNIQUE INDEX `idx_grade_sections_unique` ON `grade_sections`(`grade_id`, `label`, `academic_year`);

-- Students
CREATE INDEX `idx_students_grade_section` ON `students`(`grade_section_id`);

-- Attendance (composite indices for performance)
CREATE INDEX `idx_attendance_student_session` ON `attendance`(`student_id`, `session_id`);
CREATE INDEX `idx_enrollments_class_student` ON `class_enrollments`(`class_id`, `student_id`);
```

## Migration

**File:** `migrations/0002_add_grade_sections_attendance_drilldown.sql`

The migration includes:

1. Creates `grade_sections` table with indices
2. Adds new columns to `students` and `attendance`
3. Backfills default grade sections (one "A" section per grade for 2024-2025)
4. Updates existing students to assign them to default sections

**To run:**

```bash
# Local development
pnpm --filter api-v2 migrate:local

# Production
pnpm --filter api-v2 deploy
```

## API Endpoints

### Teacher Classes

**Existing:** `GET /api/classes/teacher/:teacherId`

Returns all classes taught by a teacher with enrollment counts.

### Class Sessions

**New:** `GET /api/attendance/classes/:classId/sessions`

Lists all attendance sessions for a class with attendance summaries.

**Response:**

```json
{
  "class_id": "class-123",
  "sessions": [
    {
      "id": "session-456",
      "timestamp": "2025-03-15T10:00:00Z",
      "expectedStudents": 30,
      "presentCount": 28,
      "absentCount": 2,
      "attendanceSummary": {
        "present": 28,
        "absent": 2,
        "excused": 0,
        "late": 0,
        "total": 30
      }
    }
  ],
  "total": 15
}
```

### Session Detail

**New:** `GET /api/attendance/sessions/:sessionId`

Get detailed roster for a specific session.

**Response:**

```json
{
  "session": {
    "id": "session-456",
    "classId": "class-123",
    "timestamp": "2025-03-15T10:00:00Z",
    "presentCount": 28,
    "absentCount": 2
  },
  "attendance": [
    {
      "attendance": {
        "id": "att-789",
        "status": "present",
        "confidence": 95.5,
        "markedAt": "2025-03-15T10:05:00Z",
        "markedBy": "auto",
        "corrected": false,
        "notes": null
      },
      "student": {
        "id": "student-001",
        "firstName": "Joel",
        "lastName": "Salas",
        "identificationNumber": "25123456-7",
        "gradeId": "1st-secondary",
        "gradeSectionId": "gs-1sec-a"
      }
    }
  ],
  "total": 30
}
```

### Override Attendance

**New:** `PATCH /api/attendance/:attendanceId/override`

Correct/override an attendance record.

**Request:**

```json
{
  "status": "present", // "present" | "absent" | "excused" | "late"
  "teacher_id": "teacher-001",
  "notes": "Student arrived late but was present"
}
```

### Student Attendance History

**New:** `GET /api/students/:studentId/attendance`

Get attendance history for a student with optional filters.

**Query Parameters:**

- `classId` - Filter by specific class
- `courseId` - Filter by course
- `subject` - Filter by subject (e.g., "Matemáticas")
- `teacherId` - Filter by teacher
- `from` - Start date (ISO format)
- `to` - End date (ISO format)
- `status` - Filter by status ("present", "absent", "excused", "late")

**Response:**

```json
{
  "student_id": "student-001",
  "summary": {
    "total": 45,
    "present": 40,
    "absent": 3,
    "excused": 1,
    "late": 1,
    "attendanceRate": 91
  },
  "records": [
    {
      "attendance": {
        "id": "att-789",
        "status": "present",
        "confidence": 95.5,
        "markedAt": "2025-03-15T10:05:00Z"
      },
      "session": {
        "id": "session-456",
        "timestamp": "2025-03-15T10:00:00Z"
      },
      "class": {
        "id": "class-123",
        "section": "A",
        "period": 1
      },
      "course": {
        "id": "course-math-1m",
        "name": "Matemáticas 1° Medio",
        "subject": "Matemáticas",
        "courseCode": "MATH-1M"
      },
      "teacher": {
        "id": "teacher-001",
        "firstName": "María",
        "lastName": "González"
      }
    }
  ],
  "filters": {
    "classId": null,
    "courseId": null,
    "subject": null,
    "teacherId": null,
    "from": "2024-03-01T00:00:00Z",
    "to": "2025-03-31T23:59:59Z",
    "status": null
  }
}
```

## Seed Data Updates

The seed file now includes:

- **Grade Sections:** 19 sections across all grades (A and B sections for key grades)
- **Students:** Updated to include `gradeSectionId` and `academicYear`
- **Homeroom Teachers:** Some grade sections assigned to homeroom teachers

Example grade sections:

- `gs-1sec-a` → "1° Medio A" (homeroom teacher: teacher-001)
- `gs-1sec-b` → "1° Medio B"
- `gs-4elem-a` → "4° Básico A"

## Frontend Implementation (TODO)

### Pages to Create

1. **Teacher Classes Page** (`/classes`)
   - Card/table view of all classes
   - Show next session, roster size
   - Link to session log

2. **Class Sessions Page** (`/classes/:classId/sessions`)
   - Table of sessions with date/time and attendance counts
   - Action to open session detail

3. **Session Detail Page** (`/sessions/:sessionId`)
   - Roster table with status, confidence
   - Override controls for teachers
   - Display capture metadata and photos

4. **Student Profile Page** (`/students/:id`)
   - Hero section with student info + guardian
   - **Tabs:**
     - Attendance history (with filter controls)
     - Classes enrolled
     - Notes (future)
5. **Shared Components**
   - Filter components (teacher/time range/status chips)
   - Attendance status badges
   - Override modal

### Routes to Add

```typescript
{
  path: "/classes",
  element: <TeacherClassesPage />,
},
{
  path: "/classes/:classId/sessions",
  element: <ClassSessionsPage />,
},
{
  path: "/sessions/:sessionId",
  element: <SessionDetailPage />,
},
{
  path: "/students/:id",
  element: <StudentProfilePage />,
},
```

### API Hooks to Create

```typescript
// useTeacherClasses.ts
const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ["teacher", teacherId, "classes"],
    queryFn: () => apiClient.get(`/classes/teacher/${teacherId}`),
  });
};

// useClassSessions.ts
const useClassSessions = (classId: string) => {
  return useQuery({
    queryKey: ["class", classId, "sessions"],
    queryFn: () => apiClient.get(`/attendance/classes/${classId}/sessions`),
  });
};

// useSessionDetail.ts
const useSessionDetail = (sessionId: string) => {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiClient.get(`/attendance/sessions/${sessionId}`),
  });
};

// useStudentAttendance.ts
const useStudentAttendance = (
  studentId: string,
  filters?: AttendanceFilters,
) => {
  return useQuery({
    queryKey: ["student", studentId, "attendance", filters],
    queryFn: () =>
      apiClient.get(`/students/${studentId}/attendance`, { params: filters }),
  });
};

// useOverrideAttendance.ts
const useOverrideAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, ...data }) =>
      apiClient.patch(`/attendance/${attendanceId}/override`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["student", "attendance"] });
    },
  });
};
```

## Enrollment Form Updates (TODO)

Update `StudentEnrollmentForm.tsx` to include:

- Grade section selector (dropdown)
- Fetch grade sections based on selected grade
- Academic year field (auto-populated or manual)

```typescript
const gradeSections = useGradeSections(selectedGradeId, academicYear);

<Select name="gradeSectionId" required>
  {gradeSections.map(section => (
    <option key={section.id} value={section.id}>
      {section.displayName}
    </option>
  ))}
</Select>
```

## i18n Updates (TODO)

Add to `apps/teacher-client/src/i18n/locales/es/`:

**students.json:**

```json
{
  "gradeSection": "Curso/Sección",
  "academicYear": "Año Académico",
  "selectGradeSection": "Seleccionar sección",
  "attendanceHistory": "Historial de Asistencia",
  "attendanceRate": "Tasa de Asistencia"
}
```

**attendance.json** (new file):

```json
{
  "sessions": "Sesiones",
  "sessionDetail": "Detalle de Sesión",
  "overrideAttendance": "Corregir Asistencia",
  "markedBy": "Marcado por",
  "auto": "Automático",
  "manual": "Manual",
  "corrected": "Corregido",
  "filters": "Filtros",
  "allClasses": "Todas las clases",
  "allSubjects": "Todas las materias",
  "allTeachers": "Todos los profesores",
  "dateRange": "Rango de fechas"
}
```

## Testing Checklist

- [ ] Run migration on local DB
- [ ] Run seed script with new grade sections
- [ ] Test GET /api/classes/teacher/:teacherId
- [ ] Test GET /api/attendance/classes/:classId/sessions
- [ ] Test GET /api/attendance/sessions/:sessionId
- [ ] Test PATCH /api/attendance/:attendanceId/override
- [ ] Test GET /api/students/:studentId/attendance (no filters)
- [ ] Test GET /api/students/:studentId/attendance with classId filter
- [ ] Test GET /api/students/:studentId/attendance with date range
- [ ] Create sample sessions and attendance records
- [ ] Frontend: Create all pages
- [ ] Frontend: Test drill-down navigation flow
- [ ] Frontend: Test override functionality
- [ ] Frontend: Test student history filters

## Use Case Flow

### Primary Flow: Teacher Drill-Down

1. Teacher logs in → navigates to `/classes`
2. Sees list of their classes (Math 1M-A, Physics 1M-A, etc.)
3. Clicks on "Math 1M-A" → navigates to `/classes/:classId/sessions`
4. Sees chronological list of sessions with attendance summaries
5. Clicks on specific session → navigates to `/sessions/:sessionId`
6. Sees roster table with each student's status, confidence, photos
7. Clicks "Override" next to a student → opens modal
8. Changes status from "absent" to "present", adds note, submits
9. Record is updated with `corrected: true`, `correctedAt`, `correctedBy`
10. Clicks student name → navigates to `/students/:id`
11. Sees student profile with attendance history tab
12. Uses filters to view attendance for specific class/date range
13. Sees summary stats (90% attendance rate, 2 absences this month)

## Next Steps

1. **Run the migration** to update your local database
2. **Re-seed the database** to populate grade sections
3. **Test API endpoints** using curl or Postman
4. **Create frontend pages** following the implementation guide
5. **Update enrollment forms** to include grade section selector
6. **Add i18n strings** for new UI elements
7. **Update navigation** to include new routes

## Notes

- **Grade Section is Optional:** The `gradeSectionId` field on students is nullable to support legacy data and students not in homerooms
- **Academic Year:** We're using string format "2024-2025" for flexibility
- **Indices:** Composite indices on frequently-queried columns significantly improve performance
- **Backfill Strategy:** The migration automatically creates default sections and assigns existing students
- **Override Tracking:** The `correctedAt` and `correctedBy` fields provide audit trail for manual corrections

## Future Enhancements

- [ ] Export attendance data to CSV/Excel
- [ ] Bulk override (mark multiple students at once)
- [ ] Attendance trends/analytics dashboard
- [ ] Email notifications for attendance issues
- [ ] Integration with parent portal
- [ ] Attendance reports by grade section
- [ ] Automated attendance alerts (e.g., 3+ absences)
