"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Icons } from "@midday/ui/icons";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { TimelineSectionProps } from "../../types";

export function TimelineSection({
  events = [],
  isLoading,
}: TimelineSectionProps) {
  if (!events || events.length === 0) {
    return (
      <AccordionItem value="timeline" className="border-b">
        <AccordionTrigger className="py-3">
          <div className="flex items-center gap-2">
            <Icons.History className="size-4" />
            <span className="font-medium">Timeline</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-2">
          <div className="text-center py-6">
            <Icons.History className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No timeline events yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Updates and status changes will appear here
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem value="timeline" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <Icons.History className="size-4" />
          <span className="font-medium">Timeline</span>
          <Badge variant="secondary" className="ml-2">
            {events.length}
          </Badge>
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
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                {index !== events.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                )}
                <div className="flex gap-4">
                  <Avatar className="size-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {event.user?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {event.user && (
                      <p className="text-xs text-muted-foreground">
                        by {event.user.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
