"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  TableHeader as BaseTableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TableColumn {
  id: string;
  getIsVisible: () => boolean;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
}

interface Props {
  table?: TableInterface;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
}

export function TableHeader({ table, sortColumn, sortDirection, onSort }: Props) {
  const createSortHandler = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const isVisible = (id: string) =>
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible() ?? true;

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      className="p-0 hover:bg-transparent space-x-2"
      variant="ghost"
      onClick={() => createSortHandler(column)}
    >
      <span>{children}</span>
      {sortColumn === column && sortDirection === "asc" && (
        <ArrowDown size={16} />
      )}
      {sortColumn === column && sortDirection === "desc" && (
        <ArrowUp size={16} />
      )}
    </Button>
  );

  return (
    <BaseTableHeader className="border-l-0 border-r-0">
      <TableRow>
        {isVisible("select") && (
          <TableHead className="w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <span>Select</span>
          </TableHead>
        )}
        
        {isVisible("id") && (
          <TableHead className="w-[140px] min-w-[140px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <SortButton column="id">Job ID</SortButton>
          </TableHead>
        )}
        
        {isVisible("status") && (
          <TableHead className="w-[150px]">
            <SortButton column="status">Status</SortButton>
          </TableHead>
        )}
        
        {isVisible("priority") && (
          <TableHead className="w-[100px]">
            <SortButton column="priority">Priority</SortButton>
          </TableHead>
        )}
        
        {isVisible("progress") && (
          <TableHead className="w-[120px]">
            <span>Progress</span>
          </TableHead>
        )}
        
        {isVisible("attempts") && (
          <TableHead className="w-[100px]">
            <span>Attempts</span>
          </TableHead>
        )}
        
        {isVisible("createdAt") && (
          <TableHead className="w-[120px]">
            <SortButton column="createdAt">Created</SortButton>
          </TableHead>
        )}
        
        {isVisible("updatedAt") && (
          <TableHead className="w-[120px]">
            <SortButton column="updatedAt">Updated</SortButton>
          </TableHead>
        )}
        
        {isVisible("error") && (
          <TableHead className="w-[200px] min-w-[200px]">
            <span>Error</span>
          </TableHead>
        )}
        
        {isVisible("actions") && (
          <TableHead
            className={cn(
              "w-[100px] md:sticky md:right-0 bg-background z-30",
              "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
              "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]",
            )}
          >
            Actions
          </TableHead>
        )}
      </TableRow>
    </BaseTableHeader>
  );
}