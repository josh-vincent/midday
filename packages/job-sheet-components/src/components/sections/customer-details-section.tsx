"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import type { CustomerSectionProps } from "../../types";

export function CustomerDetailsSection({
  data,
  customerId,
  isLoading,
}: CustomerSectionProps) {
  // Support both nested customer object and flat fields
  const customerIdValue = data?.customerId || customerId || data?.customer?.id;
  const customerName = data?.customerName || data?.customer?.name || data?.companyName;
  const customerEmail = data?.customerEmail || data?.customer?.email;
  const customerPhone = data?.customerPhone || data?.customer?.phone || data?.contactNumber;
  const contactPerson = data?.contactPerson;

  // Don't render if no customer info at all
  if (!customerIdValue && !customerName && !contactPerson) return null;

  return (
    <AccordionItem value="customer" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <Icons.Users className="size-4" />
          <span className="font-medium">Customer Details</span>
          {customerName && (
            <Badge variant="secondary" className="ml-2">
              {customerName}
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
              {customerName && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer Name
                  </span>
                  {customerIdValue ? (
                    <Link
                      href={`/customers?customerId=${customerIdValue}`}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium block"
                    >
                      {customerName}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{customerName}</p>
                  )}
                </div>
              )}

              {contactPerson && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact Person
                  </span>
                  <p className="text-sm">{contactPerson}</p>
                </div>
              )}

              {customerEmail && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </span>
                  <a
                    href={`mailto:${customerEmail}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {customerEmail}
                  </a>
                </div>
              )}

              {customerPhone && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Phone
                  </span>
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    {customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
