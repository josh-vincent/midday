"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import type { Row } from "@tanstack/react-table";
import { useJobParams } from "@/hooks/use-job-params";
import type { Job } from "./columns";

type Props = {
  row: Row<Job>;
};

export function JobRow({ row }: Props) {
  const { setParams } = useJobParams();

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
    setParams({ jobId: row.original.id });
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell 
          key={cell.id}
          className={cell.column.id === 'select' ? 'w-[40px]' : ''}
        >
          {cell.renderValue
            ? cell.column.columnDef.cell?.(cell.getContext())
            : null}
        </TableCell>
      ))}
    </TableRow>
  );
}