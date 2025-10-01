"use client";

import { cn } from "@midday/ui/cn";
import {
  LineChart as BaseLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface LineChartProps {
  data: any[];
  height?: number;
  lines?: {
    dataKey: string;
    stroke: string;
    strokeWidth?: number;
    dot?: boolean | object;
    name?: string;
  }[];
  formatValue?: (value: number) => string;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipContent?: React.ComponentType<any>;
  className?: string;
}

export function LineChart({
  data,
  height = 300,
  lines = [],
  formatValue,
  xAxisKey = "date",
  showGrid = true,
  showLegend = false,
  tooltipContent,
  className,
}: LineChartProps) {
  const defaultTooltipStyle = {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
  };

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <BaseLineChart data={data}>
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
        
        {lines.map((line, index) => (
          <Line
            key={line.dataKey + index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={line.strokeWidth || 2}
            dot={line.dot !== false ? (line.dot || { fill: line.stroke, strokeWidth: 2, r: 3 }) : false}
            name={line.name}
          />
        ))}
      </BaseLineChart>
    </ResponsiveContainer>
  );
}