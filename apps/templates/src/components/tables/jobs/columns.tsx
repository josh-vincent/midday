"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PauseCircle,
  Briefcase,
  AlertTriangle,
  Target,
  TrendingUp,
  Calendar,
  User
} from "lucide-react";
import type { MockJob } from "@/lib/mock/jobs-mock";

const statusConfig = {
  pending: { 
    label: "Pending", 
    variant: "secondary" as const,
    icon: Clock,
    color: "text-gray-500"
  },
  in_progress: { 
    label: "In Progress", 
    variant: "default" as const,
    icon: TrendingUp,
    color: "text-blue-500"
  },
  completed: { 
    label: "Completed", 
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-500"
  },
  on_hold: { 
    label: "On Hold", 
    variant: "secondary" as const,
    icon: PauseCircle,
    color: "text-yellow-500"
  },
  overdue: { 
    label: "Overdue", 
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-500"
  },
  cancelled: { 
    label: "Cancelled", 
    variant: "outline" as const,
    icon: XCircle,
    color: "text-gray-400"
  },
};

const priorityConfig = {
  low: { 
    label: "Low", 
    variant: "secondary" as const,
    icon: Target,
    color: "text-green-500"
  },
  medium: { 
    label: "Medium", 
    variant: "secondary" as const,
    icon: Target,
    color: "text-yellow-500"
  },
  high: { 
    label: "High", 
    variant: "secondary" as const,
    icon: AlertTriangle,
    color: "text-orange-500"
  },
  urgent: { 
    label: "Urgent", 
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-500"
  },
};

export const columns: ColumnDef<MockJob>[] = [
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
    accessorKey: "title",
    header: "Job Title",
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{job.title}</div>
          {job.projectName && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.projectName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div>
          <div className="font-medium">{client.name}</div>
          <div className="text-xs text-muted-foreground">{client.email}</div>
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
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as keyof typeof priorityConfig;
      const config = priorityConfig[priority];
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
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => {
      const assignee = row.original.assignee;
      
      if (!assignee) {
        return (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm">Unassigned</span>
          </div>
        );
      }
      
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={assignee.avatar} alt={assignee.name} />
            <AvatarFallback className="text-xs">
              {assignee.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{assignee.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Progress value={progress} className="w-16 h-2" />
            <span className="text-xs text-muted-foreground ml-2">
              {progress}%
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      
      if (!dueDate) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      
      const date = new Date(dueDate);
      const isOverdue = date < new Date() && row.original.status !== "completed";
      const isToday = new Date().toDateString() === date.toDateString();
      
      return (
        <div className={cn(
          "whitespace-nowrap text-sm flex items-center gap-1",
          isOverdue && "text-red-500 font-medium",
          isToday && "text-orange-500 font-medium"
        )}>
          <Calendar className="h-3 w-3" />
          {format(date, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "estimatedHours",
    header: "Est. Hours",
    cell: ({ row }) => {
      const estimatedHours = row.getValue("estimatedHours") as number;
      const actualHours = row.original.actualHours;
      
      return (
        <div className="text-sm">
          <div className="font-medium">{estimatedHours}h</div>
          <div className="text-xs text-muted-foreground">
            {actualHours.toFixed(1)}h actual
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];