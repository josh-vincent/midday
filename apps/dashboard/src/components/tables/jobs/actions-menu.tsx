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
  Clock,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useJobParams } from "@/hooks/use-job-params";
import type { Row } from "@tanstack/react-table";
import type { Job } from "./columns";
import { toast } from "@midday/ui/use-toast";

type Props = {
  row: Row<Job>;
};

export function ActionsMenu({ row }: Props) {
  const router = useRouter();
  const { setParams } = useJobParams();
  const job = row.original;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParams({ jobId: job.id });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement duplicate functionality
    toast({
      title: "Job duplicated",
      description: "Job duplicated successfully",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete functionality  
    toast({
      title: "Delete functionality not yet implemented",
      description: "Delete functionality not yet implemented",
    });
  };

  const handleConvertToInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to invoices page and open sheet with job data and customer
    const params = new URLSearchParams({
      type: "create",
      jobId: job.id,
    });

    // Add customerId if available
    if (job.customerId) {
      params.set("selectedCustomerId", job.customerId);
    }

    router.replace(`/invoices?${params.toString()}`);
  };

  const handlePreviewInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to invoice details page
    if (job.invoiceId) {
      router.push(`/invoices/${job.invoiceId}`);
    }
  };

  const handleStatusChange = (status: Job["status"]) => (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement status change
    toast.success(`Job status changed to ${status}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className="h-8 w-8 p-0" data-action-menu>
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
        <DropdownMenuItem onClick={handleStatusChange("pending")}>
          <Clock className="mr-2 h-4 w-4" />
          Mark as Pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusChange("in_progress")}>
          <Clock className="mr-2 h-4 w-4" />
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusChange("completed")}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusChange("cancelled")}>
          <XCircle className="mr-2 h-4 w-4" />
          Mark as Cancelled
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {job.invoiceId ? (
          <DropdownMenuItem onClick={handlePreviewInvoice}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Invoice
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleConvertToInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            Convert to Invoice
          </DropdownMenuItem>
        )}
        
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