"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { MultipleSelector } from "@midday/ui/multiple-selector";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, Option, OptionGroup } from "../types";

export interface MultiSelectFieldProps extends BaseFieldProps {
  /** Select options */
  options?: Option[] | OptionGroup[];
  /** Maximum number of selections */
  maxSelected?: number;
  /** Whether to show search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Whether to allow creation of new options */
  creatable?: boolean;
  /** Create option message */
  createMessage?: string;
  /** Badge variant */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Helper function to convert options to MultipleSelector format
 */
const convertOptions = (options: Option[] | OptionGroup[]) => {
  const flatOptions: Array<{ label: string; value: string; disable?: boolean }> = [];
  
  options.forEach((item) => {
    if ('options' in item) {
      // OptionGroup
      item.options.forEach((option) => {
        flatOptions.push({
          label: option.label,
          value: option.value,
          disable: option.disabled,
        });
      });
    } else {
      // Option
      flatOptions.push({
        label: item.label,
        value: item.value,
        disable: item.disabled,
      });
    }
  });
  
  return flatOptions;
};

/**
 * MultiSelectField component for multi-select with tags
 * 
 * @example
 * ```tsx
 * <MultiSelectField
 *   name="tags"
 *   label="Tags"
 *   placeholder="Select tags"
 *   options={[
 *     { label: "React", value: "react" },
 *     { label: "TypeScript", value: "typescript" }
 *   ]}
 *   maxSelected={5}
 *   creatable
 * />
 * ```
 */
export const MultiSelectField = forwardRef<HTMLDivElement, MultiSelectFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "Select options",
      disabled,
      required,
      className,
      error,
      options = [],
      maxSelected,
      searchable = true,
      searchPlaceholder = "Search...",
      emptyMessage = "No options found",
      loading = false,
      loadingMessage = "Loading...",
      creatable = false,
      createMessage = "Create",
      badgeVariant = "secondary",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("MultiSelectField must be used within a Form or have control prop");
    }

    const convertedOptions = convertOptions(options);

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => (
          <FormItem className={cn(className)} ref={ref}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <MultipleSelector
                value={field.value || []}
                onChange={field.onChange}
                defaultOptions={convertedOptions}
                placeholder={placeholder}
                disabled={disabled || loading}
                maxSelected={maxSelected}
                creatable={creatable}
                emptyIndicator={
                  loading ? (
                    <p className="text-center text-sm leading-10 text-muted-foreground">
                      {loadingMessage}
                    </p>
                  ) : (
                    <p className="text-center text-sm leading-10 text-muted-foreground">
                      {emptyMessage}
                    </p>
                  )
                }
                badgeClassName={cn(
                  badgeVariant === "default" && "bg-primary text-primary-foreground hover:bg-primary/80",
                  badgeVariant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  badgeVariant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/80",
                  badgeVariant === "outline" && "border border-input bg-background hover:bg-accent"
                )}
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

MultiSelectField.displayName = "MultiSelectField";