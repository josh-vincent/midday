"use client";

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

export interface BarChartProps {
  data?: any;
  height?: number;
  formatValue?: (value: number) => string;
  showLabels?: boolean;
  currentColor?: string;
  previousColor?: string;
  currentLightColor?: string;
  previousLightColor?: string;
  currentDarkColor?: string;
  previousDarkColor?: string;
  tooltipContent?: React.ComponentType<any>;
}

export function BarChart({
  data,
  height = 290,
  formatValue,
  showLabels = true,
  currentColor = "#121212",
  previousColor = "#C6C6C6",
  currentLightColor = "#121212",
  previousLightColor = "#C6C6C6",
  currentDarkColor = "#F5F5F3",
  previousDarkColor = "#606060",
  tooltipContent,
}: BarChartProps) {
  const formattedData = data?.result?.map((item: any) => ({
    ...item,
    meta: data.meta,
    date: item.formattedDate || item.date,
  }));

  return (
    <div className="relative h-full w-full">
      {showLabels && (
        <div className="space-x-4 absolute right-0 -top-10 hidden md:flex">
          <div className="flex space-x-2 items-center">
            <span className={cn("w-2 h-2 rounded-full", `bg-[${currentColor}] dark:bg-[${currentDarkColor}]`)} />
            <span className="text-sm text-[#606060]">Current Period</span>
          </div>
          <div className="flex space-x-2 items-center">
            <span className={cn("w-2 h-2 rounded-full", `bg-[${previousColor}] dark:bg-[${previousDarkColor}]`)} />
            <span className="text-sm text-[#606060]">Last Period</span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BaseBarChart data={formattedData} barGap={15}>
          <XAxis
            dataKey="date"
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

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
          />

          {tooltipContent && <Tooltip content={tooltipContent} cursor={false} />}

          <Bar dataKey="previous.value" barSize={16}>
            {data?.result?.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index.toString()}`}
                className={cn(
                  "fill-[#41191A]",
                  entry?.previous?.value &&
                    +entry.previous.value > 0 &&
                    `dark:fill-[${previousDarkColor}] fill-[${previousLightColor}]`,
                )}
              />
            ))}
          </Bar>

          <Bar dataKey="current.value" barSize={16}>
            {data?.result?.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index?.toString()}`}
                className={cn(
                  "fill-[#FF3638]",
                  entry?.current?.value &&
                  +entry.current.value > 0 &&
                    `dark:fill-[${currentDarkColor}] fill-[${currentLightColor}]`,
                )}
              />
            ))}
          </Bar>
        </BaseBarChart>
      </ResponsiveContainer>
    </div>
  );
}