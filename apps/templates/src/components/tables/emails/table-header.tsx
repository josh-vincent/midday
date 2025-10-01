"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { cn } from "@midday/ui/cn";
import {
  TableHeader as BaseTableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { ArrowDown, ArrowUp, Search, Filter, Archive, Trash2, Check, Star } from "lucide-react";
import { useState } from "react";

interface TableColumn {
  id: string;
  getIsVisible: () => boolean;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
  getFilteredSelectedRowModel: () => { rows: any[] };
}

interface Props {
  table?: TableInterface;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
}

export function TableHeader({ 
  table, 
  searchQuery = "",
  onSearchChange,
  sortField,
  sortDirection,
  onSort,
  onBulkAction
}: Props) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  const selectedRows = table?.getFilteredSelectedRowModel().rows || [];
  const hasSelectedRows = selectedRows.length > 0;

  const createSortQuery = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const isVisible = (id: string) =>
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible();

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction) {
      onBulkAction(action, selectedRows);
    }
  };

  return (
    <>
      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All emails</DropdownMenuItem>
              <DropdownMenuItem>Unread only</DropdownMenuItem>
              <DropdownMenuItem>Starred only</DropdownMenuItem>
              <DropdownMenuItem>Important only</DropdownMenuItem>
              <DropdownMenuItem>With attachments</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasSelectedRows && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("mark-read")}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("star")}
            >
              <Star className="h-4 w-4 mr-2" />
              Star
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("archive")}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("delete")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table Header */}
      <BaseTableHeader className="border-l-0 border-r-0">
        <TableRow>
          {isVisible("select") && (
            <TableHead className="w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
              <span>Select</span>
            </TableHead>
          )}
          
          {isVisible("from") && (
            <TableHead className="w-[200px] min-w-[200px] md:sticky md:left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("from")}
              >
                <span>From</span>
                {"from" === sortField && sortDirection === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"from" === sortField && sortDirection === "desc" && (
                  <ArrowUp size={16} />
                )}
              </Button>
            </TableHead>
          )}

          {isVisible("subject") && (
            <TableHead className="min-w-[300px]">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("subject")}
              >
                <span>Subject</span>
                {"subject" === sortField && sortDirection === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"subject" === sortField && sortDirection === "desc" && (
                  <ArrowUp size={16} />
                )}
              </Button>
            </TableHead>
          )}

          {isVisible("read") && (
            <TableHead className="w-[120px]">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("read")}
              >
                <span>Status</span>
                {"read" === sortField && sortDirection === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"read" === sortField && sortDirection === "desc" && (
                  <ArrowUp size={16} />
                )}
              </Button>
            </TableHead>
          )}

          {isVisible("labels") && (
            <TableHead className="w-[150px] min-w-[150px]">
              <span>Labels</span>
            </TableHead>
          )}

          {isVisible("provider") && (
            <TableHead className="w-[100px] min-w-[100px]">
              <span>Provider</span>
            </TableHead>
          )}

          {isVisible("date") && (
            <TableHead className="w-[120px] min-w-[120px]">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("date")}
              >
                <span>Date</span>
                {"date" === sortField && sortDirection === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"date" === sortField && sortDirection === "desc" && (
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
    </>
  );
}