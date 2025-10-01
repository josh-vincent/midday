"use client";

import { useZodForm } from "../../context/dependencies-context";
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
  linkedJobIds: z.array(z.string()).optional(),
  updateJobsOnCreation: z.boolean().optional(),
  jobDescriptionFields: z.array(z.string()).optional(),
  token: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type FormContextProps = {
  children: React.ReactNode;
  data?: RouterOutputs["invoice"]["getById"];
  defaultSettings?: RouterOutputs["invoice"]["defaultSettings"];
  jobData?: RouterOutputs["job"]["getById"];
  multipleJobsData?: any; // Jobs from jobIds URL param
  selectedJobs?: any;
  preselectedCustomerId?: string | null;
};

export function FormContext({
  children,
  data,
  defaultSettings,
  jobData,
  multipleJobsData,
  selectedJobs,
  preselectedCustomerId,
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
      // Single job conversion - Build comprehensive description
      const buildJobDescription = (job: any) => {
        const parts = [];
        
        // Add job number if available
        if (job.jobNumber) {
          parts.push(`Job ${job.jobNumber}`);
        }
        
        // Add job date if available
        if (job.jobDate) {
          const date = new Date(job.jobDate);
          const formattedDate = date.toLocaleDateString();
          parts.push(formattedDate);
        }
        
        // Add address/site if available
        if (job.addressSite) {
          parts.push(job.addressSite);
        }
        
        // Add original description if available and not redundant
        if (job.description && !parts.some(part => part.includes(job.description))) {
          parts.push(job.description);
        }
        
        return parts.length > 0 ? parts.join(' - ') : "Job Item";
      };

      lineItems = [{
        name: buildJobDescription(jobData),
        quantity: Math.max(jobData.volume || jobData.cubicMetreCapacity || 1, 1),
        unit: (jobData.volume || jobData.cubicMetreCapacity) ? "m³" : undefined,
        price: jobData.pricePerUnit || Math.max((jobData.totalAmount || 0) / 100, 0), // Use price per unit (in dollars) first, fallback to total amount converted from cents
        jobId: jobData.id,
      }];
    } else if (!data && selectedJobs && selectedJobs.length > 0) {
      // Multiple jobs from bulk selection
      const buildJobDescription = (job: any) => {
        const parts = [];
        
        // Add job number if available
        if (job.jobNumber) {
          parts.push(`Job ${job.jobNumber}`);
        }
        
        // Add job date if available
        if (job.jobDate) {
          const date = new Date(job.jobDate);
          const formattedDate = date.toLocaleDateString();
          parts.push(formattedDate);
        }
        
        // Add address/site if available
        if (job.addressSite) {
          parts.push(job.addressSite);
        }
        
        // Add original description if available and not redundant
        if (job.description && !parts.some(part => part.includes(job.description))) {
          parts.push(job.description);
        }
        
        return parts.length > 0 ? parts.join(' - ') : "Job Item";
      };

      lineItems = selectedJobs.flatMap((group: any) => 
        group.jobs.map((job: any) => ({
          name: buildJobDescription(job),
          quantity: Math.max(job.volume || job.cubicMetreCapacity || 1, 1),
          unit: (job.volume || job.cubicMetreCapacity) ? "m³" : undefined,
          price: job.pricePerUnit || Math.max((job.totalAmount || 0) / 100, 0), // Use price per unit (in dollars) first, fallback to total amount converted from cents
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
    // Priority: existing data > URL param > job data > default settings
    const customerId = data?.customerId ?? preselectedCustomerId ?? jobData?.customerId ?? customerFromJobs?.customerId ?? defaultSettings?.customerId ?? undefined;

    // Build comprehensive customer details from job data
    let customerDetails = data?.customerDetails ?? defaultSettings?.customerDetails;
    if (!data && customerName && !customerDetails) {
      const jobForCustomer = jobData || customerFromJobs;
      const customerDetailsParts = [];
      
      // Add customer/company name
      customerDetailsParts.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: customerName,
          marks: [{ type: "bold" }]
        }],
      });
      
      // Add contact person if available
      if (jobForCustomer?.contactPerson) {
        customerDetailsParts.push({
          type: "paragraph", 
          content: [{
            type: "text",
            text: `Contact: ${jobForCustomer.contactPerson}`,
          }],
        });
      }
      
      // Add contact number if available
      if (jobForCustomer?.contactNumber) {
        customerDetailsParts.push({
          type: "paragraph",
          content: [{
            type: "text", 
            text: `Phone: ${jobForCustomer.contactNumber}`,
          }],
        });
      }
      
      // Add address if available
      if (jobForCustomer?.addressSite) {
        customerDetailsParts.push({
          type: "paragraph",
          content: [{
            type: "text",
            text: jobForCustomer.addressSite,
          }],
        });
      }

      customerDetails = JSON.stringify({
        type: "doc",
        content: customerDetailsParts,
      });
    }

    // No conversion needed - amounts should be in the correct format already

    // Collect all job IDs from all sources for linking
    const allJobIds = new Set<string>();

    // From single job URL param
    if (jobData?.id) {
      allJobIds.add(jobData.id);
    }

    // From multiple jobs URL param
    if (multipleJobsData && Array.isArray(multipleJobsData)) {
      multipleJobsData.forEach((job: any) => {
        if (job.id) allJobIds.add(job.id);
      });
    }

    // From selected jobs (sessionStorage or legacy)
    if (selectedJobs) {
      const jobsArray = Array.isArray(selectedJobs) ? selectedJobs : [selectedJobs];
      jobsArray.forEach((item: any) => {
        // Handle grouped structure or flat structure
        const jobs = item.jobs || [item];
        jobs.forEach((job: any) => {
          if (job.id) allJobIds.add(job.id);
        });
      });
    }

    // From line items that have jobId
    if (lineItems && lineItems.length > 0) {
      lineItems.forEach((item: any) => {
        if (item.jobId) allJobIds.add(item.jobId);
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
      lineItems: lineItems && lineItems.length > 0
        ? lineItems
        : (data?.lineItems || defaultSettings?.lineItems || []),
      // Use amounts as-is from the data
      subtotal: subtotal > 0 ? subtotal : (data?.subtotal || defaultSettings?.subtotal || 0),
      amount: amount > 0 ? amount : (data?.amount || defaultSettings?.amount || 0),
      tax: data?.tax || defaultSettings?.tax || 0,
      vat: data?.vat || defaultSettings?.vat || 0,
      discount: data?.discount || defaultSettings?.discount || 0,
      // Add collected job IDs for linking
      linkedJobIds: allJobIds.size > 0 ? Array.from(allJobIds) : (data?.linkedJobIds || []),
    };

    console.log("About to reset form with:", {
      lineItemsCount: formData.lineItems?.length,
      customerName: formData.customerName,
      customerId: formData.customerId,
      customerDetails: formData.customerDetails,
      subtotal: formData.subtotal,
      amount: formData.amount,
      hasJobData: !!jobData,
      hasSelectedJobs: !!selectedJobs,
      lineItems: formData.lineItems,
    });

    form.reset(formData);
    
    // Force the form to be dirty when we have job data so auto-save triggers
    if ((selectedJobs || jobData) && !data) {
      // Set a field to mark form as dirty and trigger auto-save
      setTimeout(() => {
        form.setValue('customerName', formData.customerName || '', { shouldDirty: true });
      }, 100);
    }
    
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
    multipleJobsData ? "has-multiple-jobs" : "no-multiple-jobs",
    selectedJobs ? "has-jobs" : "no-jobs",
    preselectedCustomerId,
  ]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
