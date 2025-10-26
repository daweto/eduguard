"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Eye } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Type for class sessions
export interface ClassSessionRecord {
  id: string;
  timestamp: string;
  expectedStudents: number | null;
  attendanceSummary: {
    present: number;
    absent: number;
    excused: number;
    late: number;
    total: number;
  };
}

interface ClassSessionColumnsParams {
  onViewSession: (sessionId: string) => void;
}

export function createClassSessionColumns({
  onViewSession,
}: ClassSessionColumnsParams): ColumnDef<ClassSessionRecord>[] {
  return [
    {
      accessorKey: "timestamp",
      id: "timestamp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha y Hora" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {format(date, "d 'de' MMMM, yyyy", { locale: es })}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(date, "HH:mm")}
              </div>
            </div>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        return new Date(rowA.original.timestamp).getTime() - new Date(rowB.original.timestamp).getTime();
      },
    },
    {
      accessorKey: "expectedStudents",
      id: "expected",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Esperados" />
      ),
      cell: ({ row }) => {
        const { total } = row.original.attendanceSummary;
        const expected = row.original.expectedStudents || total;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            {expected}
          </div>
        );
      },
    },
    {
      accessorKey: "attendanceSummary.present",
      id: "present",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Presentes" />
      ),
      cell: ({ row }) => {
        const present = row.original.attendanceSummary.present;
        return <span className="font-medium text-green-600">{present}</span>;
      },
    },
    {
      accessorKey: "attendanceSummary.absent",
      id: "absent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ausentes" />
      ),
      cell: ({ row }) => {
        const absent = row.original.attendanceSummary.absent;
        return <span className="font-medium text-red-600">{absent}</span>;
      },
    },
    {
      accessorKey: "attendanceSummary.excused",
      id: "excused",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Justificados" />
      ),
      cell: ({ row }) => {
        const excused = row.original.attendanceSummary.excused;
        return <span className="font-medium text-blue-600">{excused}</span>;
      },
    },
    {
      accessorKey: "attendanceSummary.late",
      id: "late",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tarde" />
      ),
      cell: ({ row }) => {
        const late = row.original.attendanceSummary.late;
        return <span className="font-medium text-yellow-600">{late}</span>;
      },
    },
    {
      id: "attendanceRate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tasa" />
      ),
      cell: ({ row }) => {
        const { present, late, total } = row.original.attendanceSummary;
        const attendanceRate = total > 0
          ? Math.round(((present + late) / total) * 100)
          : 0;

        const colorClass =
          attendanceRate >= 90
            ? 'text-green-600'
            : attendanceRate >= 75
              ? 'text-yellow-600'
              : 'text-red-600';

        return (
          <span className={`font-medium ${colorClass}`}>
            {attendanceRate}%
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const rateA = rowA.original.attendanceSummary.total > 0
          ? ((rowA.original.attendanceSummary.present + rowA.original.attendanceSummary.late) / rowA.original.attendanceSummary.total) * 100
          : 0;
        const rateB = rowB.original.attendanceSummary.total > 0
          ? ((rowB.original.attendanceSummary.present + rowB.original.attendanceSummary.late) / rowB.original.attendanceSummary.total) * 100
          : 0;
        return rateA - rateB;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewSession(row.original.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalle
            </Button>
          </div>
        );
      },
    },
  ];
}
