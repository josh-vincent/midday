import { z } from "zod";
import type {
  ValidationError,
  ValidationRule,
  ColumnMapping,
  ImportResult,
} from "../types";

export class DataValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private uniqueValues = new Map<string, Set<any>>();

  constructor(private mappings: ColumnMapping[]) {
    // Initialize unique value tracking
    this.mappings.forEach(mapping => {
      if (mapping.validation?.some(v => v.type === "unique")) {
        this.uniqueValues.set(mapping.targetField, new Set());
      }
    });
  }

  /**
   * Validate a single row of data
   */
  validateRow(
    row: Record<string, any>,
    rowIndex: number,
    transformedRow?: Record<string, any>
  ): boolean {
    let isValid = true;
    const dataToValidate = transformedRow || row;

    for (const mapping of this.mappings) {
      const value = dataToValidate[mapping.targetField];
      const sourceValue = row[mapping.sourceColumn];

      // Check required fields
      if (mapping.required && (value === undefined || value === null || value === "")) {
        this.addError({
          row: rowIndex,
          column: mapping.sourceColumn,
          field: mapping.targetField,
          message: `${mapping.targetField} is required`,
          value: sourceValue,
          type: "required",
        });
        isValid = false;
        continue;
      }

      // Skip validation for empty optional fields
      if (!mapping.required && (value === undefined || value === null || value === "")) {
        continue;
      }

      // Apply validation rules
      if (mapping.validation) {
        for (const rule of mapping.validation) {
          if (!this.validateRule(value, rule, row, rowIndex, mapping)) {
            isValid = false;
          }
        }
      }

      // Track unique values
      if (this.uniqueValues.has(mapping.targetField)) {
        const uniqueSet = this.uniqueValues.get(mapping.targetField)!;
        if (uniqueSet.has(value)) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: `Duplicate value found for ${mapping.targetField}`,
            value,
            type: "unique",
          });
          isValid = false;
        } else if (value !== undefined && value !== null) {
          uniqueSet.add(value);
        }
      }
    }

    return isValid;
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    value: any,
    rule: ValidationRule,
    row: Record<string, any>,
    rowIndex: number,
    mapping: ColumnMapping
  ): boolean {
    switch (rule.type) {
      case "required":
        if (value === undefined || value === null || value === "") {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} is required`,
            value,
            type: "required",
          });
          return false;
        }
        break;

      case "min":
        if (typeof value === "number" && value < rule.value) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} must be at least ${rule.value}`,
            value,
            type: "min",
          });
          return false;
        }
        if (typeof value === "string" && value.length < rule.value) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} must be at least ${rule.value} characters`,
            value,
            type: "min",
          });
          return false;
        }
        break;

      case "max":
        if (typeof value === "number" && value > rule.value) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} must be at most ${rule.value}`,
            value,
            type: "max",
          });
          return false;
        }
        if (typeof value === "string" && value.length > rule.value) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} must be at most ${rule.value} characters`,
            value,
            type: "max",
          });
          return false;
        }
        break;

      case "pattern":
        if (typeof value === "string" && !new RegExp(rule.value).test(value)) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} format is invalid`,
            value,
            type: "pattern",
          });
          return false;
        }
        break;

      case "custom":
        if (rule.validator && !rule.validator(value, row)) {
          this.addError({
            row: rowIndex,
            column: mapping.sourceColumn,
            field: mapping.targetField,
            message: rule.message || `${mapping.targetField} validation failed`,
            value,
            type: "custom",
          });
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * Add an error
   */
  addError(error: ValidationError): void {
    this.errors.push(error);
  }

  /**
   * Add a warning
   */
  addWarning(warning: ValidationError): void {
    this.warnings.push(warning);
  }

  /**
   * Get all errors
   */
  getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * Get all warnings
   */
  getWarnings(): ValidationError[] {
    return this.warnings;
  }

  /**
   * Clear errors and warnings
   */
  reset(): void {
    this.errors = [];
    this.warnings = [];
    this.uniqueValues.forEach(set => set.clear());
  }
}

/**
 * Create a Zod schema from column mappings
 */
export function createZodSchema(mappings: ColumnMapping[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const mapping of mappings) {
    let fieldSchema: z.ZodTypeAny;

    // Base type schema
    switch (mapping.dataType) {
      case "number":
      case "currency":
      case "percentage":
        fieldSchema = z.number();
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "date":
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
        break;
      case "email":
        fieldSchema = z.string().email();
        break;
      case "url":
        fieldSchema = z.string().url();
        break;
      case "phone":
        fieldSchema = z.string().regex(/^[\d\s\-\(\)]+$/);
        break;
      default:
        fieldSchema = z.string();
    }

    // Apply validation rules
    if (mapping.validation) {
      for (const rule of mapping.validation) {
        switch (rule.type) {
          case "min":
            if (mapping.dataType === "number" || mapping.dataType === "currency" || mapping.dataType === "percentage") {
              fieldSchema = (fieldSchema as z.ZodNumber).min(rule.value);
            } else {
              fieldSchema = (fieldSchema as z.ZodString).min(rule.value);
            }
            break;
          case "max":
            if (mapping.dataType === "number" || mapping.dataType === "currency" || mapping.dataType === "percentage") {
              fieldSchema = (fieldSchema as z.ZodNumber).max(rule.value);
            } else {
              fieldSchema = (fieldSchema as z.ZodString).max(rule.value);
            }
            break;
          case "pattern":
            if (typeof rule.value === "string") {
              fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(rule.value));
            }
            break;
        }
      }
    }

    // Make optional if not required
    if (!mapping.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[mapping.targetField] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Validate data against business rules
 */
export function validateBusinessRules(
  data: Record<string, any>[],
  rules: BusinessRule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    const result = rule.validate(data);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  return errors;
}

export interface BusinessRule {
  name: string;
  description?: string;
  validate: (data: Record<string, any>[]) => BusinessRuleResult;
}

export interface BusinessRuleResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

/**
 * Common business rules
 */
export const commonBusinessRules = {
  noDuplicates: (field: string): BusinessRule => ({
    name: `No duplicates in ${field}`,
    validate: (data) => {
      const seen = new Set();
      const errors: ValidationError[] = [];

      data.forEach((row, index) => {
        const value = row[field];
        if (value && seen.has(value)) {
          errors.push({
            row: index,
            field,
            message: `Duplicate value found: ${value}`,
            value,
            type: "duplicate",
          });
        }
        seen.add(value);
      });

      return { valid: errors.length === 0, errors };
    },
  }),

  dateRange: (field: string, min: Date, max: Date): BusinessRule => ({
    name: `${field} between ${min.toISOString()} and ${max.toISOString()}`,
    validate: (data) => {
      const errors: ValidationError[] = [];

      data.forEach((row, index) => {
        const value = row[field];
        if (value) {
          const date = new Date(value);
          if (date < min || date > max) {
            errors.push({
              row: index,
              field,
              message: `Date must be between ${min.toISOString()} and ${max.toISOString()}`,
              value,
              type: "dateRange",
            });
          }
        }
      });

      return { valid: errors.length === 0, errors };
    },
  }),

  sumEquals: (fields: string[], total: number): BusinessRule => ({
    name: `Sum of ${fields.join(", ")} equals ${total}`,
    validate: (data) => {
      const errors: ValidationError[] = [];

      data.forEach((row, index) => {
        const sum = fields.reduce((acc, field) => acc + (row[field] || 0), 0);
        if (Math.abs(sum - total) > 0.01) {
          errors.push({
            row: index,
            field: fields.join(", "),
            message: `Sum (${sum}) does not equal expected total (${total})`,
            value: sum,
            type: "sumMismatch",
          });
        }
      });

      return { valid: errors.length === 0, errors };
    },
  }),
};