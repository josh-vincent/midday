"use client";

import { useJobsFilterParams } from "@/hooks/use-jobs-filter-params";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { AnimatedNumber } from "./animated-number";

interface JobsPendingProps {
  summary: {
    count: number;
    potentialRevenue: number;
  };
}

export function JobsPending({ summary }: JobsPendingProps) {
  const { setFilter } = useJobsFilterParams();
  
  const pendingCount = summary?.count || 0;
  const pendingValue = summary?.potentialRevenue || 0;

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          status: ["pending", "in_progress"],
        })
      }
      className="hidden sm:block text-left"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl">
            <AnimatedNumber
              value={pendingCount}
              maximumFractionDigits={0}
              minimumFractionDigits={0}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div>Pending Jobs</div>
            <div className="text-sm text-muted-foreground">
              ${pendingValue.toFixed(0)} potential revenue
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
