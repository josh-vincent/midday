"use client";

import { getWebsiteLogo } from "@midday/utils/logos";
import { getInitials } from "@/utils/format";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
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

  return (
    <div className="flex items-center gap-2 w-10 md:w-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="size-5 flex-shrink-0">
              {customer?.website || customer?.email && (
                <AvatarImageNext
                  src={getWebsiteLogo(customer?.website || customer?.email)}
                  alt={`${name} logo`}
                  width={20}
                  height={20}
                  quality={100}
                />
              )}
              <AvatarFallback className="text-[9px] font-medium">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right" className="md:hidden">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{name}</p>
              {customer?.email && (
                <p className="text-xs text-muted-foreground">
                  {customer.email}
                </p>
              )}
              {customer?.phone && (
                <p className="text-xs text-muted-foreground">
                  {customer.phone}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="truncate hidden md:inline">{name}</span>

      {viewAt && invoice.status !== "paid" && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2 hidden md:flex">
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
      )}
    </div>
  );
}
