"use client";

import { JobsCSVImporter } from "@/components/import/jobs-csv-importer";
import { JobsColumnVisibility } from "@/components/jobs-column-visibility";
import { OpenJobSheet } from "@/components/open-job-sheet";
import { useJobsStore, type Job } from "@/store/jobs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ChevronDown, Loader2, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface JobsActionsProps {
  jobs?: Job[];
}

export function JobsActions({ jobs = [] }: JobsActionsProps) {
  const { setRowSelection, rowSelection } = useJobsStore();
  const [showImporter, setShowImporter] = useState(false);
  const router = useRouter();

  const jobIds = Object.keys(rowSelection);

  const handleStatusUpdate = (status: string) => {
    // TODO: Implement status update mutation
    console.log("Update status to:", status, "for jobs:", jobIds);
    setRowSelection(() => ({}));
  };

  const handleAddToInvoice = () => {
    // Get selected jobs data
    const selectedJobs = jobs.filter((job) => jobIds.includes(job.id));

    // Group by customer, handling null customerIds
    const groupedByCustomer = selectedJobs.reduce(
      (acc, job) => {
        const customerId = job.customerId || 'no-customer';
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId: job.customerId, // Keep original null value
            customerName: job.customerName || job.companyName || 'Unknown Customer',
            jobs: [],
          };
        }
        acc[customerId].jobs.push(job);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Store in sessionStorage for invoice creation
    sessionStorage.setItem(
      "selectedJobsForInvoice",
      JSON.stringify(Object.values(groupedByCustomer)),
    );

    // Navigate to invoice page and open creation sheet
    router.push("/invoices?type=create&fromJobs=true");
    setRowSelection(() => ({}));
  };

  const handleDelete = () => {
    // TODO: Implement delete mutation
    console.log("Delete jobs:", jobIds);
    setRowSelection(() => ({}));
  };

  if (jobIds?.length) {
    return (
      <AlertDialog>
        <div className="ml-auto">
          <div className="flex items-center">
            <span className="text-sm text-[#606060] w-full">Bulk edit</span>
            <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2">
                    <span>Actions</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("pending")}
                  >
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("in_progress")}
                  >
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("completed")}
                  >
                    Mark as Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("cancelled")}
                  >
                    Mark as Cancelled
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleAddToInvoice}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Invoice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="bg-transparent border border-destructive hover:bg-transparent"
                >
                  <Icons.Delete className="text-destructive" size={18} />
                </Button>
              </AlertDialogTrigger>
            </div>
          </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <div className="space-x-2 hidden md:flex">
        <JobsColumnVisibility />
        <Button variant="outline" onClick={() => setShowImporter(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
        <OpenJobSheet />
      </div>

      <JobsCSVImporter open={showImporter} onOpenChange={setShowImporter} />
    </>
  );
}
