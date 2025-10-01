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

export interface PercentageFieldProps extends BaseFieldProps {
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
  /** Whether to show percentage symbol */
  showSymbol?: boolean;
  /** Symbol position */
  symbolPosition?: "prefix" | "suffix";
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * PercentageField component for percentage input
 * 
 * @example
 * ```tsx
 * <PercentageField
 *   name="discount"
 *   label="Discount"
 *   placeholder="0"
 *   min={0}
 *   max={100}
 *   decimalScale={2}
 * />
 * ```
 */
export const PercentageField = forwardRef<HTMLInputElement, PercentageFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "0",
      disabled,
      required,
      className,
      error,
      min = 0,
      max = 100,
      step = 1,
      decimalScale = 0,
      allowNegative = false,
      showSymbol = true,
      symbolPosition = "suffix",
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("PercentageField must be used within a Form or have control prop");
    }

    const prefix = showSymbol && symbolPosition === "prefix" ? "%" : undefined;
    const suffix = showSymbol && symbolPosition === "suffix" ? "%" : undefined;

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
                  prefix={prefix}
                  suffix={suffix}
                  isAllowed={(values) => {
                    const { floatValue } = values;
                    return floatValue === undefined || 
                           (floatValue >= (min ?? -Infinity) && floatValue <= (max ?? Infinity));
                  }}
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

PercentageField.displayName = "PercentageField";