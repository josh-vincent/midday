"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Button } from "@midday/ui/button";
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Copy, 
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Users,
  Calendar,
  FileText,
  Timer,
  TrendingUp,
  PauseCircle
} from "lucide-react";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  row: MockJob;
  onEdit?: (job: MockJob) => void;
  onDelete?: (job: MockJob) => void;
  onStart?: (job: MockJob) => void;
  onComplete?: (job: MockJob) => void;
  onDuplicate?: (job: MockJob) => void;
  onAssign?: (job: MockJob) => void;
  onTimeTracker?: (job: MockJob) => void;
  onView?: (job: MockJob) => void;
  onChangeStatus?: (job: MockJob, status: MockJob["status"]) => void;
  onChangePriority?: (job: MockJob, priority: MockJob["priority"]) => void;
};

const statusActions = [
  { value: "pending", label: "Mark as Pending", icon: Clock },
  { value: "in_progress", label: "Mark In Progress", icon: TrendingUp },
  { value: "completed", label: "Mark as Completed", icon: CheckCircle },
  { value: "on_hold", label: "Put On Hold", icon: PauseCircle },
  { value: "cancelled", label: "Mark as Cancelled", icon: XCircle },
];

const priorityActions = [
  { value: "low", label: "Set Low Priority", icon: Target },
  { value: "medium", label: "Set Medium Priority", icon: Target },
  { value: "high", label: "Set High Priority", icon: AlertTriangle },
  { value: "urgent", label: "Set Urgent Priority", icon: AlertTriangle },
];

export function ActionsMenu({ 
  row, 
  onEdit, 
  onDelete, 
  onStart,
  onComplete,
  onDuplicate,
  onAssign,
  onTimeTracker,
  onView,
  onChangeStatus,
  onChangePriority
}: Props) {
  const canStart = row.status === "pending" || row.status === "on_hold";
  const canComplete = ["in_progress", "pending"].includes(row.status);
  const canPause = row.status === "in_progress";
  const canEdit = row.status !== "completed" && row.status !== "cancelled";
  const canTimeTrack = row.status === "in_progress";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onView?.(row)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {canTimeTrack && (
          <DropdownMenuItem onClick={() => onTimeTracker?.(row)}>
            <Timer className="mr-2 h-4 w-4" />
            Time Tracker
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canStart && (
          <DropdownMenuItem onClick={() => onStart?.(row)}>
            <Play className="mr-2 h-4 w-4" />
            Start Job
          </DropdownMenuItem>
        )}

        {canPause && (
          <DropdownMenuItem onClick={() => onChangeStatus?.(row, "on_hold")}>
            <Pause className="mr-2 h-4 w-4" />
            Pause Job
          </DropdownMenuItem>
        )}

        {canComplete && (
          <DropdownMenuItem onClick={() => onComplete?.(row)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Complete
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => onAssign?.(row)}>
          <Users className="mr-2 h-4 w-4" />
          {row.assignee ? "Reassign" : "Assign"} Job
        </DropdownMenuItem>

        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Job
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Target className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusActions.map((status) => {
              const Icon = status.icon;
              return (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => onChangeStatus?.(row, status.value as MockJob["status"])}
                  disabled={row.status === status.value}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {status.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Change Priority
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {priorityActions.map((priority) => {
              const Icon = priority.icon;
              return (
                <DropdownMenuItem
                  key={priority.value}
                  onClick={() => onChangePriority?.(row, priority.value as MockJob["priority"])}
                  disabled={row.priority === priority.value}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {priority.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={() => onDuplicate?.(row)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Job
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Meeting
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete?.(row)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}