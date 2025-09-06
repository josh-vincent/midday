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
};

export function TableHeader({ table, tableScroll }: Props) {
  const { setParams } = useSortParams();

  const handleSort = (columnId: string) => {
    const currentSort = table.getState().sorting?.[0];
    
    let newSort = `${columnId}:asc`;
    
    if (currentSort?.id === columnId) {
      if (currentSort.desc) {
        // Currently desc, remove sort
        newSort = "";
      } else {
        // Currently asc, switch to desc
        newSort = `${columnId}:desc`;
      }
    }
    
    setParams({ sort: newSort });
  };

  return (
    <UITableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();
            
            return (
              <TableHead 
                key={header.id}
                style={{
                  width: tableScroll?.columnWidths?.[header.column.id],
                }}
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center space-x-1">
                    {canSort ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort(header.column.id)}
                      >
                        <span>{header.column.columnDef.header as string}</span>
                        {isSorted === "desc" ? (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        ) : isSorted === "asc" ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <span>{header.column.columnDef.header as string}</span>
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