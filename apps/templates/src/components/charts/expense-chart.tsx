"use client";

import { useMemo } from "react";
import { cn } from "@midday/ui/cn";
import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
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

const EXPENSE_CATEGORIES = [
  { name: "Software", color: "#FF6B6B" },
  { name: "Salaries", color: "#4ECDC4" },
  { name: "Marketing", color: "#45B7D1" },
  { name: "Office", color: "#96CEB4" },
  { name: "Travel", color: "#FFEAA7" },
  { name: "Other", color: "#DFE6E9" },
];

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
    amount: Math.floor(Math.random() * 8000) + 3000,
  }));
};

const generateCategoryData = () => {
  return EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    value: Math.floor(Math.random() * 30000) + 10000,
  }));
};

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="text-xs font-medium">
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

export function ExpenseChart({ dateRange, currency = "USD", period = "30d", detailed = false }: Props) {
  const data = useMemo(() => generateMockData(dateRange, period), [dateRange, period]);
  const categoryData = useMemo(() => generateCategoryData(), []);

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const avgExpense = total / data.length;

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
            Average:{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(avgExpense)}
            {" "}per period
          </div>
        </div>
      )}

      {detailed ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Expense Trend</h4>
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
                <Bar dataKey="amount" fill="#FF6B6B" />
              </BaseBarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">By Category</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / categoryData.reduce((s, e) => s + e.value, 0)) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => 
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 0,
                  }).format(value)
                } />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
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
            <Bar dataKey="amount" fill="#FF6B6B" />
          </BaseBarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}