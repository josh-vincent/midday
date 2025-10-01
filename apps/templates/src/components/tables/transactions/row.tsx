"use client";

import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@midday/ui/table";
import { cn } from "@midday/ui/cn";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

type Props = {
  row: Row<MockTransaction>;
  onRowClick?: (transaction: MockTransaction) => void;
};

export function TransactionRow({ row, onRowClick }: Props) {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        row.original.status === "pending" && "opacity-70"
      )}
      onClick={() => onRowClick?.(row.original)}
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