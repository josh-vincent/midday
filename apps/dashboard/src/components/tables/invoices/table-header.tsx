"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { useSortParams } from "@/hooks/use-sort-params";
import { DataTableHeader, type StickyColumnConfig } from "@midday/table-components";
import type { Table } from "@tanstack/react-table";
import type { Invoice } from "./columns";

interface Props {
  table: Table<Invoice>;
  tableScroll?: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    isScrollable: boolean;
    scrollLeft: () => void;
    scrollRight: () => void;
    columnWidths?: Record<string, number>;
  };
}

const stickyColumns: StickyColumnConfig[] = [
  {
    id: "select",
    left: "0",
    width: "40px",
    minWidth: "40px",
    zIndex: "30"
  },
  {
    id: "title",
    left: "40px",
    width: "220px",
    minWidth: "220px",
    zIndex: "20"
  },
  {
    id: "actions",
    right: "0",
    width: "100px",
    zIndex: "30"
  }
];

export function TableHeader({ table, tableScroll }: Props) {
  const { params, setParams } = useSortParams();

  const [column, value] = params.sort || [];

  const createSortQuery = (name: string) => {
    const [currentColumn, currentValue] = params.sort || [];

    if (name === currentColumn) {
      if (currentValue === "asc") {
        setParams({ sort: [name, "desc"] });
      } else if (currentValue === "desc") {
        setParams({ sort: null });
      } else {
        setParams({ sort: [name, "asc"] });
      }
    } else {
      setParams({ sort: [name, "asc"] });
    }
  };

  return (
    <DataTableHeader
      table={table}
      tableScroll={tableScroll}
      onSort={createSortQuery}
      currentSort={{
        column: column || "",
        direction: value as "asc" | "desc" | false,
      }}
      stickyColumns={stickyColumns}
      renderCustomHeader={(columnId, context) => {
        if (columnId === "title" && tableScroll?.isScrollable) {
          return (
            <div className="flex items-center justify-between">
              <span>Invoice no.</span>
              <HorizontalPagination
                canScrollLeft={tableScroll.canScrollLeft}
                canScrollRight={tableScroll.canScrollRight}
                onScrollLeft={tableScroll.scrollLeft}
                onScrollRight={tableScroll.scrollRight}
                className="ml-auto flex"
              />
            </div>
          );
        }
        return null;
      }}
    />
  );
}
