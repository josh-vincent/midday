"use client";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";

export function NewCustomersThisMonth() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.invoice.newCustomersCount.queryOptions(),
  );

  // Handle loading state
  if (isLoading) {
    return (
      <Card className="hidden sm:block">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono font-medium text-2xl">
            <NumberFlow value={0} willChange />
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-[34px]">
          <div className="flex flex-col gap-2">
            <div>New Customers</div>
            <div className="text-sm text-muted-foreground">
              Added past 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Access the count properly - check both possible structures
  const count = data?.count ?? data?.data?.count ?? 0;

  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono font-medium text-2xl">
          <NumberFlow value={count} willChange />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <div>New Customers</div>
          <div className="text-sm text-muted-foreground">
            Added past 30 days
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
