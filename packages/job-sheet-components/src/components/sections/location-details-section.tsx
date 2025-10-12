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
import type { LocationSectionProps } from "../../types";

export function LocationDetailsSection({
  data,
  locationId,
  isLoading,
}: LocationSectionProps) {
  if (!data?.locationId && !locationId) return null;

  const hasAddress =
    data?.locationAddress ||
    data?.locationCity ||
    data?.locationState ||
    data?.locationZip;

  return (
    <AccordionItem value="location" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <Icons.MapPin className="size-4" />
          <span className="font-medium">Location Details</span>
          {data?.locationName && (
            <Badge variant="secondary" className="ml-2">
              {data.locationName}
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
                  Location Name
                </span>
                {data?.locationId ? (
                  <Link
                    href={`/locations?locationId=${data.locationId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium block"
                  >
                    {data.locationName || "View Location"}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">
                    {data?.locationName || "-"}
                  </p>
                )}
              </div>

              {hasAddress && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Address
                  </span>
                  <div className="text-sm space-y-0.5">
                    {data?.locationAddress && <p>{data.locationAddress}</p>}
                    {(data?.locationCity ||
                      data?.locationState ||
                      data?.locationZip) && (
                      <p>
                        {[
                          data?.locationCity,
                          data?.locationState,
                          data?.locationZip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
