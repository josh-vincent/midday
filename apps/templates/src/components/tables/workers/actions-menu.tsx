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
  Settings, 
  Pause, 
  Play,
  RotateCcw,
  Copy
} from "lucide-react";
import type { MockWorker } from "@/lib/mock/queue-mock";

interface ActionsMenuProps {
  row: MockWorker;
}

export function ActionsMenu({ row }: ActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePause = async () => {
    setIsLoading(true);
    try {
      // Mock pause worker
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Worker Paused",
        description: `Worker ${row.name} has been paused`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      // Mock resume worker
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Worker Resumed",
        description: `Worker ${row.name} has been resumed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      // Mock restart worker
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Worker Restarted",
        description: `Worker ${row.name} has been restarted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart worker",
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
      description: "Worker ID copied to clipboard",
    });
  };

  const handleViewDetails = () => {
    // This will be handled by the sheet component
    const event = new CustomEvent('open-worker-details', { detail: row });
    window.dispatchEvent(event);
  };

  const canPause = row.status === "busy" || row.status === "idle";
  const canResume = row.status === "offline";

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
          Copy Worker ID
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {canPause && (
          <DropdownMenuItem 
            onClick={handlePause}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause Worker
          </DropdownMenuItem>
        )}
        
        {canResume && (
          <DropdownMenuItem 
            onClick={handleResume}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <Play className="mr-2 h-4 w-4" />
            Resume Worker
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          onClick={handleRestart}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Restart Worker
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}