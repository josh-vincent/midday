"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Pause, Play, XCircle, RefreshCw, Eye, Edit } from "lucide-react";
import type { Subscription } from "./columns";

type Props = {
  row: Subscription;
  onEdit?: (subscription: Subscription) => void;
  onView?: (subscription: Subscription) => void;
};

export function ActionsMenu({ row, onEdit, onView }: Props) {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: `${action} Subscription`,
      description: `${action} action triggered for ${row.customerName}`,
    });

    // In a real app, these would trigger actual API calls
    console.log(`${action} subscription:`, row.id);
  };

  const canPause = row.status === "active" && !row.cancelAtPeriodEnd;
  const canResume = row.status === "past_due" || row.status === "incomplete";
  const canCancel = row.status === "active" || row.status === "trialing";
  const canReactivate = row.status === "canceled";

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="relative">
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView?.(row)}>
            <Eye className="h-4 w-4 mr-2" />
            View subscription
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit subscription
          </DropdownMenuItem>

          {canPause && (
            <DropdownMenuItem onClick={() => handleAction("Pause")}>
              <Pause className="h-4 w-4 mr-2" />
              Pause subscription
            </DropdownMenuItem>
          )}

          {canResume && (
            <DropdownMenuItem onClick={() => handleAction("Resume")}>
              <Play className="h-4 w-4 mr-2" />
              Resume subscription
            </DropdownMenuItem>
          )}

          {canCancel && (
            <DropdownMenuItem 
              onClick={() => handleAction("Cancel")}
              className="text-[#FF3638]"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel subscription
            </DropdownMenuItem>
          )}

          {canReactivate && (
            <DropdownMenuItem onClick={() => handleAction("Reactivate")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reactivate subscription
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => handleAction("Open billing portal")}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Open billing portal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}