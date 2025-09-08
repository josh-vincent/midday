"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { AnimatedNumber } from "./animated-number";
interface JobsMonthlyVolumeProps {
  summary?: {
    volume: number;
    deliveries: number;
  };
}

export function JobsMonthlyVolume({ summary }: JobsMonthlyVolumeProps) {
  const totalVolume = summary?.volume || 0;
  const completedDeliveries = summary?.deliveries || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-medium text-2xl">
          <AnimatedNumber
            value={totalVolume}
            maximumFractionDigits={1}
            minimumFractionDigits={0} currency={null|"AUD"}          />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div>Monthly Volume</div>
          <div className="text-sm text-muted-foreground">
            {totalVolume}m³ from {completedDeliveries} deliveries
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
