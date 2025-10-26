import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useClassSessions } from "@/components/classes/hooks/useClassSessions";
import { SessionsListDataTable } from "@/components/attendance/sessions-list-data-table";
import {
  createClassSessionColumns,
  type ClassSessionRecord,
} from "@/components/attendance/class-sessions-columns";

export function ClassSessionsPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useClassSessions(classId!);

  // Create columns with handlers (must be before early returns)
  const columns = useMemo(
    () =>
      createClassSessionColumns({
        onViewSession: (sessionId: string) => {
          navigate(`/sessions/${sessionId}`);
        },
      }),
    [navigate],
  );

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
                {sessions.length}{" "}
                {sessions.length === 1
                  ? "sesión registrada"
                  : "sesiones registradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionsListDataTable
            columns={columns}
            data={sessions as ClassSessionRecord[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
