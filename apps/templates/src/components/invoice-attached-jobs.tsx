"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "../utils/format";
import type { LineItem } from "@midday/invoice-core/types";

interface InvoiceAttachedJobsProps {
  lineItems: LineItem[] | null;
  currency: string;
}

export function InvoiceAttachedJobs({ lineItems, currency }: InvoiceAttachedJobsProps) {
  if (!lineItems || lineItems.length === 0) {
    return null;
  }

  // Filter items that have a job ID or job number
  const jobItems = lineItems.filter((item) => item.jobId || item.jobNumber);
  
  if (jobItems.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icons.Inventory2 className="h-4 w-4" />
          Jobs ({jobItems.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <DropdownMenuLabel>Attached Jobs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {jobItems.map((item, index) => (
          <DropdownMenuItem key={item.jobId || item.jobNumber || index} className="flex flex-col items-start py-2">
            <div className="flex justify-between w-full">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">
                {formatAmount({ 
                  currency, 
                  amount: item.total || ((item.price || 0) * (item.quantity || 1)) 
                })}
              </span>
            </div>
            {item.description && (
              <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </span>
            )}
            {item.jobNumber && (
              <span className="text-xs text-muted-foreground mt-1">
                Job #{item.jobNumber}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Total from Jobs</span>
            <span>
              {formatAmount({ 
                currency, 
                amount: jobItems.reduce((sum, item) => 
                  sum + (item.total || ((item.price || 0) * (item.quantity || 1))), 0)
              })}
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}