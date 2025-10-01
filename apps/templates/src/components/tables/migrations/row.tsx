"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import type { Migration } from "./columns";

type Props = {
  row: Row<Migration>;
  onRowClick?: (migration: Migration) => void;
};

export function MigrationRow({ row, onRowClick }: Props) {
  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  return (
    <TableRow
      className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary"
      key={row.id}
    >
      {row.getVisibleCells().map((cell, index) => (
        <TableCell
          key={cell.id}
          className={cn(
            cell.column.columnDef.meta?.className,
          )}
          onClick={() => {
            // Don't trigger row click for actions column
            if (index !== row.getVisibleCells().length - 1) {
              handleRowClick();
            }
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}