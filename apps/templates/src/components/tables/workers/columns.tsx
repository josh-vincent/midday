"use client";

import { formatDistanceToNow } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { cn } from "@midday/ui/cn";
import { 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Cpu,
  HardDrive,
  Clock
} from "lucide-react";
import type { MockWorker } from "@/lib/mock/queue-mock";
import { ActionsMenu } from "./actions-menu";

export type Worker = MockWorker;

const getStatusIcon = (status: Worker["status"]) => {
  switch (status) {
    case "busy":
      return <Activity className="h-4 w-4 text-blue-500" />;
    case "idle":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "offline":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: Worker["status"]) => {
  const variants = {
    busy: "secondary" as const,
    idle: "default" as const,
    offline: "destructive" as const,
  };
  return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
};

export const columns: ColumnDef<Worker>[] = [
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
    header: "Worker",
    accessorKey: "name",
    meta: {
      className:
        "w-[180px] min-w-[180px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {getStatusBadge(row.original.status)}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            ID: {row.original.id}
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Worker["status"];
      const currentJob = row.original.currentJob;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </div>
          {currentJob && (
            <div className="text-xs text-muted-foreground">
              Processing: {currentJob}
            </div>
          )}
        </div>
      );
    },
  },
  {
    header: "Performance",
    accessorKey: "processedJobs",
    cell: ({ row }) => {
      const processed = row.original.processedJobs;
      const failed = row.original.failedJobs;
      const successRate = processed > 0 ? ((processed - failed) / processed * 100).toFixed(1) : "0";
      
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {processed.toLocaleString()} jobs
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{failed} failed</span>
            <span>•</span>
            <span>{successRate}% success</span>
          </div>
        </div>
      );
    },
  },
  {
    header: "Resources",
    accessorKey: "cpu",
    cell: ({ row }) => {
      const cpu = row.original.cpu;
      const memory = row.original.memory;
      
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span>CPU</span>
                <span>{cpu}%</span>
              </div>
              <Progress value={cpu} className="h-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span>Memory</span>
                <span>{memory}%</span>
              </div>
              <Progress value={memory} className="h-1" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    header: "Last Active",
    accessorKey: "lastActive",
    cell: ({ row }) => {
      const date = row.original.lastActive;
      const isRecent = Date.now() - date.getTime() < 300000; // 5 minutes
      
      return (
        <div className="flex flex-col space-y-1 w-[120px]">
          <span className="text-sm">
            {date.toLocaleDateString()}
          </span>
          <span className={cn("text-xs", {
            "text-green-500": isRecent,
            "text-muted-foreground": !isRecent,
          })}>
            {formatDistanceToNow(date, { addSuffix: true })}
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