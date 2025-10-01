"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import { flexRender } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { MockJob } from "@/lib/mock/queue-mock";

interface QueueJobRowProps {
  row: Row<MockJob>;
}

export function QueueJobRow({ row }: QueueJobRowProps) {
  const handleRowClick = () => {
    // Open job details sheet
    const event = new CustomEvent('open-job-details', { detail: row.original });
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