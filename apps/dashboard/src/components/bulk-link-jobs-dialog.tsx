"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, LinkIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface BulkLinkJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerId: string;
}

interface Job {
  id: string;
  jobNumber: string | null;
  companyName: string | null;
  jobDate: string | null;
  status: string;
  customerId: string | null;
  totalAmount: number | null;
}

export function BulkLinkJobsDialog({
  open,
  onOpenChange,
  customerName,
  customerId,
}: BulkLinkJobsDialogProps) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all jobs using proper tRPC hook with authentication
  const { data: allJobsResponse, error: jobsError, isLoading } = trpc.job.list.useQuery(
    { limit: 200 },
    {
      enabled: open && !!customerName,
      retry: 1,
    }
  );

  // Process and filter jobs for matching
  const jobsData = useMemo(() => {
    if (!allJobsResponse) return [];
    
    const jobs = allJobsResponse;
    const unlinkedJobs = jobs.filter((job: Job) => !job.customerId);
    
    if (!customerName) return unlinkedJobs;
    
    // Improve matching logic with multiple strategies
    const customerNameLower = customerName.toLowerCase();
    const matchingJobs = unlinkedJobs.filter((job: Job) => {
      if (!job.companyName) return false;
      
      const companyNameLower = job.companyName.toLowerCase();
      
      // Strategy 1: Exact contains match
      if (companyNameLower.includes(customerNameLower) || 
          customerNameLower.includes(companyNameLower)) {
        return true;
      }
      
      // Strategy 2: Word-based matching (split by spaces/punctuation)
      const customerWords = customerNameLower.split(/[\s\-\._,]+/).filter(w => w.length > 2);
      const companyWords = companyNameLower.split(/[\s\-\._,]+/).filter(w => w.length > 2);
      
      // Check if significant words match
      const matchCount = customerWords.filter(customerWord => 
        companyWords.some(companyWord => 
          companyWord.includes(customerWord) || customerWord.includes(companyWord)
        )
      ).length;
      
      // Consider it a match if at least half the words match
      return matchCount >= Math.min(2, Math.ceil(customerWords.length / 2));
    });
    
    return matchingJobs;
  }, [allJobsResponse, customerName]);

  if (jobsError) {
    console.error('Jobs query error:', jobsError);
    // Still render the dialog but with an error message
  }

  const matchingJobs = jobsData;

  // Auto-select all matching jobs initially
  useEffect(() => {
    if (matchingJobs.length > 0) {
      setSelectedJobIds(matchingJobs.map((job: Job) => job.id));
    }
  }, [matchingJobs]);

  // Bulk update jobs using manual mutation approach with proper error handling
  const bulkUpdateMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Process jobs sequentially to avoid overwhelming the API
      for (const jobId of jobIds) {
        try {
          const result = await trpc.job.update.mutate({
            id: jobId,
            customerId,
            companyName: customerName,
          });
          results.push(result);
          successCount++;
        } catch (error) {
          console.error(`Failed to update job ${jobId}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount > 0 && successCount === 0) {
        throw new Error(`Failed to link all ${errorCount} jobs`);
      }
      
      return { results, successCount, errorCount };
    },
    onSuccess: ({ results, successCount, errorCount }) => {
      if (successCount > 0) {
        toast({
          title: "Jobs linked successfully",
          description: errorCount > 0 
            ? `${successCount} jobs linked successfully, ${errorCount} failed`
            : `${successCount} jobs have been linked to ${customerName}`,
        });
      }

      // Invalidate all job-related queries to refresh the table
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' && 
                 queryKey[1] && 
                 queryKey[1].toString().includes('job');
        },
      });

      // Also invalidate customer queries if they exist
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' && 
                 queryKey[1] && 
                 queryKey[1].toString().includes('customers');
        },
      });

      onOpenChange(false);
      setSelectedJobIds([]);
    },
    onError: (error) => {
      console.error('Bulk link jobs error:', error);
      toast({
        title: "Failed to link jobs",
        description: error.message || "An error occurred while linking jobs",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLinking(false);
    },
  });

  const handleLinkJobs = async () => {
    if (selectedJobIds.length === 0) {
      onOpenChange(false);
      return;
    }

    setLinking(true);
    bulkUpdateMutation.mutate(selectedJobIds);
  };

  const handleJobSelection = (jobId: string, checked: boolean) => {
    setSelectedJobIds(prev => 
      checked 
        ? [...prev, jobId]
        : prev.filter(id => id !== jobId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedJobIds(checked ? matchingJobs.map((job: Job) => job.id) : []);
  };

  console.log('Matching jobs check:', matchingJobs.length, matchingJobs);
  console.log('Query state:', { isLoading, jobsError: !!jobsError, open, customerName });
  
  // Don't render if we're still loading or if there was an error and no cached data
  if (isLoading && !matchingJobs.length) {
    console.log('Still loading, not rendering yet');
    return null;
  }
  
  // Always show the dialog if it's supposed to be open, even with errors
  if (!open) {
    console.log('Dialog not open, not rendering');
    return null;
  }
  
  // If there's an error, we'll show an error message inside the dialog
  if (jobsError && !matchingJobs.length) {
    console.log('Query failed, showing dialog with error message');
  } else if (!matchingJobs.length && !isLoading) {
    console.log('No matching jobs found after loading completed');
    // Still show dialog but with message about no matching jobs
  }
  
  console.log('Rendering dialog with', matchingJobs.length, 'jobs');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="h-5 w-5" />
            Link Existing Jobs to {customerName}
          </DialogTitle>
          <DialogDescription className="pt-3 text-sm text-muted-foreground">
            We found {matchingJobs.length} existing unlinked jobs that may belong to "{customerName}". 
            Review and select the jobs you'd like to link to this customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {jobsError && matchingJobs.length === 0 ? (
            <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium">Unable to load jobs for linking.</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can manually link jobs from the jobs table later.
              </p>
            </div>
          ) : matchingJobs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground bg-gray-50 rounded-lg border">
              <p className="font-medium">No unlinked jobs found for "{customerName}".</p>
              <p className="text-sm mt-2">
                All jobs for this company are already linked to customers.
              </p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-3 p-4 border bg-muted/30 rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={selectedJobIds.length === matchingJobs.length && matchingJobs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label 
                  htmlFor="select-all" 
                  className="font-medium cursor-pointer"
                >
                  Select all {matchingJobs.length} jobs
                </label>
              </div>
            </>
          )}

          {/* Jobs List */}
          <ScrollArea className="max-h-96 rounded-lg border">
            <div className="space-y-2 p-3">
              {matchingJobs.map((job: Job) => (
                <div
                  key={job.id}
                  className="flex items-center space-x-4 p-5 rounded-lg border hover:bg-muted/50 transition-colors bg-white"
                >
                  <Checkbox
                    checked={selectedJobIds.includes(job.id)}
                    onCheckedChange={(checked) => 
                      handleJobSelection(job.id, checked as boolean)
                    }
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {job.jobNumber || "No Job #"}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="truncate">{job.companyName}</span>
                      {job.jobDate && (
                        <span>{format(new Date(job.jobDate), "MMM d, yyyy")}</span>
                      )}
                      {job.totalAmount && (
                        <span>${(job.totalAmount / 100).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linking}
            className="min-w-[120px] px-6 py-2.5"
          >
            Skip for now
          </Button>
          
          <Button
            onClick={handleLinkJobs}
            disabled={linking || matchingJobs.length === 0}
            className="flex items-center gap-2 min-w-[140px] px-6 py-2.5"
          >
            {linking ? (
              "Linking..."
            ) : matchingJobs.length === 0 ? (
              "No jobs to link"
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Link {selectedJobIds.length} jobs
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}