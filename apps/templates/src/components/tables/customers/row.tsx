"use client";

import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@midday/ui/table";
import { cn } from "@midday/ui/cn";
import type { MockCustomer } from "@/lib/mock/customers-mock";

type Props = {
  row: Row<MockCustomer>;
  onRowClick?: (customer: MockCustomer) => void;
};

export function CustomerRow({ row, onRowClick }: Props) {
  const customer = row.original;
  const hasOutstandingBalance = customer.outstandingBalance > 0;
  const isHighValue = customer.totalRevenue > 50000;
  const isInactive = customer.status === "inactive" || customer.status === "suspended";

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        hasOutstandingBalance && "bg-orange-50/30 hover:bg-orange-50/50",
        isHighValue && "bg-blue-50/30 hover:bg-blue-50/50",
        isInactive && "opacity-60",
        customer.status === "suspended" && "bg-red-50/30 hover:bg-red-50/50"
      )}
      onClick={() => onRowClick?.(customer)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell 
          key={cell.id}
          onClick={(e) => {
            // Prevent row click when clicking on checkbox or actions
            if (cell.column.id === "select" || cell.column.id === "actions") {
              e.stopPropagation();
            }
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}