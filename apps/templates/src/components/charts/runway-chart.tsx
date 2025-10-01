"use client";

import { useMemo } from "react";
import { cn } from "@midday/ui/cn";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Props = {
  dateRange: {
    from: Date;
    to: Date;
  };
  currency?: string;
};

const generateMockData = () => {
  const currentCash = 225000;
  const monthlyBurnRate = 15000;
  const months = Math.floor(currentCash / monthlyBurnRate);
  
  const data = [];
  let remainingCash = currentCash;
  
  for (let i = 0; i <= Math.min(months, 18); i++) {
    data.push({
      month: i === 0 ? "Now" : `Month ${i}`,
      cash: Math.max(0, remainingCash),
      status: remainingCash > monthlyBurnRate * 6 ? "safe" : 
              remainingCash > monthlyBurnRate * 3 ? "warning" : "danger",
    });
    remainingCash -= monthlyBurnRate;
  }
  
  return { data, months };
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="text-xs font-medium">
          Cash remaining:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
            minimumFractionDigits: 0,
          }).format(payload[0]?.value || 0)}
        </div>
      </div>
    );
  }
  return null;
};

const getBarColor = (status: string) => {
  switch (status) {
    case "safe":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "danger":
      return "#ef4444";
    default:
      return "#888";
  }
};

export function RunwayChart({ dateRange, currency = "USD" }: Props) {
  const { data, months } = useMemo(() => generateMockData(), []);
  
  const StatusIcon = months > 6 ? CheckCircle : months > 3 ? AlertTriangle : XCircle;
  const statusColor = months > 6 ? "text-green-500" : months > 3 ? "text-yellow-500" : "text-red-500";
  const statusText = months > 6 ? "Healthy runway" : months > 3 ? "Monitor closely" : "Critical - extend runway";

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <StatusIcon className={cn("h-5 w-5", statusColor)} />
          <div>
            <div className="text-2xl font-bold">
              {months} months
            </div>
            <div className="text-sm text-muted-foreground">
              {statusText}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            interval={2}
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
          <Bar dataKey="cash" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Current cash</span>
          <span className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(225000)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly burn rate</span>
          <span className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(15000)}
          </span>
        </div>
      </div>
    </div>
  );
}