"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";
import type { AttendanceRecord } from "@/types/attendance";

export const columns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "session.timestamp",
    id: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.session.timestamp);
      return (
        <div className="w-[140px]">
          <div className="font-medium">
            {date.toLocaleDateString("es-CL", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "course.name",
    id: "course",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asignatura" />
    ),
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{row.original.course.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.course.courseCode} · Sección {row.original.class.section}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.course.name);
    },
  },
  {
    accessorKey: "course.subject",
    id: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Materia" />
    ),
    cell: ({ row }) => {
      return <div className="w-[100px]">{row.original.course.subject}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.course.subject);
    },
  },
  {
    accessorKey: "attendance.status",
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.original.attendance.status;
      const statusConfig = {
        present: {
          label: "Presente",
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-300",
        },
        absent: {
          label: "Ausente",
          variant: "destructive" as const,
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-300",
        },
        late: {
          label: "Tarde",
          variant: "secondary" as const,
          icon: Clock,
          className: "bg-amber-100 text-amber-800 border-amber-300",
        },
        excused: {
          label: "Justificado",
          variant: "outline" as const,
          icon: AlertCircle,
          className: "bg-blue-100 text-blue-800 border-blue-300",
        },
      };

      const config = statusConfig[status] || statusConfig.absent;
      const Icon = config.icon;

      return (
        <Badge variant={config.variant} className={config.className}>
          <Icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.attendance.status);
    },
  },
  {
    accessorKey: "teacher",
    id: "teacher",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Profesor" />
    ),
    cell: ({ row }) => {
      const teacher = row.original.teacher;
      return (
        <div className="w-[140px]">
          {teacher.firstName} {teacher.lastName}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const teacherName = `${row.original.teacher.firstName} ${row.original.teacher.lastName}`;
      return value.some((v: string) => teacherName.includes(v));
    },
  },
  {
    accessorKey: "class.period",
    id: "period",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Período" />
    ),
    cell: ({ row }) => {
      return <div className="w-[70px] text-center">{row.original.class.period}</div>;
    },
  },
  {
    accessorKey: "attendance.confidence",
    id: "confidence",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Confianza" />
    ),
    cell: ({ row }) => {
      const confidence = row.original.attendance.confidence;
      if (confidence === null) return <div className="text-muted-foreground text-center">-</div>;

      const confidenceColor =
        confidence >= 95
          ? "text-green-600"
          : confidence >= 80
            ? "text-amber-600"
            : "text-red-600";

      return (
        <div className={`w-[80px] text-center font-medium ${confidenceColor}`}>
          {confidence.toFixed(1)}%
        </div>
      );
    },
  },
  {
    accessorKey: "attendance.corrected",
    id: "corrected",
    header: "Corregido",
    cell: ({ row }) => {
      const corrected = row.original.attendance.corrected;
      return corrected ? (
        <Badge variant="secondary" className="text-xs">
          Corregido
        </Badge>
      ) : null;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.session.id)}
            >
              Copiar ID de sesión
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalle de sesión</DropdownMenuItem>
            <DropdownMenuItem>Ver fotos</DropdownMenuItem>
            {record.attendance.notes && (
              <DropdownMenuItem>Ver notas</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
