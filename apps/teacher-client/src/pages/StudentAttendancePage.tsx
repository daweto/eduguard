import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { AttendanceDataTable } from "@/components/attendance/attendance-data-table";
import { columns } from "@/components/attendance/columns";
import { StudentInfoCard } from "@/components/students/StudentInfoCard";
import type {
  StudentAttendanceResponse,
  AttendanceRecord,
} from "@/types/attendance";
import type { Student } from "@/types/student";
import { getStudent } from "@/lib/api/students";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export default function StudentAttendancePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentAttendanceResponse | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchData(studentId);
    }
  }, [studentId]);

  const fetchData = async (id: string) => {
    try {
      setIsLoading(true);

      // Fetch both student info and attendance data in parallel
      const [attendanceResponse, studentData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/students/${id}/attendance`).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch attendance data");
          return res.json();
        }),
        getStudent(id),
      ]);

      setData(attendanceResponse);
      setStudent(studentData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-700">
              {error || "No se encontró información del estudiante"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/students")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Estudiantes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, records } = data;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/students")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Estudiantes
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Registro de Asistencia</h1>
            <p className="text-muted-foreground">
              Historial completo de asistencia del estudiante
            </p>
          </div>
          <Badge
            variant={summary.attendanceRate >= 80 ? "default" : "destructive"}
            className="text-lg px-4 py-2"
          >
            {summary.attendanceRate}% Asistencia
          </Badge>
        </div>

        {/* Student Info Card */}
        {student && <StudentInfoCard student={student} className="mb-6" />}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registros
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sesiones registradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Presente
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summary.present}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {summary.total > 0
                ? Math.round((summary.present / summary.total) * 100)
                : 0}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              Ausente
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {summary.absent}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {summary.total > 0
                ? Math.round((summary.absent / summary.total) * 100)
                : 0}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Otros
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {summary.late + summary.excused}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {summary.late} tarde, {summary.excused} justificado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Detallado</CardTitle>
          <CardDescription>
            {records.length} registros de asistencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceDataTable
            columns={columns}
            data={records as AttendanceRecord[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
