import { z } from "zod";

/**
 * Common validation schemas and utilities
 */

// Basic string validations
export const stringValidation = {
  required: (message = "This field is required") => z.string().min(1, message),
  email: (message = "Please enter a valid email address") => 
    z.string().email(message),
  url: (message = "Please enter a valid URL") => 
    z.string().url(message),
  minLength: (length: number, message?: string) => 
    z.string().min(length, message || `Must be at least ${length} characters`),
  maxLength: (length: number, message?: string) => 
    z.string().max(length, message || `Must be no more than ${length} characters`),
  pattern: (regex: RegExp, message = "Invalid format") => 
    z.string().regex(regex, message),
  phone: (message = "Please enter a valid phone number") =>
    z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, message),
  alphanumeric: (message = "Only letters and numbers are allowed") =>
    z.string().regex(/^[a-zA-Z0-9]+$/, message),
  noSpaces: (message = "Spaces are not allowed") =>
    z.string().regex(/^\S+$/, message),
};

// Number validations
export const numberValidation = {
  required: (message = "This field is required") => z.number(),
  min: (value: number, message?: string) => 
    z.number().min(value, message || `Must be at least ${value}`),
  max: (value: number, message?: string) => 
    z.number().max(value, message || `Must be no more than ${value}`),
  positive: (message = "Must be a positive number") => 
    z.number().positive(message),
  negative: (message = "Must be a negative number") => 
    z.number().negative(message),
  integer: (message = "Must be a whole number") => 
    z.number().int(message),
  multipleOf: (value: number, message?: string) => 
    z.number().multipleOf(value, message || `Must be a multiple of ${value}`),
};

// Date validations
export const dateValidation = {
  required: (message = "This field is required") => z.date(),
  min: (date: Date, message?: string) => 
    z.date().min(date, message || `Must be after ${date.toDateString()}`),
  max: (date: Date, message?: string) => 
    z.date().max(date, message || `Must be before ${date.toDateString()}`),
  future: (message = "Must be a future date") => 
    z.date().min(new Date(), message),
  past: (message = "Must be a past date") => 
    z.date().max(new Date(), message),
  age: (minAge: number, message?: string) => 
    z.date().max(
      new Date(Date.now() - minAge * 365.25 * 24 * 60 * 60 * 1000),
      message || `Must be at least ${minAge} years old`
    ),
};

// Array validations
export const arrayValidation = {
  required: (message = "At least one item is required") => 
    z.array(z.any()).min(1, message),
  minLength: (length: number, message?: string) => 
    z.array(z.any()).min(length, message || `Must have at least ${length} items`),
  maxLength: (length: number, message?: string) => 
    z.array(z.any()).max(length, message || `Must have no more than ${length} items`),
  unique: (message = "Items must be unique") => 
    z.array(z.any()).refine(
      (items) => new Set(items).size === items.length,
      { message }
    ),
};

// File validations
export const fileValidation = {
  required: (message = "Please select a file") => 
    z.any().refine((file) => file instanceof File, message),
  maxSize: (maxBytes: number, message?: string) => 
    z.any().refine(
      (file) => file instanceof File && file.size <= maxBytes,
      message || `File size must be less than ${formatBytes(maxBytes)}`
    ),
  mimeType: (types: string[], message?: string) => 
    z.any().refine(
      (file) => file instanceof File && types.includes(file.type),
      message || `File type must be one of: ${types.join(", ")}`
    ),
  extension: (extensions: string[], message?: string) => 
    z.any().refine(
      (file) => {
        if (!(file instanceof File)) return false;
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext ? extensions.includes(ext) : false;
      },
      message || `File extension must be one of: ${extensions.join(", ")}`
    ),
};

// Password validations
export const passwordValidation = {
  strong: (message = "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character") =>
    z.string().regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message
    ),
  medium: (message = "Password must contain at least 6 characters with letters and numbers") =>
    z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, message),
  confirm: (passwordField: string, message = "Passwords do not match") => 
    z.string().refine(
      (confirmPassword, ctx) => {
        const password = ctx.parent[passwordField];
        return password === confirmPassword;
      },
      { message }
    ),
};

// Credit card validations
export const creditCardValidation = {
  number: (message = "Please enter a valid credit card number") =>
    z.string().refine(luhnCheck, message),
  cvv: (message = "Please enter a valid CVV") =>
    z.string().regex(/^\d{3,4}$/, message),
  expiryMonth: (message = "Please enter a valid month (01-12)") =>
    z.string().regex(/^(0[1-9]|1[0-2])$/, message),
  expiryYear: (message = "Please enter a valid year") =>
    z.string().regex(/^\d{4}$/, message).refine(
      (year) => parseInt(year) >= new Date().getFullYear(),
      "Year cannot be in the past"
    ),
};

// Social security and identification
export const identificationValidation = {
  ssn: (message = "Please enter a valid Social Security Number") =>
    z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, message),
  ein: (message = "Please enter a valid Employer Identification Number") =>
    z.string().regex(/^\d{2}-?\d{7}$/, message),
  uuid: (message = "Please enter a valid UUID") =>
    z.string().uuid(message),
};

// Business validations
export const businessValidation = {
  taxId: (message = "Please enter a valid Tax ID") =>
    z.string().regex(/^\d{2}-?\d{7}$/, message),
  vatNumber: (message = "Please enter a valid VAT number") =>
    z.string().min(8).max(15),
};

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0 && digits.length >= 13;
}

// Conditional validation helpers
export const conditionalValidation = {
  when: <T>(
    condition: (data: any) => boolean,
    schema: z.ZodType<T>,
    elseSchema?: z.ZodType<T>
  ) => {
    return z.any().superRefine((data, ctx) => {
      const targetSchema = condition(ctx.parent || {}) ? schema : elseSchema;
      if (targetSchema) {
        const result = targetSchema.safeParse(data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue(issue);
          });
        }
      }
    });
  },
  
  required: <T>(
    condition: (data: any) => boolean,
    schema: z.ZodType<T>,
    message = "This field is required"
  ) => {
    return z.any().superRefine((data, ctx) => {
      if (condition(ctx.parent || {}) && (!data || data === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
        });
      } else if (data && data !== "") {
        const result = schema.safeParse(data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue(issue);
          });
        }
      }
    });
  },
};

// Form schema builders
export const createFormSchema = (fields: Record<string, z.ZodType<any>>) => {
  return z.object(fields);
};

export const createStepSchema = (steps: Record<string, z.ZodType<any>>) => {
  return z.object(steps);
};