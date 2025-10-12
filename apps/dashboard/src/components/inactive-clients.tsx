"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { InvoiceSummarySkeleton } from "./invoice-summary";

export function InactiveClients() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.invoice.inactiveClientsCount.queryOptions(),
  );

  if (isLoading) {
    return <InvoiceSummarySkeleton />;
  }

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono font-medium text-2xl">
          <NumberFlow value={data ?? 0} willChange />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>Inactive Clients</div>
          <div className="text-sm text-muted-foreground">
            No invoices or time tracked past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
