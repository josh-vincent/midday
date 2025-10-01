"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle,
  DollarSign,
  Briefcase,
  Calendar,
  Tag,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

const statusConfig = {
  running: { 
    label: "Running", 
    variant: "default" as const,
    icon: PlayCircle,
    color: "text-green-500"
  },
  paused: { 
    label: "Paused", 
    variant: "secondary" as const,
    icon: PauseCircle,
    color: "text-yellow-500"
  },
  stopped: { 
    label: "Stopped", 
    variant: "outline" as const,
    icon: StopCircle,
    color: "text-gray-500"
  },
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

function formatTime(isoString: string): string {
  return format(new Date(isoString), "HH:mm");
}

export const columns: ColumnDef<MockTimeEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-1 max-w-xs">
          <div className="font-medium text-sm">{entry.description}</div>
          {(entry.projectName || entry.jobName) && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {entry.projectName && entry.jobName 
                ? `${entry.projectName} - ${entry.jobName}`
                : entry.projectName || entry.jobName
              }
            </div>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {entry.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{entry.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => {
      const clientName = row.getValue("clientName") as string;
      return (
        <div className="font-medium text-sm">{clientName}</div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      const entryDate = new Date(date);
      const today = new Date();
      const isToday = entryDate.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = entryDate.toDateString() === yesterday.toDateString();
      
      return (
        <div className={cn(
          "whitespace-nowrap text-sm flex items-center gap-1",
          isToday && "text-blue-600 font-medium",
          isYesterday && "text-orange-500"
        )}>
          <Calendar className="h-3 w-3" />
          {isToday ? "Today" : isYesterday ? "Yesterday" : format(entryDate, "MMM dd")}
        </div>
      );
    },
  },
  {
    accessorKey: "startTime",
    header: "Time",
    cell: ({ row }) => {
      const startTime = row.getValue("startTime") as string;
      const endTime = row.original.endTime;
      
      return (
        <div className="text-sm">
          <div className="font-mono">
            {formatTime(startTime)}
            {endTime && ` - ${formatTime(endTime)}`}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      
      return (
        <div className="text-sm font-mono font-medium">
          {formatDuration(duration)}
        </div>
      );
    },
  },
  {
    accessorKey: "billable",
    header: "Billing",
    cell: ({ row }) => {
      const entry = row.original;
      const billableAmount = entry.billable ? (entry.duration / 60) * entry.hourlyRate : 0;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            {entry.billable ? (
              <Badge variant="default" className="gap-1 text-xs">
                <DollarSign className="h-3 w-3" />
                Billable
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs">
                <XCircle className="h-3 w-3" />
                Non-billable
              </Badge>
            )}
          </div>
          {entry.billable && (
            <div className="text-xs text-muted-foreground">
              ${billableAmount.toFixed(2)} @ ${entry.hourlyRate}/h
            </div>
          )}
          {entry.billed && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Billed
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => {
      const userName = row.getValue("userName") as string;
      const userId = row.original.userId;
      
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt={userName} />
            <AvatarFallback className="text-xs">
              {userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{userName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig;
      const config = statusConfig[status];
      const Icon = config.icon;
      
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];