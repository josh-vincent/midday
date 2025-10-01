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
  onSort?: (column: string, direction: "asc" | "desc" | null) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
}

export function TableHeader({ table, onSort, sortColumn, sortDirection }: Props) {
  const createSortQuery = (name: string) => {
    if (onSort) {
      if (name === sortColumn) {
        if (sortDirection === "asc") {
          onSort(name, "desc");
        } else if (sortDirection === "desc") {
          onSort(name, null);
        } else {
          onSort(name, "asc");
        }
      } else {
        onSort(name, "asc");
      }
    }
  };

  const isVisible = (id: string) =>
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible();

  return (
    <BaseTableHeader className="border-l-0 border-r-0">
      <TableRow>
        {isVisible("select") && (
          <TableHead className="w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <span>Select</span>
          </TableHead>
        )}
        
        {isVisible("name") && (
          <TableHead className="w-[200px] min-w-[200px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("name")}
            >
              <span>Table</span>
              {"name" === sortColumn && sortDirection === "asc" && (
                <ArrowDown size={16} />
              )}
              {"name" === sortColumn && sortDirection === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("columns") && (
          <TableHead className="w-[150px]">
            <span>Columns</span>
          </TableHead>
        )}

        {isVisible("indexes") && (
          <TableHead className="w-[120px]">
            <span>Indexes</span>
          </TableHead>
        )}

        {isVisible("rowCount") && (
          <TableHead className="w-[120px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("rowCount")}
            >
              <span>Rows</span>
              {"rowCount" === sortColumn && sortDirection === "asc" && (
                <ArrowDown size={16} />
              )}
              {"rowCount" === sortColumn && sortDirection === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("sizeInMB") && (
          <TableHead className="w-[100px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("sizeInMB")}
            >
              <span>Size</span>
              {"sizeInMB" === sortColumn && sortDirection === "asc" && (
                <ArrowDown size={16} />
              )}
              {"sizeInMB" === sortColumn && sortDirection === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("foreignKeys") && (
          <TableHead className="w-[150px]">
            <span>Relations</span>
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