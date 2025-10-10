"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import {
  TableHeader as UITableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { Customer } from "./columns";

type Props = {
  table: Table<Customer>;
  tableScroll?: any;
};

export function TableHeader({ table, tableScroll }: Props) {
  const { params, setParams } = useSortParams();

  const handleSort = (columnId: string) => {
    // Parse current sort from URL params
    const currentSortString = params.sort?.[0] || "";
    const [currentColumn, currentDirection] = currentSortString.split(":");

    let newSort: string[] = [];

    if (currentColumn === columnId) {
      if (currentDirection === "asc") {
        // Currently asc, switch to desc
        newSort = [`${columnId}:desc`];
      } else if (currentDirection === "desc") {
        // Currently desc, remove sort
        newSort = [];
      }
    } else {
      // New column, start with asc
      newSort = [`${columnId}:asc`];
    }

    setParams({ sort: newSort });
  };

  // Parse current sort from URL params to determine sort state
  const currentSortString = params.sort?.[0] || "";
  const [currentColumn, currentDirection] = currentSortString.split(":");

  return (
    <UITableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const columnId = header.column.id;
            const isSorted = currentColumn === columnId;
            const sortDirection = isSorted ? currentDirection : false;

            const hideOnMobile = (header.column.columnDef.meta as any)?.hideOnMobile;
            const mobileClass = hideOnMobile ? 'hidden lg:table-cell' : '';

            let headerClassName = '';
            if (header.column.id === 'name') {
              headerClassName = `w-[240px] min-w-[240px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1] ${mobileClass}`.trim();
            } else if (header.column.id === 'actions') {
              headerClassName = `sticky right-0 bg-background z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1] ${mobileClass}`.trim();
            } else {
              headerClassName = mobileClass;
            }

            return (
              <TableHead
                key={header.id}
                style={{
                  width: header.column.id === 'name'
                    ? '240px'
                    : tableScroll?.columnWidths?.[header?.column?.id],
                }}
                className={headerClassName}
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center space-x-1">
                    {canSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort(header?.column.id)}
                      >
                        <span>
                          {header.column.columnDef.header
                            ? typeof header.column.columnDef.header === "function"
                              ? header.getContext
                                ? (header.column.columnDef.header as any)(header.getContext())
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
                              ? (header.column.columnDef.header as any)(header.getContext())
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
