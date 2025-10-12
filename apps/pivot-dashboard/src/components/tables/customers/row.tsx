"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import { useRowTouchActions } from "@midday/table-components";
import { useState } from "react";
import type { Customer } from "./columns";

type Props = {
  row: Row<Customer>;
  setOpen: (id?: string) => void;
};

export function CustomerRow({ row, setOpen }: Props) {
  const [showTouchMenu, setShowTouchMenu] = useState(false);

  const { touchProps } = useRowTouchActions({
    onLongPress: () => {
      // Trigger the actions menu button click
      const actionsCell = document.querySelector(
        `[data-row-id="${row.id}"] [data-action-menu]`
      ) as HTMLButtonElement;

      if (actionsCell) {
        actionsCell.click();
        setShowTouchMenu(true);
      }
    },
  });

  return (
    <>
      <TableRow
        data-row-id={row.id}
        className="group h-[45px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary active:bg-[#E8E7E5] active:dark:bg-secondary/80 transition-colors"
        key={row.id}
        {...touchProps}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
            onClick={() => ![3, 4, 5, 6].includes(index) && setOpen(row.id)}
            className={cn(cell.column.columnDef.meta?.className)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
}
