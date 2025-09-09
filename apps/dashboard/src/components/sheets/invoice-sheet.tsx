"use client";

import { InvoiceContent } from "@/components/invoice-content";
import { FormContext } from "@/components/invoice/form-context";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import { Sheet } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const router = useRouter();
  const { setParams, type, invoiceId, jobId, fromJobs } = useInvoiceParams();
  const [showSetupAlert, setShowSetupAlert] = React.useState(false);
  
  // Check if templates are configured
  const { data: templateConfig } = useQuery(
    trpc.invoiceTemplate.isConfigured.queryOptions()
  );

  const isOpen = type === "create" || type === "edit" || type === "success";
  
  // Check if trying to create but templates not configured
  const shouldShowSetupAlert = type === "create" && templateConfig && !templateConfig.isConfigured;
  
  React.useEffect(() => {
    if (shouldShowSetupAlert) {
      setShowSetupAlert(true);
      // Clear the type to prevent the sheet from opening
      setParams({ type: null });
    }
  }, [shouldShowSetupAlert, setParams]);

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

  const handleSetupInvoicing = () => {
    setShowSetupAlert(false);
    router.push("/settings/invoice");
  };

  return (
    <>
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

      <AlertDialog open={showSetupAlert} onOpenChange={setShowSetupAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setup Required</AlertDialogTitle>
            <AlertDialogDescription>
              Before creating invoices, you need to setup your invoice templates with company details and payment information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetupInvoicing}>
              Setup Invoicing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
