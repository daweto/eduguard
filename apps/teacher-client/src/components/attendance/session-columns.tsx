"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";
import { AttendanceStatusBadge } from "@/components/ui/attendance-status-badge";
import { CallParentButton } from "./CallParentButton";
import { formatRut } from "@/lib/helpers/rut";

// Type for session detail attendance records
export interface SessionAttendanceRecord {
  student: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    identificationNumber: string;
  };
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  attendance: {
    id: string;
    status: "present" | "absent" | "excused" | "late";
    confidence: number | null;
    markedBy: string | null;
    corrected: boolean;
    notes: string | null;
  };
}

interface SessionColumnsParams {
  onEdit: (
    attendanceId: string,
    currentStatus: string,
    studentName: string,
  ) => void;
  sessionId: string;
}

export function createSessionColumns({
  onEdit,
  sessionId,
}: SessionColumnsParams): ColumnDef<SessionAttendanceRecord>[] {
  return [
    {
      accessorKey: "student",
      id: "student",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estudiante" />
      ),
      cell: ({ row }) => {
        const student = row.original.student;
        const fullName =
          `${student.firstName} ${student.middleName || ""} ${student.lastName} ${student.secondLastName || ""}`.trim();
        return <div className="font-medium min-w-[200px]">{fullName}</div>;
      },
      filterFn: (row, id, value) => {
        const student = row.original.student;
        const fullName =
          `${student.firstName} ${student.middleName || ""} ${student.lastName} ${student.secondLastName || ""}`.toLowerCase();
        return fullName.includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "student.identificationNumber",
      id: "rut",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="RUT" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground min-w-[100px]">
            {formatRut(row.original.student.identificationNumber)}
          </div>
        );
      },
    },
    {
      accessorKey: "attendance.status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const att = row.original.attendance;
        return (
          <AttendanceStatusBadge
            status={att.status}
            corrected={att.corrected}
          />
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.original.attendance.status);
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
        if (confidence === null) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <span className="text-sm text-muted-foreground">
            {Math.round(confidence)}%
          </span>
        );
      },
    },
    {
      accessorKey: "attendance.markedBy",
      id: "markedBy",
      header: "Marcado por",
      cell: ({ row }) => {
        const att = row.original.attendance;
        return (
          <div>
            <span className="text-sm">
              {att.markedBy === "auto" ? "Automático" : "Manual"}
            </span>
            {att.corrected && (
              <span className="text-xs text-muted-foreground block">
                (Corregido)
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
        const student = row.original.student;
        const att = row.original.attendance;
        const fullName =
          `${student.firstName} ${student.middleName || ""} ${student.lastName} ${student.secondLastName || ""}`.trim();

        const guardian = row.original.guardian;

        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(att.id, att.status, fullName)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Corregir
            </Button>
            {/* Only show Call Parent button for absent students */}
            {att.status === "absent" && (
              <CallParentButton
                studentId={student.id}
                studentName={fullName}
                guardianPhone={guardian?.phone || undefined}
                guardianName={
                  guardian
                    ? `${guardian.firstName} ${guardian.lastName}`
                    : undefined
                }
                guardianId={guardian?.id}
                sessionId={sessionId}
                riskLevel="medium"
              />
            )}
          </div>
        );
      },
    },
  ];
}
