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
import { DatabaseTableRow } from "./row";
import { TableHeader } from "./table-header";
import { DatabaseTablesTableSkeleton } from "./skeleton";
import type { MockTable } from "@/lib/mock/database-mock";

type Props = {
  data: MockTable[];
  loading?: boolean;
  hasFilters?: boolean;
  onTableClick?: (table: MockTable) => void;
  onViewDetails?: (table: MockTable) => void;
  onExportData?: (table: MockTable) => void;
  onAnalyzeTable?: (table: MockTable) => void;
};

export function DatabaseTablesDataTable({
  data,
  loading = false,
  hasFilters = false,
  onTableClick,
  onViewDetails,
  onExportData,
  onAnalyzeTable,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockTable] as any;
      let bValue = b[sortColumn as keyof MockTable] as any;

      if (sortColumn === "name") {
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
            onViewDetails={onViewDetails}
            onExportData={onExportData}
            onAnalyzeTable={onAnalyzeTable}
          />
        );
      } : col.cell
    })), [onViewDetails, onExportData, onAnalyzeTable]);

  const table = useReactTable({
    data: sortedData,
    getRowId: ({ name }) => name,
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
    return <DatabaseTablesTableSkeleton />;
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
              <DatabaseTableRow 
                key={row.id} 
                row={row} 
                onRowClick={onTableClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}