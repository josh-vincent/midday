"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { CurrencyInput } from "@midday/ui/currency-input";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, CurrencyConfig } from "../types";

export interface CurrencyFieldProps extends BaseFieldProps {
  /** Currency configuration */
  currency?: string;
  /** Locale for formatting */
  locale?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Whether to allow negative values */
  allowNegative?: boolean;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * CurrencyField component for currency input with formatting
 * 
 * @example
 * ```tsx
 * <CurrencyField
 *   name="amount"
 *   label="Amount"
 *   currency="USD"
 *   placeholder="0.00"
 *   min={0}
 * />
 * ```
 */
export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "0.00",
      disabled,
      required,
      className,
      error,
      currency = "USD",
      locale = "en-US",
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      allowNegative = false,
      min,
      max,
      step,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("CurrencyField must be used within a Form or have control prop");
    }

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn(className)}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                {leftIcon && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
                    {leftIcon}
                  </div>
                )}
                <CurrencyInput
                  {...field}
                  {...props}
                  ref={ref}
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder={placeholder}
                  disabled={disabled}
                  currency={currency}
                  locale={locale}
                  minimumFractionDigits={minimumFractionDigits}
                  maximumFractionDigits={maximumFractionDigits}
                  allowNegative={allowNegative}
                  min={min}
                  max={max}
                  step={step}
                  className={cn(
                    leftIcon && "pl-10",
                    rightIcon && "pr-10"
                  )}
                />
                {rightIcon && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
                    {rightIcon}
                  </div>
                )}
              </div>
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

CurrencyField.displayName = "CurrencyField";