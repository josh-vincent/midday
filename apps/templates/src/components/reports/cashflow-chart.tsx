"use client";

import { 
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Skeleton } from "@midday/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type CashflowData = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}[];

type Props = {
  data: CashflowData;
  loading?: boolean;
};

export function CashflowChart({ data, loading = false }: Props) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const formatCurrency = (value: number) => {
    return `$${(Math.abs(value) / 1000).toFixed(0)}K`;
  };

  const formatCurrencyWithSign = (value: number) => {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}$${(Math.abs(value) / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inflow = payload.find((p: any) => p.dataKey === "inflow");
      const outflow = payload.find((p: any) => p.dataKey === "outflow");
      const net = payload.find((p: any) => p.dataKey === "net");

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {inflow && (
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-green-600">Inflow:</span>
              <span className="text-sm font-medium">{formatCurrency(inflow.value)}</span>
            </div>
          )}
          {outflow && (
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-red-600">Outflow:</span>
              <span className="text-sm font-medium">{formatCurrency(outflow.value)}</span>
            </div>
          )}
          {net && (
            <div className="flex items-center justify-between space-x-4 border-t pt-2 mt-2">
              <span className="text-sm font-medium">Net:</span>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                net.value >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {net.value > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : net.value < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span>{formatCurrencyWithSign(net.value)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalNet = data.reduce((sum, item) => sum + item.net, 0);
  const avgMonthlyNet = data.length > 0 ? totalNet / data.length : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Avg Monthly Net</p>
          <p className={`text-lg font-bold ${
            avgMonthlyNet >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {formatCurrencyWithSign(avgMonthlyNet)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Net Flow</p>
          <p className={`text-lg font-bold ${
            totalNet >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {formatCurrencyWithSign(totalNet)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Positive Months</p>
          <p className="text-lg font-bold">
            {data.filter(d => d.net > 0).length}/{data.length}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
          
          {/* Bars for inflow and outflow */}
          <Bar 
            dataKey="inflow" 
            fill="#10b981" 
            fillOpacity={0.7}
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="outflow" 
            fill="#ef4444" 
            fillOpacity={0.7}
            radius={[2, 2, 0, 0]}
          />
          
          {/* Line for net cashflow */}
          <Line 
            type="monotone" 
            dataKey="net" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}