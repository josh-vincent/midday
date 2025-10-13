"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { format } from "date-fns";
import type { SectionProps } from "../../types";

export function JobDetailsSection({ data, isLoading }: SectionProps) {
  const hasJobDetails =
    data?.rego ||
    data?.materialType ||
    data?.equipmentType ||
    data?.addressSite ||
    data?.jobDate ||
    data?.scheduledDate ||
    data?.loadNumber;

  if (!hasJobDetails) return null;

  return (
    <AccordionItem value="job-details" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="font-medium">Job Details</span>
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
              {/* Rego */}
              {data?.rego && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rego
                  </span>
                  <Badge variant="outline" className="font-bold text-base">
                    {data.rego}
                  </Badge>
                </div>
              )}

              {/* Job Date */}
              {(data?.jobDate || data?.scheduledDate) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-sm">
                    {format(
                      new Date(data.jobDate || data.scheduledDate!),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
              )}

              {/* Load Number */}
              {data?.loadNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Load Number
                  </span>
                  <span className="text-sm">#{data.loadNumber}</span>
                </div>
              )}

              {/* Material Type */}
              {data?.materialType && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Material Type
                  </span>
                  <p className="text-sm">{data.materialType}</p>
                </div>
              )}

              {/* Equipment Type */}
              {data?.equipmentType && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Equipment
                  </span>
                  <p className="text-sm">{data.equipmentType}</p>
                </div>
              )}

              {/* Address/Site */}
              {data?.addressSite && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Site Address
                  </span>
                  <p className="text-sm">{data.addressSite}</p>
                </div>
              )}

              {/* Source Location */}
              {data?.sourceLocation && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Source Location
                  </span>
                  <p className="text-sm">{data.sourceLocation}</p>
                </div>
              )}

              {/* Destination Site */}
              {data?.destinationSite && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Destination
                  </span>
                  <p className="text-sm">{data.destinationSite}</p>
                </div>
              )}

              {/* Volume/Capacity */}
              {(data?.cubicMetreCapacity || data?.quantityCubicMeters) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Volume (m³)
                  </span>
                  <span className="text-sm font-medium">
                    {data.cubicMetreCapacity || data.quantityCubicMeters} m³
                  </span>
                </div>
              )}

              {/* Weight */}
              {data?.weightKg && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Weight
                  </span>
                  <span className="text-sm font-medium">
                    {data.weightKg.toFixed(2)} kg
                  </span>
                </div>
              )}

              {/* Price Per Unit */}
              {(data?.pricePerUnit || data?.pricePerCubicMeter) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price/m³
                  </span>
                  <span className="text-sm font-medium">
                    ${(data.pricePerUnit || data.pricePerCubicMeter)?.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              {data?.totalAmount && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-base font-bold">
                    ${(data.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
