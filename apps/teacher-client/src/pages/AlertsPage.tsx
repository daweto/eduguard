import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { useReasoningFlags } from "@/components/alerts/hooks/useReasoningFlags";
import { AlertsDataTable } from "@/components/alerts/alerts-data-table";
import { alertsColumns } from "@/components/alerts/alerts-columns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AlertsPage() {
  // Default to today
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const { data, isLoading, error, refetch } = useReasoningFlags({
    from: dateFrom,
    to: dateTo,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setDateFrom(today);
    setDateTo(today);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    setDateFrom(format(weekStart, "yyyy-MM-dd"));
    setDateTo(format(today, "yyyy-MM-dd"));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-700">
              No se pudieron cargar las alertas. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const flags = data?.flags || [];
  const total = data?.total || 0;

  // Calculate risk summary
  const riskSummary = {
    high: flags.filter((f) => f.riskLabel === "high").length,
    medium: flags.filter((f) => f.riskLabel === "medium").length,
    low: flags.filter((f) => f.riskLabel === "low").length,
    none: flags.filter((f) => f.riskLabel === "none").length,
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Alertas de Riesgo
        </h1>
        <p className="text-muted-foreground">
          Estudiantes con patrones de asistencia que requieren atención
        </p>
      </div>

      {/* Date Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleToday} variant="outline" size="sm">
                Hoy
              </Button>
              <Button onClick={handleThisWeek} variant="outline" size="sm">
                Esta Semana
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(dateFrom), "d MMM", { locale: es })} -{" "}
              {format(new Date(dateTo), "d MMM", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Riesgo Alto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {riskSummary.high}
            </div>
            <p className="text-xs text-red-600 mt-1">Acción inmediata</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Riesgo Medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {riskSummary.medium}
            </div>
            <p className="text-xs text-amber-600 mt-1">Monitorear</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Riesgo Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {riskSummary.low}
            </div>
            <p className="text-xs text-blue-600 mt-1">Seguimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas</CardTitle>
          <CardDescription>
            {total === 0
              ? "No hay alertas para el rango de fechas seleccionado"
              : `${total} estudiante${total !== 1 ? "s" : ""} con alertas de riesgo`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertsDataTable columns={alertsColumns} data={flags} />
        </CardContent>
      </Card>
    </div>
  );
}
