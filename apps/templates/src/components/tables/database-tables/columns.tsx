"use client";

import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { Table, Key, Link, Hash, Database } from "lucide-react";
import * as React from "react";
import { ActionsMenu } from "./actions-menu";
import type { MockTable } from "@/lib/mock/database-mock";

export type DatabaseTable = MockTable;

export const columns: ColumnDef<DatabaseTable>[] = [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div 
          className="flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Table",
    accessorKey: "name",
    meta: {
      className:
        "w-[200px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const table = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Table className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">{table.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {table.schema}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    header: "Columns",
    accessorKey: "columns",
    cell: ({ row }) => {
      const columnsCount = row.original.columns.length;
      const primaryKeys = row.original.columns.filter(col => col.isPrimaryKey).length;
      const foreignKeys = row.original.foreignKeys.length;
      const uniqueKeys = row.original.columns.filter(col => col.isUnique && !col.isPrimaryKey).length;

      return (
        <div className="flex items-center space-x-4">
          <span className="font-medium">{columnsCount}</span>
          <div className="flex items-center space-x-2">
            {primaryKeys > 0 && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-1">
                      <Key className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs">{primaryKeys}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs py-1 px-2">
                    Primary Keys
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {foreignKeys > 0 && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-1">
                      <Link className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{foreignKeys}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs py-1 px-2">
                    Foreign Keys
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {uniqueKeys > 0 && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-3 w-3 text-purple-500" />
                      <span className="text-xs">{uniqueKeys}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs py-1 px-2">
                    Unique Constraints
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      );
    },
  },
  {
    header: "Indexes",
    accessorKey: "indexes",
    cell: ({ row }) => {
      const indexes = row.original.indexes;
      const uniqueIndexes = indexes.filter(idx => idx.unique).length;
      const totalIndexes = indexes.length;

      return (
        <div className="flex items-center space-x-2">
          <Database className="h-3 w-3 text-gray-500" />
          <span className="font-medium">{totalIndexes}</span>
          {uniqueIndexes > 0 && (
            <Badge variant="outline" className="text-xs">
              {uniqueIndexes} unique
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    header: "Rows",
    accessorKey: "rowCount",
    cell: ({ row }) => {
      const count = row.original.rowCount;
      return (
        <span className="font-mono text-sm">
          {count.toLocaleString()}
        </span>
      );
    },
  },
  {
    header: "Size",
    accessorKey: "sizeInMB",
    cell: ({ row }) => {
      const size = row.original.sizeInMB;
      return (
        <span className="font-mono text-sm">
          {size} MB
        </span>
      );
    },
  },
  {
    header: "Relations",
    accessorKey: "foreignKeys",
    cell: ({ row }) => {
      const foreignKeys = row.original.foreignKeys;
      
      if (foreignKeys.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="flex flex-col space-y-1">
          {foreignKeys.slice(0, 2).map((fk, idx) => (
            <div key={idx} className="flex items-center space-x-1 text-xs">
              <Link className="h-3 w-3 text-blue-500" />
              <span className="font-mono">{fk.referencedTable}</span>
            </div>
          ))}
          {foreignKeys.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{foreignKeys.length - 2} more
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    meta: {
      className:
        "text-right md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];