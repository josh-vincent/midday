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
import type { BaseFieldProps } from "../types";

export interface TextFieldProps extends BaseFieldProps {
  /** Input type */
  type?: "text" | "email" | "password" | "tel" | "url";
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Auto-capitalize attribute */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Auto-correct attribute */
  autoCorrect?: "on" | "off";
  /** Spell-check attribute */
  spellCheck?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Input pattern */
  pattern?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
}

/**
 * TextField component for text input with validation
 * 
 * @example
 * ```tsx
 * <TextField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 * />
 * ```
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
      type = "text",
      autoComplete,
      autoCapitalize = "none",
      autoCorrect = "off",
      spellCheck = false,
      maxLength,
      minLength,
      pattern,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("TextField must be used within a Form or have control prop");
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
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    {leftIcon}
                  </div>
                )}
                <Input
                  {...field}
                  {...props}
                  ref={ref}
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  autoCapitalize={autoCapitalize}
                  autoCorrect={autoCorrect}
                  spellCheck={spellCheck}
                  maxLength={maxLength}
                  minLength={minLength}
                  pattern={pattern}
                  className={cn(
                    leftIcon && "pl-10",
                    rightIcon && "pr-10"
                  )}
                />
                {rightIcon && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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

TextField.displayName = "TextField";