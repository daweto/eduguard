import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Eye, Calendar, Users } from "lucide-react";
import { useClassSessions } from "@/components/classes/hooks/useClassSessions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ClassSessionsPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useClassSessions(classId!);

  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
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
              No se pudieron cargar las sesiones. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/classes")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Clases
        </Button>
        <h1 className="text-3xl font-bold mb-2">Sesiones de Asistencia</h1>
        <p className="text-muted-foreground">
          Historial de sesiones para esta clase
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas las Sesiones</CardTitle>
              <CardDescription>
                {sessions.length} {sessions.length === 1 ? "sesión registrada" : "sesiones registradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones registradas para esta clase
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Esperados</TableHead>
                  <TableHead>Presentes</TableHead>
                  <TableHead>Ausentes</TableHead>
                  <TableHead>Justificados</TableHead>
                  <TableHead>Tarde</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const { present, absent, excused, late, total } = session.attendanceSummary;
                  const attendanceRate = total > 0 
                    ? Math.round(((present + late) / total) * 100)
                    : 0;

                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(session.timestamp), "d 'de' MMMM, yyyy", { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(session.timestamp), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {session.expectedStudents || total}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">{present}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">{absent}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">{excused}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-yellow-600">{late}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${attendanceRate >= 90 ? 'text-green-600' : attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {attendanceRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSession(session.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

