"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import { flexRender } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { MockWorker } from "@/lib/mock/queue-mock";

interface WorkerRowProps {
  row: Row<MockWorker>;
}

export function WorkerRow({ row }: WorkerRowProps) {
  const handleRowClick = () => {
    // Open worker details sheet
    const event = new CustomEvent('open-worker-details', { detail: row.original });
    window.dispatchEvent(event);
  };

  return (
    <TableRow 
      className="group cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell 
          key={cell.id}
          className={cell.column.columnDef.meta?.className}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}