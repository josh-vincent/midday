"use client";

import { DataTableHeader, type StickyColumnConfig } from "@midday/table-components";
import { useSortParams } from "@/hooks/use-sort-params";
import type { Table } from "@tanstack/react-table";
import type { Job } from "./columns";

type Props = {
  table: Table<Job>;
  tableScroll?: any;
  jobs?: Job[];
};

const stickyColumns: StickyColumnConfig[] = [
  {
    id: "select",
    left: "0",
    width: "40px",
    minWidth: "40px",
    zIndex: "20"
  },
  {
    id: "jobNumber",
    left: "40px",
    width: "200px",
    minWidth: "200px",
    zIndex: "20"
  },
];

export function TableHeader({ table, tableScroll }: Props) {
  const { params, setParams } = useSortParams();

  const handleSort = (columnId: string) => {
    const currentSortString = params.sort?.[0] || "";
    const [currentColumn, currentDirection] = currentSortString.split(":");

    let newSort: string[] = [];

    if (currentColumn === columnId) {
      if (currentDirection === "asc") {
        newSort = [`${columnId}:desc`];
      } else if (currentDirection === "desc") {
        newSort = [];
      }
    } else {
      newSort = [`${columnId}:asc`];
    }

    setParams({ sort: newSort });
  };

  const currentSortString = params.sort?.[0] || "";
  const [currentColumn, currentDirection] = currentSortString.split(":");

  return (
    <DataTableHeader
      table={table}
      tableScroll={tableScroll}
      onSort={handleSort}
      currentSort={{
        column: currentColumn,
        direction: currentDirection as "asc" | "desc" | false,
      }}
      stickyColumns={stickyColumns}
    />
  );
}