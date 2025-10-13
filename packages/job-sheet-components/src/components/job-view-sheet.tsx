"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@midday/ui/sheet";
import {
  Accordion,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import Link from "next/link";
import type { JobViewSheetProps } from "../types";
import {
  CustomerDetailsSection,
  LocationDetailsSection,
  InvoiceDetailsSection,
  TimelineSection,
  JobDetailsSection,
} from "./sections";

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
  on_hold: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
};

const priorityColors = {
  emergency: "bg-destructive/10 text-destructive border-destructive/20",
  urgent: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  high: "bg-orange-400/10 text-orange-500 border-orange-400/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-muted",
};

interface JobViewSheetComponentProps extends JobViewSheetProps {
  data?: any;
  isLoading?: boolean;
  onEdit?: () => void;
}

export function JobViewSheet({
  isOpen,
  onOpenChange,
  data,
  isLoading,
  onEdit,
  showCustomerSection = true,
  showLocationSection = true,
  showInvoiceSection = true,
  showTimelineSection = true,
}: JobViewSheetComponentProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[580px] flex flex-col">
        <div className="flex-1 overflow-y-auto pb-16">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SheetTitle className="text-lg font-semibold">
                    {data?.title || data?.jobNumber || "Job Details"}
                  </SheetTitle>
                  <div className="flex items-center gap-2">
                    {data?.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          statusColors[data.status as keyof typeof statusColors],
                        )}
                      >
                        <span className="mr-1 size-1.5 rounded-full bg-current" />
                        {data.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    )}
                    {data?.priority && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          priorityColors[data.priority as keyof typeof priorityColors],
                        )}
                      >
                        {data.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onEdit}
                    >
                      <Icons.Edit className="size-3" />
                    </Button>
                  )}
                  {data?.id && (
                    <Link href={`/jobs/${data.id}`}>
                      <Button type="button" variant="default" size="sm">
                        <Icons.ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Description */}
              {data?.description && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Accordion Sections */}
              <Accordion type="single" collapsible className="w-full">
                {/* Job Details Section - Always show if data exists */}
                <JobDetailsSection data={data} isLoading={isLoading} />

                {showCustomerSection && (
                  <CustomerDetailsSection
                    data={data}
                    customerId={data?.customerId}
                    isLoading={isLoading}
                  />
                )}

                {showLocationSection && (
                  <LocationDetailsSection
                    data={data}
                    locationId={data?.locationId}
                    isLoading={isLoading}
                  />
                )}

                {showInvoiceSection && (
                  <InvoiceDetailsSection
                    data={data}
                    invoiceId={data?.invoiceId}
                    isLoading={isLoading}
                  />
                )}

                {showTimelineSection && (
                  <TimelineSection
                    events={data?.timeline}
                    isLoading={isLoading}
                  />
                )}
              </Accordion>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
