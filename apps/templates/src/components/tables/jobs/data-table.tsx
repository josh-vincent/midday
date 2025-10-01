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
import { JobRow } from "./row";
import { TableHeader } from "./table-header";
import { JobsTableSkeleton } from "./skeleton";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  data: MockJob[];
  loading?: boolean;
  hasFilters?: boolean;
  onJobClick?: (job: MockJob) => void;
  onEditJob?: (job: MockJob) => void;
  onDeleteJob?: (job: MockJob) => void;
  onStartJob?: (job: MockJob) => void;
  onCompleteJob?: (job: MockJob) => void;
  onDuplicateJob?: (job: MockJob) => void;
  onAssignJob?: (job: MockJob) => void;
  onTimeTracker?: (job: MockJob) => void;
};

export function JobsDataTable({
  data,
  loading = false,
  hasFilters = false,
  onJobClick,
  onEditJob,
  onDeleteJob,
  onStartJob,
  onCompleteJob,
  onDuplicateJob,
  onAssignJob,
  onTimeTracker,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockJob] as any;
      let bValue = b[sortColumn as keyof MockJob] as any;

      if (sortColumn === "dueDate" || sortColumn === "startDate" || sortColumn === "createdAt") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (sortColumn === "estimatedHours" || sortColumn === "actualHours" || sortColumn === "progress") {
        // Already numbers
      } else if (sortColumn === "client") {
        aValue = aValue.name.toLowerCase();
        bValue = bValue.name.toLowerCase();
      } else if (sortColumn === "assignee") {
        aValue = aValue?.name?.toLowerCase() || "";
        bValue = bValue?.name?.toLowerCase() || "";
      } else if (sortColumn === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        aValue = priorityOrder[aValue as keyof typeof priorityOrder];
        bValue = priorityOrder[bValue as keyof typeof priorityOrder];
      } else if (sortColumn === "status") {
        const statusOrder = { overdue: 0, in_progress: 1, pending: 2, on_hold: 3, completed: 4, cancelled: 5 };
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
            onEdit={onEditJob}
            onDelete={onDeleteJob}
            onStart={onStartJob}
            onComplete={onCompleteJob}
            onDuplicate={onDuplicateJob}
            onAssign={onAssignJob}
            onTimeTracker={onTimeTracker}
          />
        );
      } : col.cell
    })), [onEditJob, onDeleteJob, onStartJob, onCompleteJob, onDuplicateJob, onAssignJob, onTimeTracker]);

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
    return <JobsTableSkeleton />;
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
              <JobRow 
                key={row.id} 
                row={row} 
                onRowClick={onJobClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}