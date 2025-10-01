"use client";

import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import { ActionsMenu } from "./actions-menu";
import type { MockMigration } from "@/lib/mock/database-mock";

export type Migration = MockMigration;

const getStatusIcon = (status: string) => {
  switch (status) {
    case "applied":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "applied":
      return "text-green-600 bg-green-50 border-green-200";
    case "pending":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "failed":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const columns: ColumnDef<Migration>[] = [
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
    header: "Migration",
    accessorKey: "name",
    meta: {
      className:
        "w-[250px] min-w-[250px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const migration = row.original;
      return (
        <div>
          <div className="font-medium">{migration.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {migration.id}
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center space-x-2">
          {getStatusIcon(status)}
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusColor(status))}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    header: "Version",
    accessorKey: "version",
    cell: ({ row }) => {
      const version = row.original.version;
      return (
        <span className="font-mono text-sm">
          {version}
        </span>
      );
    },
  },
  {
    header: "Applied At",
    accessorKey: "appliedAt",
    cell: ({ row }) => {
      const appliedAt = row.original.appliedAt;
      const status = row.original.status;
      
      if (status === "pending") {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm">
                {formatDistanceToNow(appliedAt, { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs py-1 px-2">
              {appliedAt.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    header: "Execution Time",
    accessorKey: "executionTime",
    cell: ({ row }) => {
      const executionTime = row.original.executionTime;
      const status = row.original.status;
      
      if (status === "pending") {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <span className="font-mono text-sm">
          {executionTime}ms
        </span>
      );
    },
  },
  {
    header: "Checksum",
    accessorKey: "checksum",
    cell: ({ row }) => {
      const checksum = row.original.checksum;
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <span className="font-mono text-xs text-muted-foreground">
                {checksum.slice(0, 8)}...
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs py-1 px-2">
              {checksum}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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