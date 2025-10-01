"use client";

import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@midday/ui/table";
import { cn } from "@midday/ui/cn";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  row: Row<MockTimeEntry>;
  onRowClick?: (entry: MockTimeEntry) => void;
};

export function TimeRow({ row, onRowClick }: Props) {
  const entry = row.original;
  const isRunning = entry.status === "running";
  const isPaused = entry.status === "paused";
  const isBillable = entry.billable;
  const isBilled = entry.billed;
  const isToday = entry.date === new Date().toISOString().split('T')[0];
  
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        isRunning && "bg-green-50/50 hover:bg-green-50/70 border-l-2 border-green-500",
        isPaused && "bg-yellow-50/30 hover:bg-yellow-50/50 border-l-2 border-yellow-500",
        isBilled && "bg-blue-50/20 hover:bg-blue-50/40",
        !isBillable && "opacity-75",
        isToday && !isRunning && !isPaused && "bg-blue-50/20 hover:bg-blue-50/30"
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