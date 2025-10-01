"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import type { Subscription } from "./columns";

type Props = {
  row: Row<Subscription>;
  onRowClick?: (subscription: Subscription) => void;
};

export function SubscriptionRow({ row, onRowClick }: Props) {
  return (
    <>
      <TableRow
        className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary"
        key={row.id}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
            className={cn(
              index === 2 && "w-[50px] min-w-[50px]",
              cell.column.columnDef.meta?.className,
            )}
            onClick={() => {
              if (index !== row.getVisibleCells().length - 1) {
                onRowClick?.(row.original);
              }
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
}