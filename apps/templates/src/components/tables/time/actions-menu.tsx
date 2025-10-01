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
  DollarSign,
  XCircle,
  CheckCircle,
  Timer,
  Clock,
  FileText,
  Download,
  Tag,
  Repeat
} from "lucide-react";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  row: MockTimeEntry;
  onEdit?: (entry: MockTimeEntry) => void;
  onDelete?: (entry: MockTimeEntry) => void;
  onDuplicate?: (entry: MockTimeEntry) => void;
  onStartTimer?: (data: { description: string; projectId?: string; jobId?: string }) => void;
  onToggleBillable?: (entry: MockTimeEntry) => void;
  onMarkBilled?: (entry: MockTimeEntry) => void;
  onExport?: (entry: MockTimeEntry) => void;
  onAddTags?: (entry: MockTimeEntry) => void;
};

export function ActionsMenu({ 
  row, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onStartTimer,
  onToggleBillable,
  onMarkBilled,
  onExport,
  onAddTags
}: Props) {
  const canMarkBilled = row.billable && !row.billed && row.status === "stopped";
  const canToggleBillable = row.status === "stopped";
  const canEdit = row.status === "stopped";
  const canStartTimer = row.status === "stopped";

  const handleStartTimer = () => {
    onStartTimer?.({
      description: row.description,
      projectId: row.projectId,
      jobId: row.jobId,
    });
  };

  const handleDuplicate = () => {
    onDuplicate?.(row);
  };

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
        
        <DropdownMenuItem onClick={() => onEdit?.(row)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Entry
          </DropdownMenuItem>
        )}

        {canStartTimer && (
          <DropdownMenuItem onClick={handleStartTimer}>
            <Timer className="mr-2 h-4 w-4" />
            Start Timer
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {canToggleBillable && (
          <DropdownMenuItem onClick={() => onToggleBillable?.(row)}>
            {row.billable ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Mark Non-billable
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Mark Billable
              </>
            )}
          </DropdownMenuItem>
        )}

        {canMarkBilled && (
          <DropdownMenuItem onClick={() => onMarkBilled?.(row)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Billed
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => onAddTags?.(row)}>
          <Tag className="mr-2 h-4 w-4" />
          {row.tags?.length ? "Edit Tags" : "Add Tags"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Entry
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onExport?.(row)}>
          <Download className="mr-2 h-4 w-4" />
          Export Entry
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Repeat className="mr-2 h-4 w-4" />
            Quick Actions
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => {
              // Create a new entry for today with same details
              const today = new Date().toISOString().split('T')[0];
              const newEntry = {
                ...row,
                id: `time_${Date.now()}`,
                date: today,
                startTime: new Date().toISOString(),
                endTime: undefined,
                duration: 0,
                status: "running" as const,
                billed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              onStartTimer?.({
                description: row.description,
                projectId: row.projectId,
                jobId: row.jobId,
              });
            }}>
              <Play className="mr-2 h-4 w-4" />
              Start Same Task
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              // Copy entry details for manual entry
              navigator.clipboard.writeText(`${row.description} - ${row.duration}m`);
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Copy Details
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete?.(row)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}