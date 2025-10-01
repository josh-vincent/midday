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
import { CustomerRow } from "./row";
import { TableHeader } from "./table-header";
import { CustomersTableSkeleton } from "./skeleton";
import type { MockCustomer } from "@/lib/mock/customers-mock";

type Props = {
  data: MockCustomer[];
  loading?: boolean;
  hasFilters?: boolean;
  onCustomerClick?: (customer: MockCustomer) => void;
  onEditCustomer?: (customer: MockCustomer) => void;
  onDeleteCustomer?: (customer: MockCustomer) => void;
  onCreateInvoice?: (customer: MockCustomer) => void;
  onSendEmail?: (customer: MockCustomer) => void;
  onCall?: (customer: MockCustomer) => void;
  onArchiveCustomer?: (customer: MockCustomer) => void;
  onReactivateCustomer?: (customer: MockCustomer) => void;
  onChangeStatus?: (customer: MockCustomer, status: MockCustomer["status"]) => void;
  onViewInvoices?: (customer: MockCustomer) => void;
  onViewPayments?: (customer: MockCustomer) => void;
};

export function CustomersDataTable({
  data,
  loading = false,
  hasFilters = false,
  onCustomerClick,
  onEditCustomer,
  onDeleteCustomer,
  onCreateInvoice,
  onSendEmail,
  onCall,
  onArchiveCustomer,
  onReactivateCustomer,
  onChangeStatus,
  onViewInvoices,
  onViewPayments,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockCustomer] as any;
      let bValue = b[sortColumn as keyof MockCustomer] as any;

      if (sortColumn === "createdAt" || sortColumn === "updatedAt" || sortColumn === "lastActivityAt") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (sortColumn === "totalRevenue" || sortColumn === "outstandingBalance" || sortColumn === "averagePaymentTime") {
        // Already numbers
      } else if (sortColumn === "name" || sortColumn === "email") {
        aValue = aValue?.toLowerCase() || "";
        bValue = bValue?.toLowerCase() || "";
      } else if (sortColumn === "address") {
        aValue = `${aValue?.city || ""} ${aValue?.state || ""}`.toLowerCase();
        bValue = `${bValue?.city || ""} ${bValue?.state || ""}`.toLowerCase();
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
            onEdit={onEditCustomer}
            onDelete={onDeleteCustomer}
            onCreateInvoice={onCreateInvoice}
            onSendEmail={onSendEmail}
            onCall={onCall}
            onArchive={onArchiveCustomer}
            onReactivate={onReactivateCustomer}
            onChangeStatus={onChangeStatus}
            onViewInvoices={onViewInvoices}
            onViewPayments={onViewPayments}
          />
        );
      } : col.cell
    })), [
      onEditCustomer, 
      onDeleteCustomer, 
      onCreateInvoice, 
      onSendEmail, 
      onCall,
      onArchiveCustomer,
      onReactivateCustomer,
      onChangeStatus,
      onViewInvoices,
      onViewPayments
    ]);

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
    return <CustomersTableSkeleton />;
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
              <CustomerRow 
                key={row.id} 
                row={row} 
                onRowClick={onCustomerClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}