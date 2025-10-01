import type {
  Control,
  FieldPath,
  FieldValues,
  Path,
  PathValue,
} from "react-hook-form";

/**
 * Base interface for all form field components
 */
export interface BaseFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  /** The field name for form registration */
  name: TName;
  /** React Hook Form control object */
  control?: Control<TFieldValues>;
  /** Field label */
  label?: string;
  /** Field description/help text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Error message override */
  error?: string;
}

/**
 * Option type for select components
 */
export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

/**
 * Group of options for select components
 */
export interface OptionGroup {
  label: string;
  options: Option[];
}

/**
 * File upload types
 */
export interface FileData {
  file: File;
  preview?: string;
  id: string;
}

export interface FileUploadConfig {
  maxFiles?: number;
  maxSize?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
}

/**
 * Form step for wizard component
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  validation?: any; // Zod schema
  optional?: boolean;
}

/**
 * Form builder field configuration
 */
export interface FormFieldConfig {
  id: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "textarea"
    | "checkbox"
    | "radio"
    | "switch"
    | "file"
    | "currency"
    | "percentage"
    | "color"
    | "combobox";
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Option[] | OptionGroup[];
  validation?: any; // Zod schema
  dependsOn?: string[];
  conditional?: {
    field: string;
    value: any;
    operator: "equals" | "not_equals" | "contains" | "not_contains";
  };
  grid?: {
    column?: number;
    span?: number;
  };
}

/**
 * Form section configuration
 */
export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Form configuration for dynamic forms
 */
export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  sections: FormSectionConfig[];
  submitButton?: {
    text: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  };
}

/**
 * Field dependency configuration
 */
export interface FieldDependency<T extends FieldValues = FieldValues> {
  sourceField: Path<T>;
  targetField: Path<T>;
  transform?: (value: any) => any;
  condition?: (value: any) => boolean;
}

/**
 * Form persistence configuration
 */
export interface FormPersistenceConfig {
  key: string;
  storage?: "localStorage" | "sessionStorage";
  exclude?: string[];
  debounceMs?: number;
}

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: any) => boolean | string;
}

/**
 * Currency configuration
 */
export interface CurrencyConfig {
  currency: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Date range value
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Color value
 */
export interface ColorValue {
  hex: string;
  rgb?: { r: number; g: number; b: number };
  hsl?: { h: number; s: number; l: number };
}