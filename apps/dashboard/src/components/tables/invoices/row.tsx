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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't open details if clicking on checkbox or actions
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="checkbox"]') ||
      target.closest('[data-action-menu]') ||
      target.closest('button')
    ) {
      return;
    }
    setParams({
      invoiceId: row.id,
      type: "details",
    });
  };

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
    <TableRow
      data-row-id={row.id}
      data-testid="invoice-item"
      className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary active:bg-[#E8E7E5] active:dark:bg-secondary/80 transition-colors"
      onClick={handleRowClick}
      {...touchProps}
    >
      {row.getVisibleCells().map((cell, index) => {
        const hideOnMobile = (cell.column.columnDef.meta as any)?.hideOnMobile;
        const baseClass = hideOnMobile ? 'hidden lg:table-cell' : '';

        let className = cn(
          baseClass,
          cell.column.columnDef.meta?.className,
        );

        if (cell.column.id === 'select') {
          className = cn(
            'w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-10 border-r border-border',
            baseClass,
          );
        } else if (cell.column.id === 'title') {
          className = cn(
            'w-[180px] min-w-[180px] md:sticky md:left-[40px] bg-background z-10 border-r border-border',
            baseClass,
            cell.column.columnDef.meta?.className,
          );
        }

        return (
          <TableCell key={cell.id} className={className}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
