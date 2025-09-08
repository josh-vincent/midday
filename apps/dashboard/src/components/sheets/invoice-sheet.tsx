"use client";

import { InvoiceContent } from "@/components/invoice-content";
import { FormContext } from "@/components/invoice/form-context";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { Sheet } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const { setParams, type, invoiceId, jobId, fromJobs } = useInvoiceParams();
  const isOpen = type === "create" || type === "edit" || type === "success";

  // Get default settings for new invoices - only when sheet is open
  const { data: defaultSettings, refetch } = useQuery({
    ...trpc.invoice.defaultSettings.queryOptions(),
    enabled: isOpen,
  });

  // Get draft invoice for edit
  const { data } = useQuery(
    trpc.invoice.getById.queryOptions(
      {
        id: invoiceId!,
      },
      {
        enabled: !!invoiceId,
      },
    ),
  );

  // Get job data if converting from job
  const { data: jobData } = useQuery(
    trpc.job.getById.queryOptions(
      { id: jobId! },
      { 
        enabled: !!jobId && type === "create",
      }
    ),
  );

  // Get selected jobs from sessionStorage for bulk invoice
  const [selectedJobs, setSelectedJobs] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (fromJobs === "true" && typeof window !== "undefined") {
      const stored = sessionStorage.getItem("selectedJobsForInvoice");
      if (stored) {
        const jobs = JSON.parse(stored);
        setSelectedJobs(jobs);
        // Only clear after successfully creating the invoice
        // sessionStorage.removeItem("selectedJobsForInvoice");
      }
    }
  }, [fromJobs]);

  const handleOnOpenChange = (open: boolean) => {
    // Refetch default settings when the sheet is closed
    if (!open) {
      refetch();
      // Clear selected jobs from sessionStorage when closing
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("selectedJobsForInvoice");
      }
      setSelectedJobs(null);
    }

    setParams(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <FormContext 
        defaultSettings={defaultSettings} 
        data={data}
        jobData={jobData}
        selectedJobs={selectedJobs}
      >
        <InvoiceContent />
      </FormContext>
    </Sheet>
  );
}
