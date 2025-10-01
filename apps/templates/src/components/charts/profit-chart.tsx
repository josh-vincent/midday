"use client";

import { useMemo } from "react";
import { cn } from "@midday/ui/cn";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  
  return intervals.map((date) => {
    const revenue = Math.floor(Math.random() * 10000) + 5000;
    const expenses = Math.floor(Math.random() * 7000) + 3000;
    return {
      date: format(date, daysDiff <= 7 ? "MMM dd" : daysDiff <= 90 ? "MMM dd" : "MMM"),
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  });
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between space-x-8">
            <span className="flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              Revenue
            </span>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[0]?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-8">
            <span className="flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              Expenses
            </span>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[1]?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-8 pt-1 border-t">
            <span className="flex items-center text-xs font-medium">
              Profit
            </span>
            <span className={cn(
              "text-xs font-medium",
              payload[2]?.value > 0 ? "text-green-500" : "text-red-500"
            )}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[2]?.value || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ProfitChart({ dateRange, currency = "USD", period = "30d" }: Props) {
  const data = useMemo(() => generateMockData(dateRange, period), [dateRange, period]);

  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const avgProfit = totalProfit / data.length;
  const profitMargin = (totalProfit / data.reduce((sum, item) => sum + item.revenue, 0)) * 100;

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Profit</p>
          <p className={cn(
            "text-2xl font-bold",
            totalProfit > 0 ? "text-green-500" : "text-red-500"
          )}>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(totalProfit)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Average Profit</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(avgProfit)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Profit Margin</p>
          <p className={cn(
            "text-2xl font-bold",
            profitMargin > 20 ? "text-green-500" : profitMargin > 10 ? "text-yellow-500" : "text-red-500"
          )}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stackId="1" 
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stackId="2" 
            stroke="#ef4444" 
            fill="#ef4444" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}