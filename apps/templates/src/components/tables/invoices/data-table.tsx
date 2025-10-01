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
import { InvoiceRow } from "./row";
import { TableHeader } from "./table-header";
import { InvoicesTableSkeleton } from "./skeleton";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

type Props = {
  data: MockInvoice[];
  loading?: boolean;
  hasFilters?: boolean;
  onInvoiceClick?: (invoice: MockInvoice) => void;
  onEditInvoice?: (invoice: MockInvoice) => void;
  onDeleteInvoice?: (invoice: MockInvoice) => void;
  onSendInvoice?: (invoice: MockInvoice) => void;
  onDuplicateInvoice?: (invoice: MockInvoice) => void;
  onMarkAsPaid?: (invoice: MockInvoice) => void;
};

export function InvoicesDataTable({
  data,
  loading = false,
  hasFilters = false,
  onInvoiceClick,
  onEditInvoice,
  onDeleteInvoice,
  onSendInvoice,
  onDuplicateInvoice,
  onMarkAsPaid,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockInvoice] as any;
      let bValue = b[sortColumn as keyof MockInvoice] as any;

      if (sortColumn === "date" || sortColumn === "dueDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortColumn === "total" || sortColumn === "amountDue") {
        // Already numbers
      } else if (sortColumn === "customer") {
        aValue = aValue.name.toLowerCase();
        bValue = bValue.name.toLowerCase();
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
            onEdit={onEditInvoice}
            onDelete={onDeleteInvoice}
            onSend={onSendInvoice}
            onDuplicate={onDuplicateInvoice}
            onMarkAsPaid={onMarkAsPaid}
          />
        );
      } : col.cell
    })), [onEditInvoice, onDeleteInvoice, onSendInvoice, onDuplicateInvoice, onMarkAsPaid]);

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
    return <InvoicesTableSkeleton />;
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
              <InvoiceRow 
                key={row.id} 
                row={row} 
                onRowClick={onInvoiceClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}