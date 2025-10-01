"use client";

import { useInvoiceParams } from "../../hooks/use-invoice-params";
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
import React from "react";

type InvoiceSheetProps = {
  trpc: any;
  router: any;
  InvoiceContent: React.ComponentType;
  FormContext: React.ComponentType<{
    defaultSettings?: any;
    data?: any;
    jobData?: any;
    selectedJobs?: any;
    children: React.ReactNode;
  }>;
};

export function InvoiceSheet({
  trpc,
  router,
  InvoiceContent,
  FormContext
}: InvoiceSheetProps) {
  const { setParams, type, invoiceId, jobId, fromJobs, templateId, jobIds, selectedCustomerId } = useInvoiceParams();
  const [showSetupAlert, setShowSetupAlert] = React.useState(false);

  // Check if templates are configured (using workaround endpoint)
  const { data: templateConfig } = useQuery(
    trpc.invoice.templateIsConfigured.queryOptions()
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
  // If templateId is provided, we'll override defaults with that template
  const { data: defaultSettings, refetch } = useQuery({
    ...trpc.invoice.defaultSettings.queryOptions(),
    enabled: isOpen && !templateId,
  });

  // Get specific template if templateId param is provided
  const { data: templateSettings } = useQuery(
    trpc.invoiceTemplate.getById.queryOptions(
      { id: templateId! },
      {
        enabled: !!templateId && isOpen,
      }
    ),
  );

  // Use template settings if available, otherwise default settings
  const effectiveSettings = templateSettings || defaultSettings;

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

  // Get job data if converting from single job
  const { data: jobData } = useQuery(
    trpc.job.getById.queryOptions(
      { id: jobId! },
      {
        enabled: !!jobId && type === "create",
      }
    ),
  );

  // Get multiple jobs data if jobIds param is provided
  const { data: multipleJobsData } = useQuery(
    trpc.job.getByIds.queryOptions(
      { ids: jobIds || [] },
      {
        enabled: !!jobIds && jobIds.length > 0 && type === "create",
      }
    ),
  );

  // Get selected jobs from sessionStorage for bulk invoice (legacy method)
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

  // Determine which jobs data to use (priority: URL params > sessionStorage)
  const effectiveJobsData = multipleJobsData || selectedJobs;

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
          defaultSettings={effectiveSettings}
          data={data}
          jobData={jobData}
          multipleJobsData={multipleJobsData}
          selectedJobs={effectiveJobsData}
          preselectedCustomerId={selectedCustomerId}
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