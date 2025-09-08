"use client";

import { useJobsStore } from "@/store/jobs";
import { formatAmount } from "@/utils/format";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import { useToast } from "@midday/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";

export function JobsBulkActionsPopup() {
  const { rowSelection, setRowSelection, jobs } = useJobsStore();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const selectedJobIds = Object.keys(rowSelection);
  const hasSelection = selectedJobIds.length > 0;
  
  // Calculate summary of selected jobs
  const summary = useMemo(() => {
    const selectedJobs = jobs.filter((job) => selectedJobIds.includes(job.id));
    
    const totalAmount = selectedJobs.reduce((sum, job) => {
      return sum + (job.totalAmount || 0);
    }, 0);
    
    const totalVolume = selectedJobs.reduce((sum, job) => {
      return sum + (job.volume || 0);
    }, 0);
    
    const totalWeight = selectedJobs.reduce((sum, job) => {
      return sum + (job.weight || 0);
    }, 0);
    
    // Get primary currency from first job
    const currency = selectedJobs[0]?.currency || "USD";
    
    return {
      count: selectedJobs.length,
      totalAmount,
      totalVolume,
      totalWeight,
      currency,
    };
  }, [jobs, selectedJobIds]);
  
  const updateStatusMutation = useMutation(
    trpc.job.updateManyStatus.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.job.list.infiniteQueryKey(),
        });
        setRowSelection({});
        toast({
          title: `Updated ${data.count} jobs`,
          variant: "success",
          duration: 3500,
        });
      },
      onError: () => {
        toast({
          title: "Failed to update jobs",
          variant: "error",
          duration: 3500,
        });
      },
    }),
  );
  
  const deleteJobsMutation = useMutation(
    trpc.job.deleteMany.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.job.list.infiniteQueryKey(),
        });
        setRowSelection({});
        toast({
          title: `Deleted ${data.count} jobs`,
          variant: "success",
          duration: 3500,
        });
      },
      onError: () => {
        toast({
          title: "Failed to delete jobs",
          variant: "error",
          duration: 3500,
        });
      },
    }),
  );
  
  const handleStatusUpdate = (status: "pending" | "in_progress" | "completed" | "cancelled" | "invoiced") => {
    updateStatusMutation.mutate({
      ids: selectedJobIds,
      status,
    });
  };
  
  const handleAddToInvoice = () => {
    const selectedJobs = jobs.filter((job) => selectedJobIds.includes(job.id));
    
    // Group by customer
    const groupedByCustomer = selectedJobs.reduce(
      (acc, job) => {
        const customerId = job.customerId || 'no-customer';
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId: job.customerId,
            customerName: job.customerName || job.companyName || 'Unknown Customer',
            jobs: [],
          };
        }
        acc[customerId].jobs.push(job);
        return acc;
      },
      {} as Record<string, any>,
    );
    
    sessionStorage.setItem(
      "selectedJobsForInvoice",
      JSON.stringify(Object.values(groupedByCustomer)),
    );
    
    router.push("/invoices?type=create&fromJobs=true");
    setRowSelection({});
  };
  
  const handleDelete = () => {
    deleteJobsMutation.mutate(selectedJobIds);
  };
  
  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-0 right-0 mx-auto z-50 bg-background border rounded-lg shadow-lg p-4 max-w-3xl w-[calc(100%-2rem)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {summary.count} {summary.count === 1 ? 'job' : 'jobs'} selected
                </span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Total: {formatAmount({
                      amount: summary.totalAmount,
                      currency: summary.currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {summary.totalVolume > 0 && (
                    <span>Volume: {summary.totalVolume} m³</span>
                  )}
                  {summary.totalWeight > 0 && (
                    <span>Weight: {summary.totalWeight} kg</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2" disabled={updateStatusMutation.isPending || deleteJobsMutation.isPending}>
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
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
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="bg-transparent border border-destructive hover:bg-transparent"
                  >
                    <Icons.Delete className="text-destructive" size={18} />
                  </Button>
                </AlertDialogTrigger>
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
                      {deleteJobsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRowSelection({})}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}