// Types for student attendance records

export interface AttendanceRecord {
  attendance: {
    id: string;
    status: "present" | "absent" | "excused" | "late";
    confidence: number | null;
    markedAt: string;
    markedBy: string;
    corrected: boolean;
    correctedAt: string | null;
    correctedBy: string | null;
    notes: string | null;
  };
  session: {
    id: string;
    timestamp: string;
  };
  class: {
    id: string;
    section: string;
    period: number;
  };
  course: {
    id: string;
    name: string;
    subject: string;
    courseCode: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  attendanceRate: number;
}

export interface StudentAttendanceResponse {
  student_id: string;
  summary: AttendanceSummary;
  records: AttendanceRecord[];
  filters: {
    classId: string | null;
    courseId: string | null;
    subject: string | null;
    teacherId: string | null;
    from: string | null;
    to: string | null;
    status: string | null;
  };
}
