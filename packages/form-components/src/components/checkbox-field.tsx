"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps } from "../types";

export interface CheckboxFieldProps extends BaseFieldProps {
  /** Checkbox text/label */
  text?: string;
  /** Whether to show label above checkbox */
  labelAbove?: boolean;
  /** Icon to show when checked */
  checkedIcon?: React.ReactNode;
  /** Icon to show when unchecked */
  uncheckedIcon?: React.ReactNode;
  /** Checkbox size */
  size?: "sm" | "md" | "lg";
}

/**
 * CheckboxField component for checkbox input
 * 
 * @example
 * ```tsx
 * <CheckboxField
 *   name="terms"
 *   text="I agree to the terms and conditions"
 *   required
 * />
 * ```
 */
export const CheckboxField = forwardRef<HTMLButtonElement, CheckboxFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      disabled,
      required,
      className,
      error,
      text,
      labelAbove = false,
      checkedIcon,
      uncheckedIcon,
      size = "md",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("CheckboxField must be used within a Form or have control prop");
    }

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn("space-y-2", className)}>
            {label && labelAbove && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <div className="flex items-start space-x-3">
              <FormControl>
                <Checkbox
                  ref={ref}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  className={cn(sizeClasses[size])}
                  {...props}
                />
              </FormControl>
              <div className="grid gap-1.5 leading-none">
                {(text || (!labelAbove && label)) && (
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    {text || label}
                    {required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
                {description && (
                  <FormDescription className="text-xs">
                    {description}
                  </FormDescription>
                )}
              </div>
            </div>
            <FormMessage>{error}</FormMessage>
          </FormItem>
        )}
      />
    );
  }
);

CheckboxField.displayName = "CheckboxField";