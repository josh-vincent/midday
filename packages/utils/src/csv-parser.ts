import Papa from "papaparse";
import {
  ParsedImportData,
  ValidationError,
  ColumnMapping,
} from "@midday/db/types";

export interface CSVParseResult {
  data: any[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export interface ParseOptions {
  header?: boolean;
  delimiter?: string;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

/**
 * Parse CSV content into structured data
 */
export async function parseCSV(
  content: string | File,
  options: ParseOptions = {},
): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: options.header !== false,
      delimiter: options.delimiter,
      skipEmptyLines: options.skipEmptyLines !== false,
      transformHeader: options.transformHeader || ((h) => h.trim()),
      complete: (results) => {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Apply column mappings to transform raw CSV data to structured format
 */
export function applyColumnMappings(
  rawData: Record<string, any>,
  mappings: ColumnMapping[],
): ParsedImportData {
  const result: ParsedImportData = {};

  for (const mapping of mappings) {
    const sourceValue = rawData[mapping.sourceColumn];

    if (
      sourceValue === undefined ||
      sourceValue === null ||
      sourceValue === ""
    ) {
      if (mapping.required) {
        // Will be caught in validation
      }
      continue;
    }

    const transformedValue = transformValue(
      sourceValue,
      mapping.dataType,
      mapping.format,
      mapping.transform,
    );

    // Map to the target field
    (result as any)[mapping.targetField] = transformedValue;
  }

  return result;
}

/**
 * Transform a value based on its type and format
 */
export function transformValue(
  value: any,
  dataType?: "string" | "number" | "date" | "boolean",
  format?: string,
  transform?: ((value: any) => any) | string,
): any {
  // Apply custom transform if specified
  if (transform) {
    if (typeof transform === "function") {
      value = transform(value);
    } else {
      value = applyCustomTransform(value, transform);
    }
  }

  switch (dataType) {
    case "number":
      return parseNumber(value);

    case "date":
      return parseDate(value, format);

    case "boolean":
      return parseBoolean(value);

    case "string":
    default:
      return String(value).trim();
  }
}

/**
 * Apply custom transformations
 */
export function applyCustomTransform(value: any, transform: string): any {
  switch (transform) {
    case "uppercase":
      return String(value).toUpperCase();

    case "lowercase":
      return String(value).toLowerCase();

    case "removeSpaces":
      return String(value).replace(/\s+/g, "");

    case "extractNumbers":
      const numbers = String(value).match(/\d+\.?\d*/g);
      return numbers ? numbers.join("") : value;

    default:
      return value;
  }
}

/**
 * Parse a number value
 */
export function parseNumber(value: any): number | undefined {
  if (typeof value === "number") return value;

  // Remove common formatting
  const cleaned = String(value).replace(/[$,]/g, "").replace(/\s+/g, "").trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Parse a date value
 */
export function parseDate(value: any, format?: string): string | undefined {
  if (!value) return undefined;

  // Common Australian date formats
  const dateFormats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
  ];

  const dateStr = String(value).trim();

  for (const regex of dateFormats) {
    const match = dateStr.match(regex);
    if (match) {
      let year, month, day;

      if (regex === dateFormats[2]) {
        // YYYY-MM-DD format
        [, year, month, day] = match;
      } else {
        // DD/MM/YYYY or DD-MM-YYYY format
        [, day, month, year] = match;
      }

      // Create ISO date string (with safe fallbacks)
      return `${year}-${(month || "").padStart(2, "0")}-${(day || "").padStart(2, "0")}`;
    }
  }

  // Try native Date parsing as fallback
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return undefined;
}

/**
 * Parse a boolean value
 */
export function parseBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;

  const str = String(value).toLowerCase().trim();
  return ["true", "yes", "1", "y", "t"].includes(str);
}

/**
 * Validate parsed data
 */
export function validateImportData(
  data: ParsedImportData,
  requiredFields: string[] = [],
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const field of requiredFields) {
    if (
      !(field in data) ||
      data[field as keyof ParsedImportData] === undefined
    ) {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  }

  // Validate specific fields

  // Ticket number format
  if (data.ticketNumber && !/^[A-Z0-9-]+$/i.test(data.ticketNumber)) {
    errors.push({
      field: "ticketNumber",
      message: "Invalid ticket number format",
      value: data.ticketNumber,
    });
  }

  // Truck rego format (Australian)
  if (
    data.truckRego &&
    !/^[A-Z0-9]{1,6}$/i.test(data.truckRego.replace(/[\s-]/g, ""))
  ) {
    errors.push({
      field: "truckRego",
      message: "Invalid truck registration format",
      value: data.truckRego,
    });
  }

  // Weight validations
  if (data.grossWeight !== undefined && data.grossWeight < 0) {
    errors.push({
      field: "grossWeight",
      message: "Gross weight cannot be negative",
      value: data.grossWeight,
    });
  }

  if (data.tareWeight !== undefined && data.tareWeight < 0) {
    errors.push({
      field: "tareWeight",
      message: "Tare weight cannot be negative",
      value: data.tareWeight,
    });
  }

  if (data.grossWeight !== undefined && data.tareWeight !== undefined) {
    if (data.tareWeight > data.grossWeight) {
      errors.push({
        field: "tareWeight",
        message: "Tare weight cannot exceed gross weight",
        value: data.tareWeight,
      });
    }
  }

  // Date validations
  if (data.weighInTime && data.weighOutTime) {
    const inTime = new Date(data.weighInTime);
    const outTime = new Date(data.weighOutTime);

    if (outTime < inTime) {
      errors.push({
        field: "weighOutTime",
        message: "Weigh out time cannot be before weigh in time",
        value: data.weighOutTime,
      });
    }
  }

  return errors;
}

/**
 * Check for duplicate records based on key fields
 */
export function checkDuplicates(
  data: ParsedImportData[],
  existingRecords: ParsedImportData[] = [],
): Map<number, string> {
  const duplicates = new Map<number, string>();
  const seen = new Set<string>();

  // Build set of existing records
  for (const record of existingRecords) {
    const key = buildDuplicateKey(record);
    if (key) seen.add(key);
  }

  // Check new data for duplicates
  data.forEach((record, index) => {
    const key = buildDuplicateKey(record);
    if (!key) return;

    if (seen.has(key)) {
      duplicates.set(index, `Duplicate record: ${key}`);
    } else {
      seen.add(key);
    }
  });

  return duplicates;
}

/**
 * Build a unique key for duplicate detection
 */
export function buildDuplicateKey(data: ParsedImportData): string | null {
  // Use ticket number + truck rego + date as unique key
  if (data.ticketNumber && data.truckRego && data.weighInTime) {
    const date = data.weighInTime.split("T")[0];
    return `${data.ticketNumber}-${data.truckRego}-${date}`;
  }

  return null;
}

/**
 * Group import rows into invoices based on rules
 */
export function groupIntoInvoices(
  data: ParsedImportData[],
  groupBy: "customer" | "po" | "week" | "month" | "site" = "customer",
): Map<string, ParsedImportData[]> {
  const groups = new Map<string, ParsedImportData[]>();

  for (const row of data) {
    const key = getGroupKey(row, groupBy);
    if (!key) continue;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  return groups;
}

/**
 * Get the grouping key for a data row
 */
export function getGroupKey(
  data: ParsedImportData,
  groupBy: "customer" | "po" | "week" | "month" | "site",
): string | null {
  switch (groupBy) {
    case "customer":
      return data.customerId || data.customerName || null;

    case "po":
      return data.purchaseOrder || null;

    case "week":
      if (!data.weighInTime) return null;
      const weekDate = new Date(data.weighInTime);
      const weekNum = getWeekNumber(weekDate);
      return `${weekDate.getFullYear()}-W${weekNum}`;

    case "month":
      if (!data.weighInTime) return null;
      const monthDate = new Date(data.weighInTime);
      return `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, "0")}`;

    case "site":
      return data.siteTo || null;

    default:
      return null;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
