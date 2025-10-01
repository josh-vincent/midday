"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Switch } from "@midday/ui/switch";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps } from "../types";

export interface SwitchFieldProps extends BaseFieldProps {
  /** Switch text/label */
  text?: string;
  /** Whether to show label above switch */
  labelAbove?: boolean;
  /** Switch size */
  size?: "sm" | "md" | "lg";
  /** Layout direction */
  layout?: "horizontal" | "vertical";
}

/**
 * SwitchField component for toggle switch
 * 
 * @example
 * ```tsx
 * <SwitchField
 *   name="notifications"
 *   text="Enable notifications"
 *   description="Receive email notifications"
 * />
 * ```
 */
export const SwitchField = forwardRef<HTMLButtonElement, SwitchFieldProps>(
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
      size = "md",
      layout = "horizontal",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("SwitchField must be used within a Form or have control prop");
    }

    const sizeClasses = {
      sm: "h-5 w-9",
      md: "h-6 w-11",
      lg: "h-7 w-14",
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
            <div className={cn(
              "flex items-start space-x-3",
              layout === "vertical" && "flex-col space-x-0 space-y-2",
              layout === "horizontal" && "items-center"
            )}>
              <FormControl>
                <Switch
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

SwitchField.displayName = "SwitchField";