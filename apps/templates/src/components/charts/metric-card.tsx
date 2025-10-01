"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down";
  currency?: string;
  icon?: LucideIcon;
};

export function MetricCard({
  title,
  value,
  change,
  trend,
  currency,
  icon: Icon,
}: Props) {
  const formatValue = () => {
    if (currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        <div className="flex items-center text-xs">
          {trend === "up" ? (
            <ArrowUpRight className={cn(
              "h-3 w-3 mr-1",
              change > 0 ? "text-green-500" : "text-red-500"
            )} />
          ) : (
            <ArrowDownRight className={cn(
              "h-3 w-3 mr-1",
              change < 0 ? "text-green-500" : "text-red-500"
            )} />
          )}
          <span className={cn(
            "font-medium",
            change > 0 ? "text-green-500" : "text-red-500"
          )}>
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  );
}