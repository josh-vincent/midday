"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Combobox } from "@midday/ui/combobox";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, Option, OptionGroup } from "../types";

export interface ComboboxFieldProps extends BaseFieldProps {
  /** Combobox options */
  options?: Option[] | OptionGroup[];
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
  /** Custom filter function */
  filterFunction?: (value: string, search: string) => number;
}

/**
 * Helper function to check if options are grouped
 */
const isOptionGroup = (options: Option[] | OptionGroup[]): options is OptionGroup[] => {
  return options.length > 0 && 'options' in options[0];
};

/**
 * Helper function to flatten options
 */
const flattenOptions = (options: Option[] | OptionGroup[]): Option[] => {
  if (isOptionGroup(options)) {
    return options.flatMap(group => group.options);
  }
  return options;
};

/**
 * ComboboxField component for searchable select
 * 
 * @example
 * ```tsx
 * <ComboboxField
 *   name="country"
 *   label="Country"
 *   placeholder="Select country"
 *   searchPlaceholder="Search countries..."
 *   options={[
 *     { label: "United States", value: "us" },
 *     { label: "Canada", value: "ca" },
 *     { label: "United Kingdom", value: "uk" }
 *   ]}
 *   creatable
 * />
 * ```
 */
export const ComboboxField = forwardRef<HTMLDivElement, ComboboxFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      placeholder = "Select an option",
      disabled,
      required,
      className,
      error,
      options = [],
      searchPlaceholder = "Search...",
      emptyMessage = "No options found",
      loading = false,
      loadingMessage = "Loading...",
      creatable = false,
      createMessage = "Create",
      filterFunction,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("ComboboxField must be used within a Form or have control prop");
    }

    const flatOptions = flattenOptions(options);

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
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                options={flatOptions}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyMessage={loading ? loadingMessage : emptyMessage}
                disabled={disabled || loading}
                creatable={creatable}
                createMessage={createMessage}
                filterFunction={filterFunction}
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

ComboboxField.displayName = "ComboboxField";