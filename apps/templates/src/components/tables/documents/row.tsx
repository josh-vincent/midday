"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import { cn } from "@midday/ui/cn";
import { flexRender, type Row } from "@tanstack/react-table";
import type { MockDocument } from "@/lib/mock/documents-mock";

type Props = {
  row: Row<MockDocument>;
  onRowClick?: (document: MockDocument) => void;
};

export function DocumentRow({ row, onRowClick }: Props) {
  const document = row.original;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="menuitem"]') ||
      target.closest('.actions-menu')
    ) {
      return;
    }
    
    onRowClick?.(document);
  };

  return (
    <TableRow
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        document.status === "archived" && "opacity-60"
      )}
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-3">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}