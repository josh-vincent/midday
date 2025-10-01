"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { DateRangePicker } from "@midday/ui/date-range-picker";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, DateRange } from "../types";

export interface DateRangeFieldProps extends BaseFieldProps {
  /** Date format string */
  dateFormat?: string;
  /** Minimum date */
  fromDate?: Date;
  /** Maximum date */
  toDate?: Date;
  /** Default month to display */
  defaultMonth?: Date;
  /** Number of months to display */
  numberOfMonths?: number;
  /** Show compare option */
  showCompare?: boolean;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
}

/**
 * DateRangeField component for date range picker
 * 
 * @example
 * ```tsx
 * <DateRangeField
 *   name="dateRange"
 *   label="Date Range"
 *   placeholder="Select date range"
 *   numberOfMonths={2}
 *   showCompare
 * />
 * ```
 */
export const DateRangeField = forwardRef<HTMLDivElement, DateRangeFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "Select date range",
      disabled,
      required,
      className,
      error,
      dateFormat = "PPP",
      fromDate,
      toDate,
      defaultMonth,
      numberOfMonths = 2,
      showCompare = false,
      variant = "outline",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("DateRangeField must be used within a Form or have control prop");
    }

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn("flex flex-col", className)} ref={ref}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <DateRangePicker
                value={field.value}
                onChange={field.onChange}
                placeholder={placeholder}
                disabled={disabled}
                variant={variant}
                numberOfMonths={numberOfMonths}
                showCompare={showCompare}
                fromDate={fromDate}
                toDate={toDate}
                defaultMonth={defaultMonth}
                {...props}
              />
            </FormControl>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
            <FormMessage>{error}</FormMessage>
          </FormItem>
        )}
      />
    );
  }
);

DateRangeField.displayName = "DateRangeField";