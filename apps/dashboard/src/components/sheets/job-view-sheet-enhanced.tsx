"use client";

import { JobViewSheet } from "@midday/job-sheet-components/job-view-sheet";
import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/trpc/client";
import { useJobsStore } from "@/store/jobs";
import { useState, useMemo } from "react";

export function JobViewSheetEnhanced() {
  const trpc = useTRPC();
  const { params, setParams } = useJobParams();
  const [isEditing, setIsEditing] = useState(false);

  const isOpen = !!params.jobId && !params.createJob;

  // Get job data from the store (which is populated by the table)
  const jobData = useMemo(() => {
    if (!params.jobId) return null;

    // Try to get from Zustand store first (populated by data-table)
    const { jobs } = useJobsStore.getState();
    const job = jobs.find((j: any) => j.id === params.jobId);

    if (job) {
      return job;
    }

    return null;
  }, [params.jobId]);

  const handleClose = () => {
    setParams({ jobId: null });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // You can switch to the edit sheet or inline edit mode
  };

  return (
    <JobViewSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      data={jobData || undefined}
      isLoading={false}
      onEdit={handleEdit}
      trpcClient={trpc}
      // Configure which sections to show based on your schema
      showCustomerSection={true}
      showLocationSection={false} // No location in current schema
      showInvoiceSection={jobData?.invoiceId ? true : false}
      showTimelineSection={false} // Add when you have timeline data
    />
  );
}
