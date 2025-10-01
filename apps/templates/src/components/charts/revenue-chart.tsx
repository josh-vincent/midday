"use client";

import { useMemo } from "react";
import { cn } from "@midday/ui/cn";
import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";

type Props = {
  dateRange: {
    from: Date;
    to: Date;
  };
  currency?: string;
  period?: string;
  detailed?: boolean;
};

const generateMockData = (dateRange: { from: Date; to: Date }, period: string) => {
  let intervals;
  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) {
    intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  } else if (daysDiff <= 90) {
    intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
  } else {
    intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
  }
  
  return intervals.map((date) => ({
    date: format(date, daysDiff <= 7 ? "MMM dd" : daysDiff <= 90 ? "MMM dd" : "MMM"),
    current: Math.floor(Math.random() * 10000) + 5000,
    previous: Math.floor(Math.random() * 8000) + 4000,
  }));
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between space-x-8">
            <span className="flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-[#121212] dark:bg-[#F5F5F3] mr-2" />
              Current
            </span>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[1]?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-8">
            <span className="flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060] mr-2" />
              Previous
            </span>
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

export function RevenueChart({ dateRange, currency = "USD", period = "30d", detailed = false }: Props) {
  const data = useMemo(() => generateMockData(dateRange, period), [dateRange, period]);

  const total = data.reduce((sum, item) => sum + item.current, 0);
  const previousTotal = data.reduce((sum, item) => sum + item.previous, 0);
  const change = ((total - previousTotal) / previousTotal) * 100;

  return (
    <div className="w-full">
      {detailed && (
        <div className="mb-6">
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(total)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            <span className={cn(
              "font-medium",
              change > 0 ? "text-green-500" : "text-red-500"
            )}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
            {" "}vs previous period
          </div>
        </div>
      )}

      <div className="relative">
        <div className="space-x-4 absolute right-0 -top-10 flex">
          <div className="flex space-x-2 items-center">
            <span className="w-2 h-2 rounded-full bg-[#121212] dark:bg-[#F5F5F3]" />
            <span className="text-xs text-muted-foreground">Current</span>
          </div>
          <div className="flex space-x-2 items-center">
            <span className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
            <span className="text-xs text-muted-foreground">Previous</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BaseBarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
            <XAxis 
              dataKey="date" 
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
            <Bar dataKey="previous" fill="#C6C6C6" className="dark:fill-[#606060]" />
            <Bar dataKey="current" fill="#121212" className="dark:fill-[#F5F5F3]" />
          </BaseBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}