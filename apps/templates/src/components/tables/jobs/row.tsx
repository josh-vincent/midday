"use client";

import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@midday/ui/table";
import { cn } from "@midday/ui/cn";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  row: Row<MockJob>;
  onRowClick?: (job: MockJob) => void;
};

export function JobRow({ row, onRowClick }: Props) {
  const job = row.original;
  const isOverdue = job.dueDate && new Date(job.dueDate) < new Date() && job.status !== "completed";
  const isUrgent = job.priority === "urgent";
  const isCompleted = job.status === "completed";
  
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        isOverdue && "bg-red-50/50 hover:bg-red-50/70",
        isUrgent && !isOverdue && "bg-orange-50/30 hover:bg-orange-50/50",
        isCompleted && "opacity-70 bg-green-50/20 hover:bg-green-50/40",
        job.status === "on_hold" && "opacity-80 bg-yellow-50/30 hover:bg-yellow-50/50"
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