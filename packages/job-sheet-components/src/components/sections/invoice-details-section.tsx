"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { format } from "date-fns";
import type { InvoiceSectionProps } from "../../types";

const invoiceStatusColors = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  unpaid: "bg-red-500/10 text-red-600 border-red-500/20",
  paid: "bg-green-500/10 text-green-600 border-green-500/20",
  canceled: "bg-muted text-muted-foreground border-muted",
  overdue: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export function InvoiceDetailsSection({
  data,
  invoiceId,
  isLoading,
}: InvoiceSectionProps) {
  if (!data?.invoiceId && !invoiceId) return null;

  return (
    <AccordionItem value="invoice" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <Icons.Receipt className="size-4" />
          <span className="font-medium">Invoice Details</span>
          {data?.invoiceStatus && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs ml-2",
                invoiceStatusColors[data.invoiceStatus as keyof typeof invoiceStatusColors],
              )}
            >
              <span className="mr-1 size-1.5 rounded-full bg-current" />
              {data.invoiceStatus.toUpperCase()}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invoice Number
                </span>
                {data?.invoiceId ? (
                  <Link
                    href={`/invoices?type=edit&invoiceId=${data.invoiceId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium block"
                  >
                    {data.invoiceNumber || "View Invoice"}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">
                    {data?.invoiceNumber || "-"}
                  </p>
                )}
              </div>

              {data?.invoiceAmount && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="text-sm font-medium">
                    ${data.invoiceAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {data?.invoiceDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Issue Date
                  </span>
                  <span className="text-sm">
                    {format(new Date(data.invoiceDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}

              {data?.invoiceStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      invoiceStatusColors[data.invoiceStatus as keyof typeof invoiceStatusColors],
                    )}
                  >
                    {data.invoiceStatus.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
