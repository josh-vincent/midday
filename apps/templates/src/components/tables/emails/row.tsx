"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import type { Email } from "./columns";

type Props = {
  row: Row<Email>;
  onEmailSelect?: (email: Email) => void;
};

export function EmailRow({ row, onEmailSelect }: Props) {
  const email = row.original;
  const isUnread = !email.read;

  const handleRowClick = () => {
    if (onEmailSelect) {
      onEmailSelect(email);
    }
  };

  return (
    <TableRow
      className={cn(
        "group h-[65px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary",
        {
          "bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50/50 hover:dark:bg-blue-950/20": isUnread,
        }
      )}
      key={row.id}
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell, index) => (
        <TableCell
          key={cell.id}
          className={cn(
            cell.column.columnDef.meta?.className,
            {
              "border-l-2 border-l-blue-500": isUnread && index === 0,
            }
          )}
          onClick={(e) => {
            // Don't trigger row click for actions column or checkbox column
            if (index === row.getVisibleCells().length - 1 || index === 0) {
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