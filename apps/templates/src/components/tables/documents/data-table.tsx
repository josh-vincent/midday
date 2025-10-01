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
import { DocumentRow } from "./row";
import { TableHeader } from "./table-header";
import { DocumentsTableSkeleton } from "./skeleton";
import type { MockDocument } from "@/lib/mock/documents-mock";

type Props = {
  data: MockDocument[];
  loading?: boolean;
  hasFilters?: boolean;
  onDocumentClick?: (document: MockDocument) => void;
  onEditDocument?: (document: MockDocument) => void;
  onDeleteDocument?: (document: MockDocument) => void;
  onStarDocument?: (document: MockDocument) => void;
  onShareDocument?: (document: MockDocument, userIds: string[]) => void;
  onMoveDocument?: (document: MockDocument, folderId: string) => void;
  onDownloadDocument?: (document: MockDocument) => void;
};

export function DocumentsDataTable({
  data,
  loading = false,
  hasFilters = false,
  onDocumentClick,
  onEditDocument,
  onDeleteDocument,
  onStarDocument,
  onShareDocument,
  onMoveDocument,
  onDownloadDocument,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockDocument] as any;
      let bValue = b[sortColumn as keyof MockDocument] as any;

      if (sortColumn === "updatedAt" || sortColumn === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortColumn === "size") {
        // Already numbers
      } else if (sortColumn === "uploadedBy") {
        aValue = aValue.name.toLowerCase();
        bValue = bValue.name.toLowerCase();
      } else if (sortColumn === "name" || sortColumn === "folderName") {
        aValue = (aValue || "").toLowerCase();
        bValue = (bValue || "").toLowerCase();
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
            onEdit={onEditDocument}
            onDelete={onDeleteDocument}
            onStar={onStarDocument}
            onShare={onShareDocument}
            onMove={onMoveDocument}
            onDownload={onDownloadDocument}
          />
        );
      } : col.cell
    })), [onEditDocument, onDeleteDocument, onStarDocument, onShareDocument, onMoveDocument, onDownloadDocument]);

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
    return <DocumentsTableSkeleton />;
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
              <DocumentRow 
                key={row.id} 
                row={row} 
                onRowClick={onDocumentClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}