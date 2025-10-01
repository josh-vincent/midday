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
import { MigrationRow } from "./row";
import { TableHeader } from "./table-header";
import { MigrationsTableSkeleton } from "./skeleton";
import type { MockMigration } from "@/lib/mock/database-mock";

type Props = {
  data: MockMigration[];
  loading?: boolean;
  hasFilters?: boolean;
  onMigrationClick?: (migration: MockMigration) => void;
  onViewDetails?: (migration: MockMigration) => void;
  onRunMigration?: (migration: MockMigration) => void;
  onRollbackMigration?: (migration: MockMigration) => void;
};

export function MigrationsDataTable({
  data,
  loading = false,
  hasFilters = false,
  onMigrationClick,
  onViewDetails,
  onRunMigration,
  onRollbackMigration,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockMigration] as any;
      let bValue = b[sortColumn as keyof MockMigration] as any;

      if (sortColumn === "name") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortColumn === "appliedAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
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
            onViewDetails={onViewDetails}
            onRunMigration={onRunMigration}
            onRollbackMigration={onRollbackMigration}
          />
        );
      } : col.cell
    })), [onViewDetails, onRunMigration, onRollbackMigration]);

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
    return <MigrationsTableSkeleton />;
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
              <MigrationRow 
                key={row.id} 
                row={row} 
                onRowClick={onMigrationClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}