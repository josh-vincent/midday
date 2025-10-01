"use client";

import { Table } from "@tanstack/react-table";
import { TableHead, TableHeader as BaseTableHeader, TableRow } from "@midday/ui/table";
import { Button } from "@midday/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  table: Table<MockJob>;
  onSort?: (column: string, direction: "asc" | "desc" | null) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
};

const sortableColumns = ["title", "client", "status", "priority", "assignee", "progress", "dueDate", "estimatedHours"];

export function TableHeader({ table, onSort, sortColumn, sortDirection }: Props) {
  const handleSort = (columnId: string) => {
    if (!onSort || !sortableColumns.includes(columnId)) return;
    
    let newDirection: "asc" | "desc" | null = "asc";
    if (sortColumn === columnId) {
      if (sortDirection === "asc") newDirection = "desc";
      else if (sortDirection === "desc") newDirection = null;
    }
    
    onSort(columnId, newDirection);
  };

  return (
    <BaseTableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isSortable = sortableColumns.includes(header.column.id);
            const isSorted = sortColumn === header.column.id;
            
            return (
              <TableHead key={header.id} className="h-11">
                {header.isPlaceholder ? null : (
                  <div className="flex items-center space-x-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {isSortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort(header.column.id)}
                      >
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </BaseTableHeader>
  );
}