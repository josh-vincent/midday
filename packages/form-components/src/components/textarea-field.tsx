"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Textarea } from "@midday/ui/textarea";
import { cn } from "@midday/ui/cn";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import type { BaseFieldProps } from "../types";

export interface TextareaFieldProps extends BaseFieldProps {
  /** Number of rows */
  rows?: number;
  /** Minimum height */
  minHeight?: string;
  /** Maximum height */
  maxHeight?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Whether to resize */
  resize?: "none" | "both" | "horizontal" | "vertical";
  /** Auto-resize based on content */
  autoResize?: boolean;
}

/**
 * TextareaField component for multiline text input
 * 
 * @example
 * ```tsx
 * <TextareaField
 *   name="description"
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={4}
 *   maxLength={500}
 *   autoResize
 * />
 * ```
 */
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
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
      rows = 3,
      minHeight,
      maxHeight,
      maxLength,
      minLength,
      resize = "vertical",
      autoResize = false,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("TextareaField must be used within a Form or have control prop");
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
              <Textarea
                {...field}
                {...props}
                ref={ref}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                minLength={minLength}
                className={cn(
                  resize === "none" && "resize-none",
                  resize === "both" && "resize",
                  resize === "horizontal" && "resize-x",
                  resize === "vertical" && "resize-y",
                  autoResize && "min-h-[2.5rem]"
                )}
                style={{
                  minHeight,
                  maxHeight,
                  ...(autoResize && {
                    height: "auto",
                    minHeight: "2.5rem",
                  }),
                }}
                onInput={autoResize ? (e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                } : undefined}
              />
            </FormControl>
            {description && (
              <FormDescription>
                {description}
                {maxLength && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {field.value?.length || 0}/{maxLength}
                  </span>
                )}
              </FormDescription>
            )}
            <FormMessage>{error}</FormMessage>
          </FormItem>
        )}
      />
    );
  }
);

TextareaField.displayName = "TextareaField";