import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Clock,
  User,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { useTeacherContext } from "@/contexts/teacher-context";
import { RiskBadge } from "@/components/attendance/RiskBadge";
import { useVoiceCalls } from "@/components/calls/hooks/useVoiceCalls";
import type { CallStatus } from "@repo/shared-types";

export default function CallsHistoryPage() {
  const { activeTeacher } = useTeacherContext();
  const { data, isLoading, error, refetch } = useVoiceCalls();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [initiatedByFilter, setInitiatedByFilter] = useState<
    "all" | "manual" | "reasoning-auto"
  >("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  // Memoize calls to prevent dependency issues
  const calls = useMemo(() => data?.calls || [], [data?.calls]);

  // Apply filters
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Status filter
      if (statusFilter !== "all" && call.status !== statusFilter) {
        return false;
      }

      // Initiated by filter
      if (
        initiatedByFilter !== "all" &&
        call.initiated_by !== initiatedByFilter
      ) {
        return false;
      }

      // Risk filter
      if (riskFilter !== "all" && call.risk_level !== riskFilter) {
        return false;
      }

      return true;
    });
  }, [calls, statusFilter, initiatedByFilter, riskFilter]);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setInitiatedByFilter("all");
    setRiskFilter("all");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    initiatedByFilter !== "all" ||
    riskFilter !== "all";

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      initiated: { label: "Iniciada", variant: "secondary" },
      ringing: { label: "Timbrando", variant: "default" },
      answered: { label: "Contestada", variant: "default" },
      voicemail: { label: "Buzón", variant: "secondary" },
      failed: { label: "Fallida", variant: "destructive" },
      completed: { label: "Completada", variant: "default" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
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
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-700">
              No se pudieron cargar las llamadas. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historial de Llamadas</h1>
        <p className="text-muted-foreground">
          Registro de todas las llamadas realizadas a apoderados (
          {filteredCalls.length} de {calls.length})
        </p>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="status-filter">Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as CallStatus | "all")}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="initiated">Iniciada</SelectItem>
                  <SelectItem value="ringing">Timbrando</SelectItem>
                  <SelectItem value="answered">Contestada</SelectItem>
                  <SelectItem value="voicemail">Buzón</SelectItem>
                  <SelectItem value="failed">Fallida</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="initiated-filter">Iniciada Por</Label>
              <Select
                value={initiatedByFilter}
                onValueChange={(value) =>
                  setInitiatedByFilter(
                    value as "all" | "manual" | "reasoning-auto",
                  )
                }
              >
                <SelectTrigger id="initiated-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="manual">Manual (Docente)</SelectItem>
                  <SelectItem value="reasoning-auto">Automática (IA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="risk-filter">Nivel de Riesgo</Label>
              <Select
                value={riskFilter}
                onValueChange={setRiskFilter}
              >
                <SelectTrigger id="risk-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                  <SelectItem value="none">Ninguno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar Filtros
              </Button>
            )}
            <Button onClick={() => refetch()} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {calls.length === 0
                  ? "No hay llamadas registradas"
                  : "No se encontraron llamadas con los filtros seleccionados"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {calls.length === 0
                  ? "Las llamadas a apoderados aparecerán aquí"
                  : "Intenta ajustar los filtros para ver más resultados"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <Card key={call.call_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5" />
                      {call.guardian_name || call.guardian_phone}
                    </CardTitle>
                    <CardDescription>
                      <span>
                        Estudiante: {call.student_name || "Estudiante"}
                        {call.guardian_phone ? ` (${call.guardian_phone})` : ""}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {call.risk_level && (
                      <RiskBadge riskLevel={call.risk_level} />
                    )}
                    {getStatusBadge(call.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Gatillada por:
                    </span>
                    {call.initiated_by === "manual" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium">
                          {activeTeacher?.fullName || "Docente"}
                        </span>
                        <Badge variant="secondary">Docente</Badge>
                      </span>
                    ) : (
                      <span className="font-medium">Automática</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duración:</span>
                    <span className="font-medium">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">
                      {formatDate(call.created_at)}
                    </span>
                  </div>
                </div>

                {call.dtmf_response && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold">Respuesta DTMF:</span>{" "}
                      {call.dtmf_response}
                    </div>
                  </div>
                )}

                {call.transcript && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold">Transcripción:</span>
                      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                        {call.transcript}
                      </p>
                    </div>
                  </div>
                )}

                {call.recording_url && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Grabación:</span>
                      <a
                        href={call.recording_url}
                        download
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Descargar
                      </a>
                    </div>
                    <audio
                      controls
                      className="w-full h-10"
                      src={call.recording_url}
                    >
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
