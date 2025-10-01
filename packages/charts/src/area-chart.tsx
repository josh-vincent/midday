"use client";

import { cn } from "@midday/ui/cn";
import {
  AreaChart as BaseAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface AreaChartProps {
  data: any[];
  height?: number;
  areas?: {
    dataKey: string;
    stroke: string;
    fill: string;
    fillOpacity?: number;
    stackId?: string;
    name?: string;
  }[];
  formatValue?: (value: number) => string;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipContent?: React.ComponentType<any>;
  className?: string;
  stacked?: boolean;
}

export function AreaChart({
  data,
  height = 300,
  areas = [],
  formatValue,
  xAxisKey = "date",
  showGrid = true,
  showLegend = false,
  tooltipContent,
  className,
  stacked = false,
}: AreaChartProps) {
  const defaultTooltipStyle = {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
  };

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <BaseAreaChart data={data}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-[#DCDAD2] dark:stroke-[#2C2C2C]"
          />
        )}
        
        <XAxis
          dataKey={xAxisKey}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={15}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />
        
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickMargin={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />
        
        {tooltipContent ? (
          <Tooltip content={tooltipContent} />
        ) : (
          <Tooltip
            formatter={formatValue ? (value: number) => [formatValue(value), ""] : undefined}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            contentStyle={defaultTooltipStyle}
          />
        )}
        
        {showLegend && <Legend />}
        
        {areas.map((area, index) => (
          <Area
            key={area.dataKey + index}
            type="monotone"
            dataKey={area.dataKey}
            stackId={stacked ? (area.stackId || "1") : undefined}
            stroke={area.stroke}
            fill={area.fill}
            fillOpacity={area.fillOpacity || 0.6}
            name={area.name}
          />
        ))}
      </BaseAreaChart>
    </ResponsiveContainer>
  );
}