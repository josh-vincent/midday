"use client";

import { Button } from "@midday/ui/button";
import {
  TableHeader as UITableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Table } from "@tanstack/react-table";

export type StickyColumnConfig = {
  id: string;
  left?: string;
  right?: string;
  width?: string;
  minWidth?: string;
  zIndex?: string;
};

type Props<TData> = {
  table?: Table<TData>;
  tableScroll?: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    isScrollable: boolean;
    scrollLeft: () => void;
    scrollRight: () => void;
    columnWidths?: Record<string, number>;
  };
  onSort?: (columnId: string) => void;
  currentSort?: {
    column: string;
    direction: "asc" | "desc" | false;
  };
  stickyColumns?: StickyColumnConfig[];
  renderCustomHeader?: (columnId: string, context: any) => React.ReactNode;
};

export function DataTableHeader<TData>({
  table,
  tableScroll,
  onSort,
  currentSort,
  stickyColumns = [],
  renderCustomHeader,
}: Props<TData>) {
  const getStickyConfig = (columnId: string) => {
    return stickyColumns.find((col) => col.id === columnId);
  };

  const getStickyClassName = (columnId: string, hideOnMobile = false) => {
    const config = getStickyConfig(columnId);
    const mobileClass = hideOnMobile ? "hidden lg:table-cell" : "";

    if (!config) return mobileClass;

    const position = config.left !== undefined ? "left" : "right";
    const offset = config.left || config.right || "0";
    const zIndex = config.zIndex || "20";

    // Add max-w-[33vw] for left sticky columns on mobile
    const maxWidthClass = position === "left" ? "max-w-[33vw]" : "";

    const baseClasses = `sticky ${position}-[${offset}] bg-background z-${zIndex} border-r border-border ${maxWidthClass}`;
    const beforeClasses =
      "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border";
    const afterClasses =
      position === "left"
        ? "after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]"
        : "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]";

    return `${baseClasses} ${beforeClasses} ${afterClasses} ${mobileClass}`.trim();
  };

  const getColumnWidth = (columnId: string) => {
    const config = getStickyConfig(columnId);
    if (config?.width) return config.width;
    return tableScroll?.columnWidths?.[columnId];
  };

  if (!table) {
    return null;
  }

  return (
    <UITableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const columnId = header.column.id;
            const isSorted = currentSort?.column === columnId;
            const sortDirection = isSorted ? currentSort.direction : false;

            const hideOnMobile = (header.column.columnDef.meta as any)
              ?.hideOnMobile;
            const headerClassName = getStickyClassName(columnId, hideOnMobile);
            const config = getStickyConfig(columnId);

            // Check if this column should render a custom header
            const customHeader = renderCustomHeader?.(
              columnId,
              header.getContext(),
            );

            return (
              <TableHead
                key={header.id}
                style={{
                  width: config?.width || getColumnWidth(columnId),
                  minWidth: config?.minWidth,
                }}
                className={headerClassName}
              >
                {header.isPlaceholder ? null : customHeader ? (
                  customHeader
                ) : (
                  <div className="flex items-center space-x-1">
                    {canSort && onSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => onSort(columnId)}
                      >
                        <span>
                          {header.column.columnDef.header
                            ? typeof header.column.columnDef.header ===
                              "function"
                              ? header.getContext
                                ? (header.column.columnDef.header as any)(
                                    header.getContext(),
                                  )
                                : null
                              : header.column.columnDef.header
                            : null}
                        </span>
                        {sortDirection === "desc" ? (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        ) : sortDirection === "asc" ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <>
                        {header.column.columnDef.header
                          ? typeof header.column.columnDef.header === "function"
                            ? header.getContext
                              ? (header.column.columnDef.header as any)(
                                  header.getContext(),
                                )
                              : null
                            : header.column.columnDef.header
                          : null}
                      </>
                    )}
                  </div>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </UITableHeader>
  );
}
