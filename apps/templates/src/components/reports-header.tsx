"use client";

import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  RefreshCw, 
  Plus, 
  Download,
  Calendar as CalendarIcon,
  Filter,
  Settings,
  BarChart3
} from "lucide-react";
import { useState } from "react";

type DateRange = {
  from: Date;
  to: Date;
};

type Props = {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onCreateReport?: () => void;
  onExportAll?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalReports?: number;
};

const dateRangePresets = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "This year", value: "1y" },
  { label: "Custom", value: "custom" },
];

export function ReportsHeader({
  dateRange,
  onDateRangeChange,
  onCreateReport,
  onExportAll,
  onRefresh,
  isRefreshing = false,
  totalReports = 0,
}: Props) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("custom");

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    
    if (value === "custom") {
      setDatePickerOpen(true);
      return;
    }

    const now = new Date();
    let from: Date;

    switch (value) {
      case "7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "6m":
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case "1y":
        from = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    onDateRangeChange({ from, to: now });
  };

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <BarChart3 className="h-8 w-8" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business insights and reporting dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportAll}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>

          <Button size="sm" onClick={onCreateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Date Range Preset Selector */}
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {dateRangePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                    setDatePickerOpen(false);
                    setSelectedPreset("custom");
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{totalReports} reports available</span>
          <span>•</span>
          <span>
            {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">$1.45M</div>
          <div className="text-xs text-muted-foreground">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">$890K</div>
          <div className="text-xs text-muted-foreground">Total Expenses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">38.6%</div>
          <div className="text-xs text-muted-foreground">Profit Margin</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">48</div>
          <div className="text-xs text-muted-foreground">Active Clients</div>
        </div>
      </div>
    </div>
  );
}