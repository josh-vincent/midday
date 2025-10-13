"use client";

import { getWebsiteLogo } from "@midday/utils/logos";
import { AvatarCell } from "@midday/table-components/components";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@midday/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import type { Invoice } from "./columns";

interface CustomerCellProps {
  invoice: Invoice;
}

export function CustomerCell({ invoice }: CustomerCellProps) {
  const customer = invoice.customer;
  const name = customer?.name || invoice.customerName;
  const viewAt = invoice.viewedAt;

  if (!name) return <span className="text-muted-foreground">-</span>;

  // Prepare tooltip details
  const tooltipDetails = [];
  if (customer?.email) {
    tooltipDetails.push({ value: customer.email });
  }
  if (customer?.phone) {
    tooltipDetails.push({ value: customer.phone });
  }

  return (
    <AvatarCell
      name={name}
      logoUrl={customer?.website || customer?.email ? getWebsiteLogo(customer.website || customer.email) : null}
      avatarSize="md"
      tooltipDetails={tooltipDetails}
      avatarClassName="rounded-none bg-accent text-accent-foreground"
      className="flex items-center gap-2 w-10 md:max-w-[400px]"
      actionElement={
        viewAt && invoice.status !== "paid" && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="flex items-center space-x-2 md:flex">
                <Icons.Visibility className="size-4 text-[#878787]" />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs py-1 px-2"
                side="right"
                sideOffset={5}
              >
                {viewAt
                  ? `Viewed ${formatDistanceToNow(new Date(viewAt))} ago`
                  : ""}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    />
  );
}
