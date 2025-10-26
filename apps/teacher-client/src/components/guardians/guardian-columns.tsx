"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/attendance/data-table-column-header";
import type { LegalGuardian } from "@/types/guardian";
import { formatFullName } from "@/lib/helpers/format";
import { formatRut } from "@/lib/helpers/rut";
import { Mail, Phone, User } from "lucide-react";

export function createGuardianColumns(): ColumnDef<LegalGuardian>[] {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => {
        const fullName = formatFullName(row.original);
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const fullName = formatFullName(row.original).toLowerCase();
        return fullName.includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "identificationNumber",
      id: "identification",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="RUT" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {formatRut(row.original.identificationNumber)}
          </span>
        );
      },
    },
    {
      accessorKey: "phone",
      id: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Teléfono" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.phone}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.original.email}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return row.original.email.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "relation",
      id: "relation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Relación" />
      ),
      cell: ({ row }) => {
        const relation = row.original.relation;
        if (!relation) return <span className="text-muted-foreground">-</span>;

        // Capitalize first letter
        const formatted = relation.charAt(0).toUpperCase() + relation.slice(1);
        return <span>{formatted}</span>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.original.relation);
      },
    },
  ];
}
