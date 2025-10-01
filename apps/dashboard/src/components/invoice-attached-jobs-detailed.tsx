"use client";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FormatAmount } from "./format-amount";

interface InvoiceAttachedJobsDetailedProps {
  invoiceId: string;
  currency?: string;
}

export function InvoiceAttachedJobsDetailed({ 
  invoiceId, 
  currency = "AUD" 
}: InvoiceAttachedJobsDetailedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();

  const { data: jobs, isLoading } = useQuery(
    trpc.job.getByInvoiceId.queryOptions(
      { invoiceId },
      {
        enabled: !!invoiceId,
      }
    )
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  const totalAmount = jobs.reduce((sum, job) => {
    const amount = (job.pricePerUnit || 0) * (job.cubicMetreCapacity || job.volume || 0);
    return sum + amount;
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#878787] font-mono">
                Attached Jobs
              </span>
              <Badge variant="secondary" className="rounded-full h-5 px-2">
                {jobs.length}
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-[#878787]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#878787]" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Jobs Summary */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#878787]">Total Jobs Value:</span>
              <span className="font-mono font-semibold">
                <FormatAmount amount={totalAmount * 100} currency={currency} />
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#878787]">Jobs Count:</span>
              <span className="font-mono">{jobs.length}</span>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs?jobId=${job.id}`}
                className="block group"
              >
                <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-[#878787]" />
                      <span className="font-mono text-sm font-medium">
                        {job.jobNumber}
                      </span>
                      <Badge className={`${getStatusColor(job.status)} text-[10px] px-1.5 py-0`}>
                        {job.status}
                      </Badge>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#878787] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {job.jobDate && (
                      <div className="flex items-center gap-1 text-[#878787]">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(job.jobDate), "MMM d, yyyy")}</span>
                      </div>
                    )}

                    {job.companyName && (
                      <div className="flex items-center gap-1 text-[#878787]">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{job.companyName}</span>
                      </div>
                    )}

                    {job.addressSite && (
                      <div className="flex items-center gap-1 text-[#878787] col-span-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{job.addressSite}</span>
                      </div>
                    )}

                    {job.materialType && (
                      <div className="flex items-center gap-1 text-[#878787]">
                        <Package className="h-3 w-3" />
                        <span>{job.materialType}</span>
                      </div>
                    )}

                    {job.rego && (
                      <div className="flex items-center gap-1 text-[#878787]">
                        <Truck className="h-3 w-3" />
                        <span>{job.rego}</span>
                      </div>
                    )}
                  </div>

                  {(job.pricePerUnit || job.totalAmount) && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#878787]">Amount:</span>
                        <span className="font-mono text-sm font-medium">
                          {job.pricePerUnit && (job.cubicMetreCapacity || job.volume) ? (
                            <FormatAmount 
                              amount={(job.pricePerUnit * (job.cubicMetreCapacity || job.volume || 0)) * 100} 
                              currency={currency} 
                            />
                          ) : job.totalAmount ? (
                            <FormatAmount amount={job.totalAmount} currency={currency} />
                          ) : (
                            "-"
                          )}
                        </span>
                      </div>
                      {job.cubicMetreCapacity && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-[#878787]">Volume:</span>
                          <span className="font-mono text-xs">{job.cubicMetreCapacity} m³</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Jobs Link */}
          <div className="pt-2">
            <Link href={`/jobs?invoiceId=${invoiceId}`}>
              <Button variant="outline" size="sm" className="w-full">
                View All Jobs in Table
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}