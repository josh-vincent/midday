"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import { useRowTouchActions } from "@midday/table-components";
import { useState } from "react";
import type { Invoice } from "./columns";

type Props = {
  row: Row<Invoice>;
};

export function InvoiceRow({ row }: Props) {
  const { setParams } = useInvoiceParams();
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
        className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary active:bg-[#E8E7E5] active:dark:bg-secondary/80 transition-colors"
        key={row.id}
        {...touchProps}
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
                setParams({
                  invoiceId: row.id,
                  type: "details",
                });
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
