"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Package } from "lucide-react";
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
        <CardTitle className="font-mono font-medium text-2xl flex items-center gap-2">
          {totalVolume}
          <span className="text-sm font-normal">m³</span>
          <Package className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div>Monthly Volume</div>
          <div className="text-sm text-muted-foreground">
            {completedDeliveries} deliveries completed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
