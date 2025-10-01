"use client";

import { useMemo } from "react";
import { cn } from "@midday/ui/cn";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { format, eachMonthOfInterval, subMonths } from "date-fns";

type Props = {
  dateRange: {
    from: Date;
    to: Date;
  };
  currency?: string;
};

const generateMockData = () => {
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 11),
    end: new Date(),
  });
  
  return months.map((date, index) => ({
    month: format(date, "MMM"),
    burnRate: Math.floor(Math.random() * 5000) + 12000 + (index * 200),
    avgBurnRate: 15000,
  }));
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between space-x-8">
            <span className="text-xs">Burn Rate</span>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[0]?.value || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function BurnRateChart({ dateRange, currency = "USD" }: Props) {
  const data = useMemo(() => generateMockData(), []);
  
  const currentBurnRate = data[data.length - 1].burnRate;
  const avgBurnRate = data.reduce((sum, item) => sum + item.burnRate, 0) / data.length;
  const trend = ((currentBurnRate - data[data.length - 2].burnRate) / data[data.length - 2].burnRate) * 100;

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
          }).format(currentBurnRate)}
          <span className="text-sm font-normal text-muted-foreground ml-2">/ month</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span className={cn(
            "font-medium",
            trend < 0 ? "text-green-500" : "text-red-500"
          )}>
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
          {" "}from last month
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => 
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <ReferenceLine 
            y={avgBurnRate} 
            stroke="#888" 
            strokeDasharray="3 3" 
            label={{ value: "Average", fontSize: 11, fill: "#888" }}
          />
          <Line 
            type="monotone" 
            dataKey="burnRate" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: "#ef4444", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}