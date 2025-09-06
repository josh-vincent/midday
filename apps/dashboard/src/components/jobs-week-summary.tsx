"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { TrendingUp } from "lucide-react";
import { AnimatedNumber } from "./animated-number";

interface JobsWeekSummaryProps {
  summary?: {
    revenue: number;
    jobCount: number;
  };
}

export function JobsWeekSummary({ summary }: JobsWeekSummaryProps) {
  const weekRevenue = summary?.revenue || 0;
  const weekJobCount = summary?.jobCount || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-medium text-2xl">
          <AnimatedNumber
            value={weekRevenue}
            currency="AUD"
            maximumFractionDigits={0}
            minimumFractionDigits={0}
          />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span>This Week</span>
            <TrendingUp className="h-3 w-3 text-green-500" />
          </div>
          <div className="text-sm text-muted-foreground">
            {weekJobCount} jobs completed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
