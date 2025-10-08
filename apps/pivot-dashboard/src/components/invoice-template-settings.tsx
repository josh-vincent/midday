"use client";

import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TemplateBasicInfo } from "./invoice-template/template-basic-info";
import { TemplateFormatOptions } from "./invoice-template/template-format-options";
import { TemplateFromDetails } from "./invoice-template/template-from-details";
import { TemplateLabels } from "./invoice-template/template-labels";
import { TemplatePaymentDetails } from "./invoice-template/template-payment-details";

export function InvoiceTemplateSettings() {
  const trpc = useTRPC();

  // Get the current template
  const { data: template, isLoading } = useQuery(
    trpc.invoiceTemplate.get.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TemplateBasicInfo template={template} />
      <TemplateLabels template={template} />
      <TemplateFormatOptions template={template} />
      <TemplateFromDetails template={template} />
      <TemplatePaymentDetails template={template} />
    </div>
  );
}
