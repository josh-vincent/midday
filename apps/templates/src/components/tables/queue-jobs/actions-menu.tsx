"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw, 
  X, 
  Trash2,
  Copy
} from "lucide-react";
import { queueAPI, type MockJob } from "@/lib/mock/queue-mock";

interface ActionsMenuProps {
  row: MockJob;
}

export function ActionsMenu({ row }: ActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await queueAPI.retryJob(row.id);
      toast({
        title: "Job Retried",
        description: `Job ${row.id} has been queued for retry`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await queueAPI.cancelJob(row.id);
      toast({
        title: "Job Cancelled",
        description: `Job ${row.id} has been cancelled`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(row.id);
    toast({
      title: "Copied",
      description: "Job ID copied to clipboard",
    });
  };

  const handleViewDetails = () => {
    // This will be handled by the sheet component
    const event = new CustomEvent('open-job-details', { detail: row });
    window.dispatchEvent(event);
  };

  const canRetry = row.status === "failed" || row.status === "retrying";
  const canCancel = row.status === "pending" || row.status === "processing";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleViewDetails}
          className="cursor-pointer"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleCopyId}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Job ID
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {canRetry && (
          <DropdownMenuItem 
            onClick={handleRetry}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry Job
          </DropdownMenuItem>
        )}
        
        {canCancel && (
          <DropdownMenuItem 
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Job
          </DropdownMenuItem>
        )}
        
        {(row.status === "completed" || row.status === "failed") && (
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Job
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}