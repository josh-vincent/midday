"use client";

import { useState, useCallback } from "react";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { DateRangePreset } from "../types";
import { DEFAULT_DATE_PRESETS } from "../utils";

interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange?: (dateRange: DateRange | undefined) => void;
  /** Available preset options */
  presets?: DateRangePreset[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show clear button */
  clearable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to align the popover */
  align?: "start" | "center" | "end";
}

/**
 * Date range selection component with presets
 * 
 * @example
 * ```tsx
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   presets={[
 *     { label: "Today", value: "today", dateRange: () => ({ from: new Date(), to: new Date() }) },
 *     { label: "Last 7 days", value: "last7days", dateRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) }
 *   ]}
 *   clearable
 * />
 * ```
 */
export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_DATE_PRESETS,
  placeholder = "Select date range",
  disabled,
  clearable = true,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    onChange?.(range);
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  }, [onChange]);

  const handlePresetSelect = useCallback((preset: DateRangePreset) => {
    const range = preset.dateRange();
    onChange?.(range);
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  }, [onChange]);

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range) return "";
    
    if (range.from) {
      if (range.to) {
        return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
      }
      return format(range.from, "MMM dd, yyyy");
    }
    
    return "";
  };

  const displayValue = formatDateRange(value);
  const hasValue = !!value?.from;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
          {hasValue && clearable && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear</span>
            </button>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets sidebar */}
          {presets.length > 0 && (
            <div className="border-r border-border">
              <div className="p-3 pb-2">
                <p className="text-sm font-medium">Quick select</p>
              </div>
              <div className="px-1 pb-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full justify-start font-normal"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={value}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              initialFocus
            />
          </div>
        </div>
        
        {/* Footer with actions */}
        {hasValue && (
          <div className="border-t border-border p-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {displayValue}
              </p>
              {clearable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}