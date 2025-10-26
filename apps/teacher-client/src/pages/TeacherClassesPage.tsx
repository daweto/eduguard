import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Users, Clock, MapPin, BookOpen, History } from "lucide-react";
import {
  useTeacherClasses,
  type TeacherClass,
} from "@/components/classes/hooks/useTeacherClasses";
import { useTeacherContext } from "@/contexts/teacher-context";

export function TeacherClassesPage() {
  const navigate = useNavigate();
  const { activeTeacherId } = useTeacherContext();
  const { classes, isLoading, error } = useTeacherClasses(activeTeacherId);

  const handleTakeAttendance = (classId: string) => {
    navigate(`/attendance/class/${classId}`);
  };

  const handleViewSessions = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/classes/${classId}/sessions`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription className="text-red-700">
              No se pudieron cargar las clases. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const todayClasses = classes?.classes || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Clases</h1>
        <p className="text-muted-foreground">
          Selecciona una clase para tomar asistencia
        </p>
      </div>

      {todayClasses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay clases asignadas</CardTitle>
            <CardDescription>
              No tienes clases asignadas en este momento.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {todayClasses.map((cls: TeacherClass) => (
            <Card
              key={cls.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTakeAttendance(cls.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">
                      {cls.course.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Sección {cls.section} · Período {cls.period}
                    </CardDescription>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {cls.startTime} - {cls.endTime}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {cls.classroom.name} - {cls.classroom.building}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {cls.enrolledStudents} / {cls.maxStudents} estudiantes
                </div>
                <div className="pt-3 border-t space-y-2">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTakeAttendance(cls.id);
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Tomar Asistencia
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => handleViewSessions(cls.id, e)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Ver Sesiones
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
