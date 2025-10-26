import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useSessionDetail } from "@/components/classes/hooks/useSessionDetail";
import { useOverrideAttendance } from "@/components/classes/hooks/useOverrideAttendance";
import { useReasoningFlags } from "@/components/alerts/hooks/useReasoningFlags";
import { RiskBadge } from "@/components/attendance/RiskBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SessionDataTable } from "@/components/attendance/session-data-table";
import {
  createSessionColumns,
  type SessionAttendanceRecord,
} from "@/components/attendance/session-columns";
import { useTeacherContext } from "@/contexts/teacher-context";

interface OverrideDialogState {
  open: boolean;
  attendanceId: string | null;
  currentStatus: string | null;
  studentName: string | null;
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { activeTeacherId } = useTeacherContext();
  const { data, isLoading, error } = useSessionDetail(sessionId!);
  const overrideMutation = useOverrideAttendance();

  // Fetch reasoning flags for the session date
  const sessionDate = data?.session?.timestamp
    ? format(new Date(data.session.timestamp), "yyyy-MM-dd")
    : undefined;
  const { data: flagsData } = useReasoningFlags({
    from: sessionDate,
    to: sessionDate,
  });

  const [overrideDialog, setOverrideDialog] = useState<OverrideDialogState>({
    open: false,
    attendanceId: null,
    currentStatus: null,
    studentName: null,
  });
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Create a map of student risk assessments (must be before columns)
  const riskMap = useMemo(() => {
    const map = new Map();
    if (flagsData?.flags) {
      flagsData.flags.forEach((flag) => {
        map.set(flag.studentId, flag);
      });
    }
    return map;
  }, [flagsData]);

  // Create columns with handlers (must be before early returns)
  const columns = useMemo(
    () =>
      createSessionColumns({
        onEdit: (
          attendanceId: string,
          currentStatus: string,
          studentName: string,
        ) => {
          setOverrideDialog({
            open: true,
            attendanceId,
            currentStatus,
            studentName,
          });
          setNewStatus(currentStatus);
          setNotes("");
        },
        sessionId: sessionId!,
        riskMap,
      }),
    [sessionId, riskMap],
  );

  const handleCloseOverrideDialog = () => {
    setOverrideDialog({
      open: false,
      attendanceId: null,
      currentStatus: null,
      studentName: null,
    });
    setNewStatus("");
    setNotes("");
  };

  const handleSubmitOverride = () => {
    if (!overrideDialog.attendanceId || !newStatus) return;

    overrideMutation.mutate(
      {
        attendanceId: overrideDialog.attendanceId,
        status: newStatus as "present" | "absent" | "excused" | "late",
        teacher_id: activeTeacherId,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          handleCloseOverrideDialog();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription className="text-red-700">
              No se pudo cargar el detalle de la sesión. Por favor, intenta
              nuevamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { session, attendance } = data;

  // Calculate summaries
  const summary = {
    present: attendance.filter((a) => a.attendance.status === "present").length,
    absent: attendance.filter((a) => a.attendance.status === "absent").length,
    excused: attendance.filter((a) => a.attendance.status === "excused").length,
    late: attendance.filter((a) => a.attendance.status === "late").length,
    total: attendance.length,
  };

  const riskSummary = {
    high: Array.from(riskMap.values()).filter((f) => f.riskLabel === "high")
      .length,
    medium: Array.from(riskMap.values()).filter((f) => f.riskLabel === "medium")
      .length,
    low: Array.from(riskMap.values()).filter((f) => f.riskLabel === "low")
      .length,
    total: riskMap.size,
  };

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold mb-2">Detalle de Sesión</h1>
          <p className="text-muted-foreground">
            {format(
              new Date(session.timestamp),
              "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
              {
                locale: es,
              },
            )}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Presentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {summary.present}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {summary.absent}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {summary.total > 0
                  ? Math.round(
                      ((summary.present + summary.late) / summary.total) * 100,
                    )
                  : 0}
                %
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Risk Summary Card */}
        {riskSummary.total > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                Alertas de Riesgo en esta Sesión
              </CardTitle>
              <CardDescription>
                {riskSummary.total} estudiante
                {riskSummary.total !== 1 ? "s" : ""} con evaluación de riesgo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {riskSummary.high > 0 && (
                  <div className="flex items-center gap-2">
                    <RiskBadge riskLevel="high" />
                    <span className="text-sm font-medium">
                      {riskSummary.high}
                    </span>
                  </div>
                )}
                {riskSummary.medium > 0 && (
                  <div className="flex items-center gap-2">
                    <RiskBadge riskLevel="medium" />
                    <span className="text-sm font-medium">
                      {riskSummary.medium}
                    </span>
                  </div>
                )}
                {riskSummary.low > 0 && (
                  <div className="flex items-center gap-2">
                    <RiskBadge riskLevel="low" />
                    <span className="text-sm font-medium">
                      {riskSummary.low}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Roster */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Asistencia</CardTitle>
            <CardDescription>
              Detalle de asistencia por estudiante - {attendance.length}{" "}
              registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionDataTable
              columns={columns}
              data={attendance as SessionAttendanceRecord[]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog
        open={overrideDialog.open}
        onOpenChange={handleCloseOverrideDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corregir Asistencia</DialogTitle>
            <DialogDescription>
              Modificar el estado de asistencia de {overrideDialog.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="excused">Justificado</SelectItem>
                  <SelectItem value="late">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agregar una nota sobre esta corrección..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseOverrideDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitOverride}
              disabled={!newStatus || overrideMutation.isPending}
            >
              {overrideMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
