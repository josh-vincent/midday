"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { forwardRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps } from "../types";

export interface DateFieldProps extends BaseFieldProps {
  /** Date format string */
  dateFormat?: string;
  /** Minimum date */
  fromDate?: Date;
  /** Maximum date */
  toDate?: Date;
  /** Default month to display */
  defaultMonth?: Date;
  /** Whether to show outside days */
  showOutsideDays?: boolean;
  /** Calendar mode */
  mode?: "single";
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
}

/**
 * DateField component for date picker
 * 
 * @example
 * ```tsx
 * <DateField
 *   name="birthDate"
 *   label="Birth Date"
 *   placeholder="Select date"
 *   dateFormat="PPP"
 *   toDate={new Date()}
 * />
 * ```
 */
export const DateField = forwardRef<HTMLButtonElement, DateFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "Select date",
      disabled,
      required,
      className,
      error,
      dateFormat = "PPP",
      fromDate,
      toDate,
      defaultMonth,
      showOutsideDays = true,
      mode = "single",
      variant = "outline",
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("DateField must be used within a Form or have control prop");
    }

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn("flex flex-col", className)}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    ref={ref}
                    variant={variant}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                    type="button"
                    onClick={() => setIsOpen(true)}
                    {...props}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(new Date(field.value), dateFormat)
                    ) : (
                      <span>{placeholder}</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode={mode}
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(date?.toISOString());
                    setIsOpen(false);
                  }}
                  disabled={(date) => {
                    if (disabled) return true;
                    if (fromDate && date < fromDate) return true;
                    if (toDate && date > toDate) return true;
                    return false;
                  }}
                  defaultMonth={defaultMonth}
                  showOutsideDays={showOutsideDays}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

DateField.displayName = "DateField";