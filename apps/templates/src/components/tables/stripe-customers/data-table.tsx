"use client";

import { Table, TableBody } from "@midday/ui/table";
import {
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { columns } from "./columns";
import { NoResults, EmptyState } from "./empty-states";
import { StripeCustomerRow } from "./row";
import { TableHeader } from "./table-header";
import { StripeCustomersSkeleton } from "./skeleton";
import type { MockCustomer } from "@/lib/mock/stripe-mock";

type Props = {
  data: MockCustomer[];
  loading?: boolean;
  hasFilters?: boolean;
  onCustomerClick?: (customer: MockCustomer) => void;
  onEditCustomer?: (customer: MockCustomer) => void;
  onViewCustomer?: (customer: MockCustomer) => void;
  onCreateCustomer?: () => void;
  onClearFilters?: () => void;
};

export function DataTable({
  data,
  loading = false,
  hasFilters = false,
  onCustomerClick,
  onEditCustomer,
  onViewCustomer,
  onCreateCustomer,
  onClearFilters,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortParams, setSortParams] = useState<{
    sort: [string, "asc" | "desc"] | null;
  }>({ sort: null });

  const tableData = useMemo(() => data || [], [data]);

  const handleSort = (column: string) => {
    const [currentColumn, currentValue] = sortParams.sort || [];

    if (column === currentColumn) {
      if (currentValue === "asc") {
        setSortParams({ sort: [column, "desc"] });
      } else if (currentValue === "desc") {
        setSortParams({ sort: null });
      } else {
        setSortParams({ sort: [column, "asc"] });
      }
    } else {
      setSortParams({ sort: [column, "asc"] });
    }
  };

  const table = useReactTable({
    data: tableData,
    getRowId: ({ id }) => id,
    columns: columns.map((col) => ({
      ...col,
      // Add action handlers to the actions column
      ...(col.id === "actions" && {
        cell: ({ row }) => {
          const ActionsMenu = col.cell as React.ComponentType<any>;
          return (
            <ActionsMenu
              row={row.original}
              onEdit={onEditCustomer}
              onView={onViewCustomer}
            />
          );
        },
      }),
    })),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  if (loading) {
    return <StripeCustomersSkeleton />;
  }

  if (hasFilters && !tableData?.length) {
    return <NoResults onClearFilters={onClearFilters} />;
  }

  if (!tableData?.length) {
    return <EmptyState onCreateCustomer={onCreateCustomer} />;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader
            table={table}
            sortParams={sortParams}
            onSort={handleSort}
          />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <StripeCustomerRow
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