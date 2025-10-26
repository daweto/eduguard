"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { DataTableColumnHeader } from "@/components/attendance/data-table-column-header";
import { RiskBadge } from "@/components/attendance/RiskBadge";
import { CallParentButton } from "@/components/attendance/CallParentButton";
import type { ReasoningFlagView } from "@repo/shared-types";
import { formatRut } from "@/lib/helpers/rut";
import { Link } from "react-router-dom";

// Pattern type labels in Spanish
const patternTypeLabels: Record<string, string> = {
  normal: "Normal",
  sneak_out: "Salida Temprana",
  chronic: "Ausencias Crónicas",
  irregular: "Irregular",
  cutting: "Fuga de Clases",
};

// Recommendation labels in Spanish
const recommendationLabels: Record<string, string> = {
  none: "Ninguna",
  monitor: "Monitorear",
  immediate_call: "Llamar Inmediatamente",
};

export const alertsColumns: ColumnDef<ReasoningFlagView>[] = [
  {
    accessorKey: "studentName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estudiante" />
    ),
    cell: ({ row }) => {
      const studentName = row.original.studentName;
      const identification = row.original.identification;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{studentName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRut(identification)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "riskLabel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Riesgo" />
    ),
    cell: ({ row }) => {
      const riskLabel = row.original.riskLabel;
      return <RiskBadge riskLevel={riskLabel} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "patternType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patrón" />
    ),
    cell: ({ row }) => {
      const patternType = row.original.patternType;
      if (!patternType) return <span className="text-muted-foreground">-</span>;

      const label = patternTypeLabels[patternType] || patternType;
      return (
        <Badge variant="outline" className="whitespace-nowrap">
          {label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "summary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resumen" />
    ),
    cell: ({ row }) => {
      const summary = row.original.summary;
      return (
        <div className="max-w-md">
          <p className="text-sm line-clamp-2">{summary}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "recommendation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recomendación" />
    ),
    cell: ({ row }) => {
      const recommendation = row.original.recommendation;
      const label = recommendationLabels[recommendation] || recommendation;

      const variantMap: Record<
        string,
        "default" | "secondary" | "destructive"
      > = {
        none: "secondary",
        monitor: "default",
        immediate_call: "destructive",
      };

      return (
        <Badge variant={variantMap[recommendation] || "default"}>{label}</Badge>
      );
    },
  },
  {
    accessorKey: "guardianName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Apoderado" />
    ),
    cell: ({ row }) => {
      const guardianName = row.original.guardianName;
      const guardianPhone = row.original.guardianPhone;

      if (!guardianName) {
        return <span className="text-muted-foreground">Sin apoderado</span>;
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm">{guardianName}</span>
          {guardianPhone && (
            <span className="text-xs text-muted-foreground">
              {guardianPhone}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const flag = row.original;
      const studentName = `${flag.studentName}`;

      return (
        <div className="flex items-center gap-2">
          <CallParentButton
            studentId={flag.studentId}
            studentName={studentName}
            guardianPhone={flag.guardianPhone}
            guardianName={flag.guardianName}
            guardianId={flag.studentId} // TODO: Should be guardianId from backend
            sessionId={flag.sessionId}
            riskLevel={flag.riskLabel}
            className="w-full"
          />
          {flag.sessionId && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/sessions/${flag.sessionId}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      );
    },
  },
];
