"use client";

import { useMemo, useState } from "react";
import { ActionsMenu } from "./actions-menu";
import { Table, TableBody } from "@midday/ui/table";
import {
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { columns } from "./columns";
import { NoResults, EmptyState } from "./empty-states";
import { TimeRow } from "./row";
import { TableHeader } from "./table-header";
import { TimeTableSkeleton } from "./skeleton";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  data: MockTimeEntry[];
  loading?: boolean;
  hasFilters?: boolean;
  onEntryClick?: (entry: MockTimeEntry) => void;
  onEditEntry?: (entry: MockTimeEntry) => void;
  onDeleteEntry?: (entry: MockTimeEntry) => void;
  onDuplicateEntry?: (entry: MockTimeEntry) => void;
  onStartTimer?: (data: { description: string; projectId?: string; jobId?: string }) => void;
  onToggleBillable?: (entry: MockTimeEntry) => void;
  onMarkBilled?: (entry: MockTimeEntry) => void;
};

export function TimeDataTable({
  data,
  loading = false,
  hasFilters = false,
  onEntryClick,
  onEditEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onStartTimer,
  onToggleBillable,
  onMarkBilled,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockTimeEntry] as any;
      let bValue = b[sortColumn as keyof MockTimeEntry] as any;

      if (sortColumn === "date" || sortColumn === "startTime" || sortColumn === "endTime" || sortColumn === "createdAt") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (sortColumn === "duration" || sortColumn === "hourlyRate") {
        // Already numbers
      } else if (sortColumn === "billable" || sortColumn === "billed") {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else if (sortColumn === "status") {
        const statusOrder = { running: 0, paused: 1, stopped: 2 };
        aValue = statusOrder[aValue as keyof typeof statusOrder];
        bValue = statusOrder[bValue as keyof typeof statusOrder];
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const enhancedColumns = useMemo(() => 
    columns.map(col => ({
      ...col,
      cell: col.id === "actions" ? (props: any) => {
        return (
          <ActionsMenu 
            row={props.row.original}
            onEdit={onEditEntry}
            onDelete={onDeleteEntry}
            onDuplicate={onDuplicateEntry}
            onStartTimer={onStartTimer}
            onToggleBillable={onToggleBillable}
            onMarkBilled={onMarkBilled}
          />
        );
      } : col.cell
    })), [onEditEntry, onDeleteEntry, onDuplicateEntry, onStartTimer, onToggleBillable, onMarkBilled]);

  const table = useReactTable({
    data: sortedData,
    getRowId: ({ id }) => id,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const handleSort = (column: string, direction: "asc" | "desc" | null) => {
    setSortColumn(direction ? column : undefined);
    setSortDirection(direction);
  };

  if (loading) {
    return <TimeTableSkeleton />;
  }

  if (hasFilters && !data?.length) {
    return <NoResults />;
  }

  if (!data?.length) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader 
            table={table} 
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <TimeRow 
                key={row.id} 
                row={row} 
                onRowClick={onEntryClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}