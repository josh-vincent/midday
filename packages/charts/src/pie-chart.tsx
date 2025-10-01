"use client";

import { cn } from "@midday/ui/cn";
import {
  PieChart as BasePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export interface PieChartProps {
  data: any[];
  height?: number;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  labelLine?: boolean;
  label?: boolean | ((props: any) => React.ReactNode);
  showLegend?: boolean;
  tooltipContent?: React.ComponentType<any>;
  formatValue?: (value: number) => string;
  className?: string;
  dataKey?: string;
}

const DEFAULT_COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function PieChart({
  data,
  height = 300,
  colors = DEFAULT_COLORS,
  innerRadius = 0,
  outerRadius = 80,
  labelLine = false,
  label = false,
  showLegend = true,
  tooltipContent,
  formatValue,
  className,
  dataKey = "value",
}: PieChartProps) {
  const defaultTooltipStyle = {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
  };

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <BasePieChart>
        {tooltipContent ? (
          <Tooltip content={tooltipContent} />
        ) : (
          <Tooltip
            formatter={formatValue ? (value: number) => [formatValue(value), ""] : undefined}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            contentStyle={defaultTooltipStyle}
          />
        )}
        
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px",
            }}
          />
        )}
        
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={labelLine}
          label={label}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
      </BasePieChart>
    </ResponsiveContainer>
  );
}