"use client";

import { formatDistanceToNow } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { cn } from "@midday/ui/cn";
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  RotateCcw, 
  Clock,
  Activity
} from "lucide-react";
import type { MockJob } from "@/lib/mock/queue-mock";
import { ActionsMenu } from "./actions-menu";

export type Job = MockJob;

const getStatusIcon = (status: Job["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "retrying":
      return <RotateCcw className="h-4 w-4 text-yellow-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-gray-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: Job["status"]) => {
  const variants = {
    completed: "default" as const,
    processing: "secondary" as const,
    failed: "destructive" as const,
    retrying: "outline" as const,
    pending: "outline" as const,
  };
  return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
};

const getPriorityBadge = (priority: number) => {
  if (priority === 1) {
    return <Badge variant="destructive" className="text-xs">High</Badge>;
  } else if (priority === 2) {
    return <Badge variant="secondary" className="text-xs">Medium</Badge>;
  } else {
    return <Badge variant="outline" className="text-xs">Low</Badge>;
  }
};

export const columns: ColumnDef<Job>[] = [
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
    header: "Job ID",
    accessorKey: "id",
    meta: {
      className:
        "w-[140px] min-w-[140px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      return (
        <div className="space-y-1">
          <span className="font-mono text-sm font-medium">{row.original.id}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {row.original.queue}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {row.original.type}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Job["status"];
      
      return (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          {getStatusBadge(status)}
        </div>
      );
    },
  },
  {
    header: "Priority",
    accessorKey: "priority",
    cell: ({ row }) => {
      return getPriorityBadge(row.original.priority);
    },
  },
  {
    header: "Progress",
    accessorKey: "progress",
    cell: ({ row }) => {
      const status = row.original.status;
      const progress = row.original.progress;
      
      if (status === "processing") {
        return (
          <div className="w-24 space-y-1">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        );
      }
      
      if (status === "completed") {
        return (
          <div className="w-24 space-y-1">
            <Progress value={100} className="h-2" />
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        );
      }
      
      return (
        <div className="w-24">
          <span className="text-xs text-muted-foreground">-</span>
        </div>
      );
    },
  },
  {
    header: "Attempts",
    accessorKey: "attempts",
    cell: ({ row }) => {
      const attempts = row.original.attempts;
      const maxAttempts = row.original.maxAttempts;
      const isFailure = attempts >= maxAttempts;
      
      return (
        <span className={cn("text-sm", {
          "text-red-500": isFailure,
          "text-yellow-500": attempts > 1 && !isFailure,
        })}>
          {attempts}/{maxAttempts}
        </span>
      );
    },
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="flex flex-col space-y-1 w-[120px]">
          <span className="text-sm">
            {date.toLocaleDateString()}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      );
    },
  },
  {
    header: "Updated",
    accessorKey: "updatedAt",
    cell: ({ row }) => {
      const date = row.original.updatedAt;
      return (
        <div className="flex flex-col space-y-1 w-[120px]">
          <span className="text-sm">
            {date.toLocaleDateString()}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      );
    },
  },
  {
    header: "Error",
    accessorKey: "error",
    cell: ({ row }) => {
      const error = row.original.error;
      if (!error) return "-";
      
      return (
        <div className="max-w-[200px]">
          <span className="text-sm text-red-500 truncate" title={error}>
            {error}
          </span>
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