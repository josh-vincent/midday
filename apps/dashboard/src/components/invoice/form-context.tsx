"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import React, { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

export const invoiceTemplateSchema = z.object({
  title: z.string().optional(),
  customerLabel: z.string(),
  fromLabel: z.string(),
  invoiceNoLabel: z.string(),
  issueDateLabel: z.string(),
  dueDateLabel: z.string(),
  descriptionLabel: z.string(),
  priceLabel: z.string(),
  quantityLabel: z.string(),
  totalLabel: z.string(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string(),
  noteLabel: z.string(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  size: z.enum(["a4", "letter"]),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Description is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  price: z.number(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
  jobId: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  template: invoiceTemplateSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  paymentDetails: z.any(),
  noteDetails: z.any().optional(),
  dueDate: z.string(),
  issueDate: z.string(),
  invoiceNumber: z.string(),
  logoUrl: z.string().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  amount: z.number(),
  lineItems: z.array(lineItemSchema).min(0),
  token: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type FormContextProps = {
  children: React.ReactNode;
  data?: RouterOutputs["invoice"]["getById"];
  defaultSettings?: RouterOutputs["invoice"]["defaultSettings"];
  jobData?: RouterOutputs["job"]["getById"];
  selectedJobs?: any;
};

export function FormContext({
  children,
  data,
  defaultSettings,
  jobData,
  selectedJobs,
}: FormContextProps) {
  // Use a ref to track if we've initialized with job data
  const hasInitializedWithJobs = React.useRef(false);
  const hasInitializedWithDefaults = React.useRef(false);
  
  const form = useZodForm(invoiceFormSchema, {
    // @ts-expect-error
    defaultValues: defaultSettings,
    mode: "onChange",
  });

  useEffect(() => {
    // Skip if we've already initialized with jobs and there are no new jobs
    if (hasInitializedWithJobs.current && selectedJobs) {
      return;
    }
    
    // Skip if we've already initialized with defaults and no new data
    if (hasInitializedWithDefaults.current && !data && !jobData && !selectedJobs) {
      return;
    }
    
    // Only reset the form when we have default settings or data
    if (!defaultSettings && !data) {
      return;
    }

    console.log("FormContext useEffect triggered with:", {
      hasDefaultSettings: !!defaultSettings,
      hasData: !!data,
      hasJobData: !!jobData,
      hasSelectedJobs: !!selectedJobs,
      selectedJobsLength: selectedJobs?.length,
      hasInitializedWithJobs: hasInitializedWithJobs.current,
      hasInitializedWithDefaults: hasInitializedWithDefaults.current
    });

    // Build line items from job data
    let lineItems = data?.lineItems;
    
    if (!data && jobData) {
      // Single job conversion
      lineItems = [{
        name: jobData.description || `Job ${jobData.jobNumber}`,
        quantity: jobData.volume || 1,
        unit: jobData.volume ? "m³" : undefined,
        price: (jobData.totalAmount || 0) / 100, // Convert from cents to dollars
        jobId: jobData.id,
      }];
    } else if (!data && selectedJobs && selectedJobs.length > 0) {
      // Multiple jobs from bulk selection
      lineItems = selectedJobs.flatMap((group: any) => 
        group.jobs.map((job: any) => ({
          name: job.description || `Job ${job.jobNumber}`,
          quantity: job.volume || 1,
          unit: job.volume ? "m³" : undefined,
          price: (job.totalAmount || 0) / 100, // Convert from cents to dollars
          jobId: job.id,
        }))
      );
    }

    // Calculate totals from line items
    let subtotal = 0;
    let amount = 0;
    if (lineItems && lineItems.length > 0) {
      subtotal = lineItems.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);
      amount = subtotal; // Add tax/vat/discount calculations here if needed
    }

    // Get customer info from selected jobs
    const customerFromJobs = selectedJobs?.[0]?.jobs?.[0] || selectedJobs?.[0];
    const customerName = data?.customerName ?? jobData?.companyName ?? customerFromJobs?.customerName ?? customerFromJobs?.companyName ?? undefined;
    const customerId = data?.customerId ?? jobData?.customerId ?? customerFromJobs?.customerId ?? defaultSettings?.customerId ?? undefined;

    // Build customer details
    let customerDetails = data?.customerDetails ?? defaultSettings?.customerDetails;
    if (!data && customerName && !customerDetails) {
      customerDetails = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: customerName,
              },
            ],
          },
        ],
      });
    }

    // Build the form data with proper priority:
    // 1. Existing invoice data (when editing)
    // 2. Job/selected jobs data (when creating from jobs)  
    // 3. Default settings (fallback)
    const formData = {
      ...(defaultSettings ?? {}),
      ...(data ?? {}),
      // @ts-expect-error
      template: {
        ...(defaultSettings?.template ?? {}),
        ...(data?.template ?? {}),
      },
      fromDetails: data?.fromDetails ?? defaultSettings?.fromDetails,
      paymentDetails: data?.paymentDetails ?? defaultSettings?.paymentDetails,
      customerId,
      customerName,
      customerDetails,
      // Priority: edited invoice > job lineItems > default lineItems
      lineItems: lineItems && lineItems.length > 0 ? lineItems : (defaultSettings?.lineItems || []),
      subtotal: subtotal > 0 ? subtotal : (data?.subtotal || defaultSettings?.subtotal || 0),
      amount: amount > 0 ? amount : (data?.amount || defaultSettings?.amount || 0),
    };

    console.log("About to reset form with:", {
      lineItemsCount: formData.lineItems?.length,
      customerName: formData.customerName,
      customerId: formData.customerId,
      subtotal: formData.subtotal,
      amount: formData.amount
    });

    form.reset(formData);
    
    // Mark as initialized based on what we have
    if (selectedJobs || jobData) {
      hasInitializedWithJobs.current = true;
    } else {
      hasInitializedWithDefaults.current = true;
    }
    
    // Only run this effect once for each type of data
  }, [
    // Only trigger on actual data changes, not every render
    data?.id,
    defaultSettings?.id,
    jobData?.id,
    selectedJobs ? "has-jobs" : "no-jobs"
  ]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
