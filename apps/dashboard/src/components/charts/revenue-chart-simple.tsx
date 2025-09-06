"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data?: any[];
  summary?: {
    currentTotal?: number;
    previousTotal?: number;
    change?: number;
  };
}

export function RevenueChartSimple({ data = [], summary }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data if no data provided
      return Array.from({ length: 30 }, (_, i) => ({
        date: format(
          new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          "MMM dd",
        ),
        value: Math.floor(Math.random() * 5000) + 1000,
      }));
    }

    return data.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      value: item.value || 0,
    }));
  }, [data]);

  const total =
    summary?.currentTotal ||
    chartData.reduce((sum, item) => sum + item.value, 0);
  const change = summary?.change || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">${total.toLocaleString()}</span>
          {change !== 0 && (
            <span
              className={`text-sm ${change > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip formatter={(value: number) => [`$${value}`, "Revenue"]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
