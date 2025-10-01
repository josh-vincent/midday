"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import type { BaseFieldProps } from "../types";

export interface NumberFieldProps extends BaseFieldProps {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Number of decimal places */
  decimalScale?: number;
  /** Whether to allow negative values */
  allowNegative?: boolean;
  /** Whether to allow leading zeros */
  allowLeadingZeros?: boolean;
  /** Thousands separator */
  thousandSeparator?: string | boolean;
  /** Decimal separator */
  decimalSeparator?: string;
  /** Prefix */
  prefix?: string;
  /** Suffix */
  suffix?: string;
  /** Custom format */
  format?: string;
  /** Mask for formatted input */
  mask?: string | string[];
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * NumberField component for numeric input with formatting
 * 
 * @example
 * ```tsx
 * <NumberField
 *   name="amount"
 *   label="Amount"
 *   placeholder="0.00"
 *   decimalScale={2}
 *   thousandSeparator=","
 *   prefix="$"
 *   min={0}
 * />
 * ```
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder,
      disabled,
      required,
      className,
      error,
      min,
      max,
      step,
      decimalScale,
      allowNegative = true,
      allowLeadingZeros = false,
      thousandSeparator = false,
      decimalSeparator = ".",
      prefix,
      suffix,
      format,
      mask,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("NumberField must be used within a Form or have control prop");
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
                <NumericFormat
                  {...field}
                  {...props}
                  getInputRef={ref}
                  customInput={Input}
                  placeholder={placeholder}
                  disabled={disabled}
                  min={min}
                  max={max}
                  step={step}
                  decimalScale={decimalScale}
                  allowNegative={allowNegative}
                  allowLeadingZeros={allowLeadingZeros}
                  thousandSeparator={thousandSeparator}
                  decimalSeparator={decimalSeparator}
                  prefix={prefix}
                  suffix={suffix}
                  format={format}
                  mask={mask}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
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

NumberField.displayName = "NumberField";