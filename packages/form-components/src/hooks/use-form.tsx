"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useReactHookForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { useCallback, useEffect, useRef } from "react";
import type { z } from "zod";

export interface UseFormOptions<T extends FieldValues> extends Omit<UseFormProps<T>, "resolver"> {
  /** Zod schema for validation */
  schema?: z.ZodType<T>;
  /** Auto-save configuration */
  autoSave?: {
    key: string;
    storage?: "localStorage" | "sessionStorage";
    debounceMs?: number;
    exclude?: (keyof T)[];
  };
  /** Form submission handler */
  onSubmit?: (data: T) => void | Promise<void>;
  /** Form submission error handler */
  onError?: (errors: any) => void;
  /** Transform data before submission */
  transformData?: (data: T) => T | Promise<T>;
}

/**
 * Enhanced form hook with validation, auto-save, and additional utilities
 * 
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: z.object({
 *     email: z.string().email(),
 *     name: z.string().min(1)
 *   }),
 *   defaultValues: {
 *     email: "",
 *     name: ""
 *   },
 *   autoSave: {
 *     key: "user-form",
 *     debounceMs: 1000
 *   },
 *   onSubmit: async (data) => {
 *     await api.createUser(data);
 *   }
 * });
 * ```
 */
export const useForm = <T extends FieldValues>({
  schema,
  autoSave,
  onSubmit,
  onError,
  transformData,
  ...options
}: UseFormOptions<T>) => {
  const form = useReactHookForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    ...options,
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const { key, storage = "localStorage", debounceMs = 1000, exclude = [] } = autoSave;
    
    // Load saved data on mount
    try {
      const saved = (storage === "localStorage" ? localStorage : sessionStorage).getItem(key);
      if (saved) {
        const parsedData = JSON.parse(saved);
        form.reset(parsedData);
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
    }

    // Subscribe to form changes
    const subscription = form.watch((data) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          // Filter out excluded fields
          const dataToSave = exclude.length > 0
            ? Object.fromEntries(
                Object.entries(data).filter(([key]) => !exclude.includes(key as keyof T))
              )
            : data;

          (storage === "localStorage" ? localStorage : sessionStorage).setItem(
            key,
            JSON.stringify(dataToSave)
          );
        } catch (error) {
          console.warn("Failed to save form data:", error);
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, form]);

  // Enhanced submit handler
  const handleSubmit = useCallback(
    form.handleSubmit(
      async (data: T) => {
        try {
          const processedData = transformData ? await transformData(data) : data;
          await onSubmit?.(processedData);
          
          // Clear auto-save data on successful submission
          if (autoSave) {
            try {
              const storage = autoSave.storage === "sessionStorage" ? sessionStorage : localStorage;
              storage.removeItem(autoSave.key);
            } catch (error) {
              console.warn("Failed to clear saved form data:", error);
            }
          }
        } catch (error) {
          console.error("Form submission error:", error);
          throw error;
        }
      },
      onError
    ),
    [form, onSubmit, onError, transformData, autoSave]
  );

  // Utility methods
  const clearSavedData = useCallback(() => {
    if (!autoSave) return;
    
    try {
      const storage = autoSave.storage === "sessionStorage" ? sessionStorage : localStorage;
      storage.removeItem(autoSave.key);
    } catch (error) {
      console.warn("Failed to clear saved form data:", error);
    }
  }, [autoSave]);

  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;
  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  return {
    ...form,
    handleSubmit,
    clearSavedData,
    state: {
      isDirty,
      isValid,
      isSubmitting,
      errors,
    },
  };
};