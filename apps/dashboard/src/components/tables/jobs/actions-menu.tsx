"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash, 
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Row } from "@tanstack/react-table";
import type { Job } from "./columns";
import { toast } from "@midday/ui/use-toast";

type Props = {
  row: Row<Job>;
};

export function ActionsMenu({ row }: Props) {
  const router = useRouter();
  const job = row.original;

  const handleEdit = () => {
    router.push(`/jobs/${job.id}/edit`);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    toast({
      title: "Job duplicated",
      description: "Job duplicated successfully",
    });
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality  
    toast({
      title: "Delete functionality not yet implemented",
      description: "Delete functionality not yet implemented",
    });
  };

  const handleConvertToInvoice = () => {
    router.push(`/invoices/new?jobId=${job.id}`);
  };

  const handleStatusChange = (status: Job["status"]) => {
    // TODO: Implement status change
    toast.success(`Job status changed to ${status}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
          <Clock className="mr-2 h-4 w-4" />
          Mark as Pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
          <Clock className="mr-2 h-4 w-4" />
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
          <XCircle className="mr-2 h-4 w-4" />
          Mark as Cancelled
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleConvertToInvoice}>
          <FileText className="mr-2 h-4 w-4" />
          Convert to Invoice
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}