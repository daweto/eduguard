import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Clock, User, AlertCircle } from "lucide-react";
import { RiskBadge } from "@/components/attendance/RiskBadge";
import { type Call as CallType } from "@repo/shared-types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

export default function CallsHistoryPage() {
  const [calls, setCalls] = useState<CallType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/voice/calls`);

      if (!response.ok) {
        throw new Error("Failed to fetch calls");
      }

      const data = await response.json();
      setCalls(data.calls || []);
    } catch (err) {
      console.error("Error fetching calls:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historial de Llamadas</h1>
        <p className="text-muted-foreground">
          Registro de todas las llamadas realizadas a apoderados
        </p>
      </div>

      {calls.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No hay llamadas registradas
              </h3>
              <p className="text-sm text-muted-foreground">
                Las llamadas a apoderados aparecerán aquí
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => (
            <Card key={call.call_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5" />
                      {call.student_name || "Estudiante"}
                    </CardTitle>
                    <CardDescription>
                      {call.guardian_name ? (
                        <span>
                          Apoderado: {call.guardian_name} ({call.guardian_phone}
                          )
                        </span>
                      ) : (
                        <span>{call.guardian_phone}</span>
                      )}
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
                    <span className="text-muted-foreground">Iniciada por:</span>
                    <span className="font-medium">
                      {call.initiated_by === "manual" ? "Manual" : "Automática"}
                    </span>
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
                  <div className="mt-4">
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Escuchar grabación →
                    </a>
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
