"use client";

import { TableHead, TableHeader as TableHeaderComponent, TableRow } from "@midday/ui/table";
import { Button } from "@midday/ui/button";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { flexRender, type Table } from "@tanstack/react-table";
import type { MockDocument } from "@/lib/mock/documents-mock";

type Props = {
  table: Table<MockDocument>;
  onSort?: (column: string, direction: "asc" | "desc" | null) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
};

const sortableColumns = ["name", "type", "size", "folderName", "uploadedBy", "updatedAt"];

export function TableHeader({ table, onSort, sortColumn, sortDirection }: Props) {
  const handleSort = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return;
    
    let newDirection: "asc" | "desc" | null = "asc";
    
    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        newDirection = "desc";
      } else if (sortDirection === "desc") {
        newDirection = null;
      }
    }
    
    onSort?.(columnId, newDirection);
  };

  const getSortIcon = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return null;
    
    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        return <ChevronUp className="h-4 w-4" />;
      } else if (sortDirection === "desc") {
        return <ChevronDown className="h-4 w-4" />;
      }
    }
    
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  return (
    <TableHeaderComponent>
      <TableRow className="border-b border-border">
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => {
            const isSortable = sortableColumns.includes(header.id);
            
            return (
              <TableHead key={header.id} className="text-xs font-medium text-muted-foreground">
                {header.isPlaceholder ? null : (
                  <div className={isSortable ? "flex items-center space-x-1" : ""}>
                    {isSortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort(header.id)}
                      >
                        <span>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {getSortIcon(header.id)}
                      </Button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </div>
                )}
              </TableHead>
            );
          })
        )}
      </TableRow>
    </TableHeaderComponent>
  );
}