"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { Label } from "@midday/ui/label";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, Option } from "../types";

export interface RadioGroupFieldProps extends BaseFieldProps {
  /** Radio options */
  options: Option[];
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
  /** Columns for grid layout */
  columns?: number;
}

/**
 * RadioGroupField component for radio button group
 * 
 * @example
 * ```tsx
 * <RadioGroupField
 *   name="gender"
 *   label="Gender"
 *   options={[
 *     { label: "Male", value: "male" },
 *     { label: "Female", value: "female" },
 *     { label: "Other", value: "other" }
 *   ]}
 *   orientation="horizontal"
 * />
 * ```
 */
export const RadioGroupField = forwardRef<HTMLDivElement, RadioGroupFieldProps>(
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
      options,
      orientation = "vertical",
      columns,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("RadioGroupField must be used within a Form or have control prop");
    }

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn("space-y-3", className)} ref={ref}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className={cn(
                  orientation === "horizontal" && "flex flex-wrap items-center gap-6",
                  columns && `grid grid-cols-${columns} gap-4`
                )}
                disabled={disabled}
                {...props}
              >
                {options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`${name}-${option.value}`}
                      disabled={option.disabled || disabled}
                    />
                    <Label
                      htmlFor={`${name}-${option.value}`}
                      className={cn(
                        "text-sm font-normal cursor-pointer",
                        (option.disabled || disabled) && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {option.label}
                      {option.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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

RadioGroupField.displayName = "RadioGroupField";