import { z } from "zod";
import type {
  BaseEntity,
  FormConfig,
  FormField,
  CRUDError,
  CRUDOperation,
  ToastConfig,
} from "../types";

/**
 * Error handling utilities
 */
export class CRUDErrorClass extends Error implements CRUDError {
  code: string;
  operation: CRUDOperation;
  entityId?: string;
  details?: any;
  retryable?: boolean;

  constructor(
    message: string,
    code: string,
    operation: CRUDOperation,
    entityId?: string,
    details?: any,
    retryable = false
  ) {
    super(message);
    this.name = "CRUDError";
    this.code = code;
    this.operation = operation;
    this.entityId = entityId;
    this.details = details;
    this.retryable = retryable;
  }
}

/**
 * Create a CRUD error with proper context
 */
export function createCRUDError(
  message: string,
  operation: CRUDOperation,
  options: {
    code?: string;
    entityId?: string;
    details?: any;
    retryable?: boolean;
  } = {}
): CRUDError {
  const { code = "CRUD_ERROR", entityId, details, retryable = false } = options;
  return new CRUDErrorClass(message, code, operation, entityId, details, retryable);
}

/**
 * Check if an error is a CRUD error
 */
export function isCRUDError(error: any): error is CRUDError {
  return error instanceof CRUDErrorClass || 
         (error && typeof error === "object" && "code" in error && "operation" in error);
}

/**
 * Get error message for display
 */
export function getErrorMessage(error: Error | CRUDError): string {
  if (isCRUDError(error)) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "Network connection failed. Please check your internet connection.";
      case "UNAUTHORIZED":
        return "You don't have permission to perform this action.";
      case "NOT_FOUND":
        return "The requested item could not be found.";
      case "VALIDATION_ERROR":
        return "The provided data is invalid. Please check your input.";
      case "CONFLICT":
        return "This item has been modified by someone else. Please refresh and try again.";
      default:
        return error.message;
    }
  }
  return error.message;
}

/**
 * Form configuration utilities
 */
export function createFormConfig<T>(
  schema: z.ZodSchema<T>,
  fields: FormField<T>[],
  options: Partial<FormConfig<T>> = {}
): FormConfig<T> {
  return {
    schema,
    fields,
    defaultValues: options.defaultValues,
    validation: options.validation,
    layout: options.layout,
  };
}

/**
 * Validate form data against schema
 */
export function validateFormData<T>(
  data: any,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message),
      };
    }
    return {
      success: false,
      errors: ["Validation failed"],
    };
  }
}

/**
 * Data transformation utilities
 */
export function transformEntityForForm<T extends BaseEntity>(
  entity: T,
  fields: FormField<T>[]
): Partial<T> {
  const formData: Partial<T> = {};
  
  fields.forEach((field) => {
    const value = entity[field.name];
    if (value !== undefined) {
      // Transform dates to string format for form inputs
      if (field.type === "date" || field.type === "datetime") {
        if (value instanceof Date) {
          formData[field.name] = (field.type === "date" 
            ? value.toISOString().split('T')[0] 
            : value.toISOString().slice(0, 16)
          ) as T[typeof field.name];
        } else if (typeof value === "string") {
          const date = new Date(value);
          formData[field.name] = (field.type === "date" 
            ? date.toISOString().split('T')[0] 
            : date.toISOString().slice(0, 16)
          ) as T[typeof field.name];
        }
      } else {
        formData[field.name] = value;
      }
    }
  });
  
  return formData;
}

/**
 * Transform form data back to entity format
 */
export function transformFormDataToEntity<T>(
  formData: any,
  fields: FormField<T>[]
): Partial<T> {
  const entityData: Partial<T> = {};
  
  fields.forEach((field) => {
    const value = formData[field.name];
    if (value !== undefined && value !== "") {
      // Transform string dates back to Date objects
      if (field.type === "date" || field.type === "datetime") {
        if (typeof value === "string") {
          entityData[field.name] = new Date(value) as T[typeof field.name];
        }
      } else if (field.type === "number") {
        entityData[field.name] = Number(value) as T[typeof field.name];
      } else {
        entityData[field.name] = value;
      }
    }
  });
  
  return entityData;
}

/**
 * Array utilities
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for frequent operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]!);
      } else {
        result[key] = source[key]!;
      }
    }
  }
  
  return result;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for failed operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await sleep(delay * attempt);
    }
  }
  
  throw lastError!;
}

/**
 * Toast notification utilities
 */
export function createToastConfig(
  title: string,
  description?: string,
  variant: "default" | "destructive" | "success" | "warning" = "default",
  action?: { label: string; onClick: () => void }
): ToastConfig {
  return {
    title,
    description,
    variant,
    action,
  };
}

/**
 * URL and query string utilities
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  
  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

/**
 * Date formatting utilities
 */
export function formatDate(
  date: Date | string,
  format: "short" | "medium" | "long" | "time" = "medium"
): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  
  switch (format) {
    case "short":
      return d.toLocaleDateString();
    case "medium":
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "long":
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    case "time":
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Number formatting utilities
 */
export function formatNumber(
  value: number,
  options: {
    style?: "decimal" | "currency" | "percent";
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    style = "decimal",
    currency = "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;
  
  return new Intl.NumberFormat(undefined, {
    style,
    currency: style === "currency" ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * String utilities
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function camelCaseToTitle(text: string): string {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}