import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import {
  classes as classesTable,
  courses as coursesTable,
  teachers as teachersTable,
  classrooms as classroomsTable,
  classEnrollments as enrollmentsTable,
  students as studentsTable,
  legalGuardians as guardiansTable,
  studentFaces as facesTable,
} from "../db/schema";
import type { Bindings } from "../types";

const classes = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/classes/teacher/:teacherId
 * Get all classes taught by a specific teacher
 */
classes.get("/teacher/:teacherId", async (c) => {
  try {
    const teacherId = c.req.param("teacherId");
    const db = drizzle(c.env.DB);

    // Fetch classes with course, teacher, and classroom details
    const teacherClasses = await db
      .select({
        id: classesTable.id,
        section: classesTable.section,
        period: classesTable.period,
        scheduleDay: classesTable.scheduleDay,
        startTime: classesTable.startTime,
        endTime: classesTable.endTime,
        academicYear: classesTable.academicYear,
        semester: classesTable.semester,
        maxStudents: classesTable.maxStudents,
        status: classesTable.status,
        course: {
          id: coursesTable.id,
          courseCode: coursesTable.courseCode,
          name: coursesTable.name,
          subject: coursesTable.subject,
          gradeLevel: coursesTable.gradeLevel,
        },
        classroom: {
          id: classroomsTable.id,
          name: classroomsTable.name,
          building: classroomsTable.building,
          capacity: classroomsTable.capacity,
        },
        teacher: {
          id: teachersTable.id,
          firstName: teachersTable.firstName,
          lastName: teachersTable.lastName,
          secondLastName: teachersTable.secondLastName,
        },
      })
      .from(classesTable)
      .innerJoin(coursesTable, eq(classesTable.courseId, coursesTable.id))
      .innerJoin(
        classroomsTable,
        eq(classesTable.classroomId, classroomsTable.id),
      )
      .innerJoin(teachersTable, eq(classesTable.teacherId, teachersTable.id))
      .where(eq(classesTable.teacherId, teacherId));

    // Get enrollment counts for each class
    const classesWithCounts = await Promise.all(
      teacherClasses.map(async (cls) => {
        const enrollments = await db
          .select({ studentId: enrollmentsTable.studentId })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.classId, cls.id),
              eq(enrollmentsTable.status, "active"),
            ),
          );

        return {
          ...cls,
          enrolledStudents: enrollments.length,
          displayName: `${cls.course.name} - Sección ${cls.section}`,
        };
      }),
    );

    return c.json({
      teacher_id: teacherId,
      classes: classesWithCounts,
      total: classesWithCounts.length,
    });
  } catch (error) {
    console.error("/classes/teacher/:teacherId error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/classes/:classId/students
 * Get all students enrolled in a specific class
 */
classes.get("/:classId/students", async (c) => {
  try {
    const classId = c.req.param("classId");
    const db = drizzle(c.env.DB);

    // Get class details first
    const classDetails = await db
      .select({
        id: classesTable.id,
        section: classesTable.section,
        period: classesTable.period,
        course: {
          name: coursesTable.name,
          subject: coursesTable.subject,
        },
        classroom: {
          name: classroomsTable.name,
          building: classroomsTable.building,
        },
      })
      .from(classesTable)
      .innerJoin(coursesTable, eq(classesTable.courseId, coursesTable.id))
      .innerJoin(
        classroomsTable,
        eq(classesTable.classroomId, classroomsTable.id),
      )
      .where(eq(classesTable.id, classId))
      .limit(1);

    if (classDetails.length === 0) {
      return c.json({ error: "Class not found" }, 404);
    }

    // Get enrolled students with guardian info and face count
    const enrolledStudents = await db
      .select({
        enrollment: {
          id: enrollmentsTable.id,
          enrolledDate: enrollmentsTable.enrolledDate,
          status: enrollmentsTable.status,
        },
        student: {
          id: studentsTable.id,
          firstName: studentsTable.firstName,
          middleName: studentsTable.middleName,
          lastName: studentsTable.lastName,
          secondLastName: studentsTable.secondLastName,
          identificationNumber: studentsTable.identificationNumber,
          gradeId: studentsTable.gradeId,
        },
        guardian: {
          id: guardiansTable.id,
          firstName: guardiansTable.firstName,
          lastName: guardiansTable.lastName,
          phone: guardiansTable.phone,
          email: guardiansTable.email,
        },
      })
      .from(enrollmentsTable)
      .innerJoin(
        studentsTable,
        eq(enrollmentsTable.studentId, studentsTable.id),
      )
      .innerJoin(
        guardiansTable,
        eq(studentsTable.guardianId, guardiansTable.id),
      )
      .where(
        and(
          eq(enrollmentsTable.classId, classId),
          eq(enrollmentsTable.status, "active"),
        ),
      );

    // Get face count for each student
    const studentsWithFaces = await Promise.all(
      enrolledStudents.map(async (record) => {
        const faces = await db
          .select({ id: facesTable.id })
          .from(facesTable)
          .where(eq(facesTable.studentId, record.student.id));

        return {
          ...record,
          faceCount: faces.length,
          fullName:
            `${record.student.firstName} ${record.student.middleName ?? ""} ${record.student.lastName} ${record.student.secondLastName ?? ""}`.trim(),
        };
      }),
    );

    return c.json({
      class: classDetails[0],
      students: studentsWithFaces,
      total: studentsWithFaces.length,
    });
  } catch (error) {
    console.error("/classes/:classId/students error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/classes/:classId
 * Get details of a specific class
 */
classes.get("/:classId", async (c) => {
  try {
    const classId = c.req.param("classId");
    const db = drizzle(c.env.DB);

    const classDetails = await db
      .select({
        id: classesTable.id,
        section: classesTable.section,
        period: classesTable.period,
        scheduleDay: classesTable.scheduleDay,
        startTime: classesTable.startTime,
        endTime: classesTable.endTime,
        academicYear: classesTable.academicYear,
        semester: classesTable.semester,
        maxStudents: classesTable.maxStudents,
        status: classesTable.status,
        course: coursesTable,
        classroom: classroomsTable,
        teacher: teachersTable,
      })
      .from(classesTable)
      .innerJoin(coursesTable, eq(classesTable.courseId, coursesTable.id))
      .innerJoin(
        classroomsTable,
        eq(classesTable.classroomId, classroomsTable.id),
      )
      .innerJoin(teachersTable, eq(classesTable.teacherId, teachersTable.id))
      .where(eq(classesTable.id, classId))
      .limit(1);

    if (classDetails.length === 0) {
      return c.json({ error: "Class not found" }, 404);
    }

    return c.json(classDetails[0]);
  } catch (error) {
    console.error("/classes/:classId error", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default classes;
