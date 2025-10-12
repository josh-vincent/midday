"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import type { Row } from "@tanstack/react-table";
import { useJobParams } from "@/hooks/use-job-params";
import { useRowTouchActions } from "@midday/table-components";
import { useState } from "react";
import type { Job } from "./columns";

type Props = {
  row: Row<Job>;
};

export function JobRow({ row }: Props) {
  const { setParams } = useJobParams();
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
    console.log('Row clicked - Setting jobId:', row.original.id);
    console.log('Row data:', row.original);
    setParams({ jobId: row.original.id });
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
      data-testid="job-item"
      className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary active:bg-[#E8E7E5] active:dark:bg-secondary/80 transition-colors"
      onClick={handleRowClick}
      {...touchProps}
    >
      {row.getVisibleCells().map((cell, index) => {
        const hideOnMobile = (cell.column.columnDef.meta as any)?.hideOnMobile;
        const baseClass = hideOnMobile ? 'hidden lg:table-cell border-l-1' : '';

        let className = baseClass;
        if (cell.column.id === 'select') {
          className = `w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-10 border-r border-border ${baseClass}`.trim();
        } else if (cell.column.id === 'companyName') {
          className = `w-[200px] min-w-[200px] md:sticky md:left-[40px] bg-background z-10 border-r border-border ${baseClass}`.trim();
        }

        return (
          <TableCell key={cell.id} className={className}>
            {cell.renderValue
              ? cell.column.columnDef.cell?.(cell.getContext())
              : null}
          </TableCell>
        );
      })}
    </TableRow>
  );
}