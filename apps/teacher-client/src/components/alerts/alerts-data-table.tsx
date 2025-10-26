"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, AlertCircle, Info, ShieldCheck, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/attendance/data-table-pagination";
import { DataTableViewOptions } from "@/components/attendance/data-table-view-options";
import { DataTableFacetedFilter } from "@/components/attendance/data-table-faceted-filter";

interface AlertsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function AlertsDataTable<TData, TValue>({
  columns,
  data,
}: AlertsDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "riskLabel", desc: true }, // Default sort by risk level descending
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  // Risk level filter options
  const riskLevelOptions = [
    {
      value: "high",
      label: "Alto",
      icon: AlertTriangle,
    },
    {
      value: "medium",
      label: "Medio",
      icon: AlertCircle,
    },
    {
      value: "low",
      label: "Bajo",
      icon: Info,
    },
    {
      value: "none",
      label: "Ninguno",
      icon: ShieldCheck,
    },
  ];

  // Pattern type filter options
  const patternTypeOptions = [
    {
      value: "sneak_out",
      label: "Salida Temprana",
    },
    {
      value: "chronic",
      label: "Ausencias Crónicas",
    },
    {
      value: "irregular",
      label: "Irregular",
    },
    {
      value: "cutting",
      label: "Fuga de Clases",
    },
    {
      value: "normal",
      label: "Normal",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Student name filter */}
          <Input
            placeholder="Filtrar por estudiante..."
            value={
              (table.getColumn("studentName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("studentName")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />

          {/* Risk level filter */}
          {table.getColumn("riskLabel") && (
            <DataTableFacetedFilter
              column={table.getColumn("riskLabel")}
              title="Riesgo"
              options={riskLevelOptions}
            />
          )}

          {/* Pattern type filter */}
          {table.getColumn("patternType") && (
            <DataTableFacetedFilter
              column={table.getColumn("patternType")}
              title="Patrón"
              options={patternTypeOptions}
            />
          )}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Limpiar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron alertas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
