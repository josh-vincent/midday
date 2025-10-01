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
        {isVisible("customerName") && (
          <TableHead className="w-[200px] min-w-[200px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <div className="flex items-center justify-between">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("customerName")}
              >
                <span>Customer</span>
                {"customerName" === column && value === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"customerName" === column && value === "desc" && (
                  <ArrowUp size={16} />
                )}
              </Button>
            </div>
          </TableHead>
        )}
        {isVisible("product") && (
          <TableHead className="w-[150px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("product")}
            >
              <span>Product</span>
              {"product" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"product" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("status") && (
          <TableHead className="w-[120px]">
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

        {isVisible("price") && (
          <TableHead className="w-[120px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("price")}
            >
              <span>Amount</span>
              {"price" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"price" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("currentPeriodEnd") && (
          <TableHead className="w-[140px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("currentPeriodEnd")}
            >
              <span>Next Billing</span>
              {"currentPeriodEnd" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"currentPeriodEnd" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("trialEnd") && (
          <TableHead className="w-[120px] min-w-[120px]">
            <span>Trial End</span>
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