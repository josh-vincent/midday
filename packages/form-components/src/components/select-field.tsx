"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps, Option, OptionGroup } from "../types";

export interface SelectFieldProps extends BaseFieldProps {
  /** Select options */
  options?: Option[] | OptionGroup[];
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
}

/**
 * Helper function to check if options are grouped
 */
const isOptionGroup = (options: Option[] | OptionGroup[]): options is OptionGroup[] => {
  return options.length > 0 && 'options' in options[0];
};

/**
 * SelectField component for single select dropdown
 * 
 * @example
 * ```tsx
 * <SelectField
 *   name="category"
 *   label="Category"
 *   placeholder="Select category"
 *   options={[
 *     { label: "Food", value: "food" },
 *     { label: "Transport", value: "transport" }
 *   ]}
 * />
 * ```
 */
export const SelectField = forwardRef<HTMLDivElement, SelectFieldProps>(
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
      searchable = false,
      searchPlaceholder = "Search...",
      emptyMessage = "No options found",
      loading = false,
      loadingMessage = "Loading...",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("SelectField must be used within a Form or have control prop");
    }

    const renderOptions = () => {
      if (loading) {
        return <SelectItem value="" disabled>{loadingMessage}</SelectItem>;
      }

      if (options.length === 0) {
        return <SelectItem value="" disabled>{emptyMessage}</SelectItem>;
      }

      if (isOptionGroup(options)) {
        return options.map((group) => (
          <div key={group.label}>
            <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
              {group.label}
            </div>
            {group.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <div>
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </div>
        ));
      }

      return options.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          <div>
            <div>{option.label}</div>
            {option.description && (
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            )}
          </div>
        </SelectItem>
      ));
    };

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
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled || loading}
              {...props}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {renderOptions()}
              </SelectContent>
            </Select>
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

SelectField.displayName = "SelectField";