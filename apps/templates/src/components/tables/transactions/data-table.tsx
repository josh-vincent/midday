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
import { TransactionRow } from "./row";
import { TableHeader } from "./table-header";
import { TransactionsTableSkeleton } from "./skeleton";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

type Props = {
  data: MockTransaction[];
  loading?: boolean;
  hasFilters?: boolean;
  onTransactionClick?: (transaction: MockTransaction) => void;
  onEditTransaction?: (transaction: MockTransaction) => void;
  onDeleteTransaction?: (transaction: MockTransaction) => void;
  onCategorizeTransaction?: (transaction: MockTransaction, category: string) => void;
};

export function TransactionsDataTable({
  data,
  loading = false,
  hasFilters = false,
  onTransactionClick,
  onEditTransaction,
  onDeleteTransaction,
  onCategorizeTransaction,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>();

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof MockTransaction] as any;
      let bValue = b[sortColumn as keyof MockTransaction] as any;

      if (sortColumn === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortColumn === "amount") {
        aValue = Math.abs(aValue);
        bValue = Math.abs(bValue);
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
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
            onCategorize={onCategorizeTransaction}
          />
        );
      } : col.cell
    })), [onEditTransaction, onDeleteTransaction, onCategorizeTransaction]);

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
    return <TransactionsTableSkeleton />;
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
              <TransactionRow 
                key={row.id} 
                row={row} 
                onRowClick={onTransactionClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}