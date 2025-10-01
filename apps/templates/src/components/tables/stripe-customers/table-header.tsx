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

interface SortParams {
  sort: [string, "asc" | "desc"] | null;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
}

interface Props {
  table?: TableInterface;
  sortParams?: SortParams;
  onSort?: (column: string) => void;
}

export function TableHeader({ table, sortParams, onSort }: Props) {
  const [column, value] = sortParams?.sort || [];

  const createSortQuery = (name: string) => {
    if (onSort) {
      onSort(name);
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
          <TableHead className="w-[250px] min-w-[250px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <div className="flex items-center justify-between">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("name")}
              >
                <span>Customer</span>
                {"name" === column && value === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"name" === column && value === "desc" && (
                  <ArrowUp size={16} />
                )}
              </Button>
            </div>
          </TableHead>
        )}
        {isVisible("status") && (
          <TableHead className="w-[100px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("status")}
            >
              <span>Status</span>
              {"status" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"status" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("subscriptions") && (
          <TableHead className="w-[140px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("subscriptions")}
            >
              <span>Subscriptions</span>
              {"subscriptions" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"subscriptions" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("totalSpent") && (
          <TableHead className="w-[140px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("totalSpent")}
            >
              <span>Total Spent</span>
              {"totalSpent" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"totalSpent" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("created") && (
          <TableHead className="w-[120px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("created")}
            >
              <span>Created</span>
              {"created" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"created" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
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