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
  Legend,
  ReferenceLine,
} from "recharts";
import { format, addMonths } from "date-fns";

type Props = {
  currency?: string;
};

const generateMockForecast = () => {
  const startDate = new Date();
  const data = [];
  let cashBalance = 225000;
  
  for (let i = 0; i < 6; i++) {
    const month = addMonths(startDate, i);
    const revenue = Math.floor(Math.random() * 10000) + 45000 + (i * 1000);
    const expenses = Math.floor(Math.random() * 5000) + 30000;
    const netCashFlow = revenue - expenses;
    cashBalance += netCashFlow;
    
    data.push({
      month: format(month, "MMM yyyy"),
      revenue,
      expenses,
      netCashFlow,
      cashBalance,
      projected: true,
    });
  }
  
  // Add historical data for context
  const historicalData = [];
  let historicalBalance = 180000;
  
  for (let i = 3; i > 0; i--) {
    const month = addMonths(startDate, -i);
    const revenue = Math.floor(Math.random() * 8000) + 40000;
    const expenses = Math.floor(Math.random() * 5000) + 28000;
    const netCashFlow = revenue - expenses;
    historicalBalance += netCashFlow;
    
    historicalData.push({
      month: format(month, "MMM yyyy"),
      revenue,
      expenses,
      netCashFlow,
      cashBalance: historicalBalance,
      projected: false,
    });
  }
  
  return [...historicalData, ...data];
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    const isProjected = payload[0]?.payload?.projected;
    
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {label} {isProjected && <span className="text-xs text-muted-foreground">(Projected)</span>}
        </p>
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
              }).format(payload[0]?.payload?.revenue || 0)}
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
              }).format(payload[0]?.payload?.expenses || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-8 pt-1 border-t">
            <span className="text-xs font-medium">Cash Balance</span>
            <span className="text-xs font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency || "USD",
                minimumFractionDigits: 0,
              }).format(payload[0]?.payload?.cashBalance || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ currency = "USD" }: Props) {
  const data = useMemo(() => generateMockForecast(), []);
  
  const endingCash = data[data.length - 1].cashBalance;
  const startingCash = data[0].cashBalance;
  const totalChange = endingCash - startingCash;
  const changePercent = ((totalChange / startingCash) * 100).toFixed(1);

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Starting Cash</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(startingCash)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Projected Ending Cash</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(endingCash)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Change</p>
          <p className={cn(
            "text-xl font-bold",
            totalChange > 0 ? "text-green-500" : "text-red-500"
          )}>
            {totalChange > 0 ? "+" : ""}{new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(totalChange)}
            <span className="text-sm font-normal ml-1">({changePercent}%)</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
            </linearGradient>
            <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
              <path d="M0,4 l4,-4 M0,0 l4,4" stroke="#3b82f6" strokeOpacity={0.3} strokeWidth="0.5"/>
            </pattern>
          </defs>
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
            x="Mar 2024" 
            stroke="#888" 
            strokeDasharray="3 3" 
            label={{ value: "Today", fontSize: 11, fill: "#888", position: "top" }}
          />
          <Area 
            type="monotone" 
            dataKey="cashBalance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#cashGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded" />
          <span className="text-muted-foreground">Historical</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-muted-foreground">Projected</span>
        </div>
      </div>
    </div>
  );
}