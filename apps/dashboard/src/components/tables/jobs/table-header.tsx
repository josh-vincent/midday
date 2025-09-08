"use client";

import { TableHead, TableHeader as UITableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@midday/ui/button";
import { useSortParams } from "@/hooks/use-sort-params";
import type { Job } from "./columns";

type Props = {
  table: Table<Job>;
  tableScroll?: any;
  jobs?: Job[];
};

export function TableHeader({ table, tableScroll, jobs }: Props) {
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
            
            return (
              <TableHead 
                key={header.id}
                style={{
                  width: header.column.id === 'select' 
                    ? 'w-[40px]' 
                    : tableScroll?.columnWidths?.[header?.column?.id],
                }}
                className={header.column.id === 'select' ? 'w-[40px]' : ''}
              >
                {header.isPlaceholder ? null : (
                  header.column.id === 'select' ? (
                    <>
                      {header.column.columnDef.header
                        ? typeof header.column.columnDef.header === "function"
                          ? header.getContext
                            ? (header.column.columnDef.header as any)(header.getContext())
                            : null
                          : header.column.columnDef.header
                        : null}
                    </>
                  ) : (
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
                  )
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </UITableHeader>
  );
}