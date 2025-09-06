"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { Job } from "./columns";

type Props = {
  row: Row<Job>;
};

export function JobRow({ row }: Props) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/jobs/${row.original.id}`);
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.renderValue
            ? cell.column.columnDef.cell?.(cell.getContext())
            : null}
        </TableCell>
      ))}
    </TableRow>
  );
}