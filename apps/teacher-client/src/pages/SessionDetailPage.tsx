import { useState } from "react";
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
import { ArrowLeft, Edit2, Users, CheckCircle2, XCircle } from "lucide-react";
import { useSessionDetail } from "@/components/classes/hooks/useSessionDetail";
import { useOverrideAttendance } from "@/components/classes/hooks/useOverrideAttendance";
import { AttendanceStatusBadge } from "@/components/ui/attendance-status-badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OverrideDialogState {
  open: boolean;
  attendanceId: string | null;
  currentStatus: string | null;
  studentName: string | null;
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSessionDetail(sessionId!);
  const overrideMutation = useOverrideAttendance();

  const [overrideDialog, setOverrideDialog] = useState<OverrideDialogState>({
    open: false,
    attendanceId: null,
    currentStatus: null,
    studentName: null,
  });
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleOpenOverrideDialog = (attendanceId: string, currentStatus: string, studentName: string) => {
    setOverrideDialog({
      open: true,
      attendanceId,
      currentStatus,
      studentName,
    });
    setNewStatus(currentStatus);
    setNotes("");
  };

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
        teacher_id: "teacher-001", // TODO: Get from auth context
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          handleCloseOverrideDialog();
        },
      }
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
              No se pudo cargar el detalle de la sesión. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { session, attendance } = data;
  const summary = {
    present: attendance.filter((a) => a.attendance.status === "present").length,
    absent: attendance.filter((a) => a.attendance.status === "absent").length,
    excused: attendance.filter((a) => a.attendance.status === "excused").length,
    late: attendance.filter((a) => a.attendance.status === "late").length,
    total: attendance.length,
  };

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold mb-2">Detalle de Sesión</h1>
          <p className="text-muted-foreground">
            {format(new Date(session.timestamp), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
              locale: es,
            })}
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
                <span className="text-2xl font-bold text-green-600">{summary.present}</span>
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
                <span className="text-2xl font-bold text-red-600">{summary.absent}</span>
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
                  ? Math.round(((summary.present + summary.late) / summary.total) * 100)
                  : 0}
                %
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Roster */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Asistencia</CardTitle>
            <CardDescription>
              Detalle de asistencia por estudiante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Confianza</TableHead>
                  <TableHead>Marcado por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => {
                  const student = record.student;
                  const att = record.attendance;
                  const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName} ${student.secondLastName || ""}`.trim();

                  return (
                    <TableRow key={att.id}>
                      <TableCell className="font-medium">{fullName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.identificationNumber}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadge
                          status={att.status as "present" | "absent" | "excused" | "late"}
                          corrected={att.corrected}
                        />
                      </TableCell>
                      <TableCell>
                        {att.confidence !== null ? (
                          <span className="text-sm text-muted-foreground">
                            {Math.round(att.confidence)}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {att.markedBy === "auto" ? "Automático" : "Manual"}
                        </span>
                        {att.corrected && (
                          <span className="text-xs text-muted-foreground block">
                            (Corregido)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleOpenOverrideDialog(att.id, att.status, fullName)
                          }
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Corregir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialog.open} onOpenChange={handleCloseOverrideDialog}>
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

