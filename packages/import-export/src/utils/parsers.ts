import Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  CSVParseResult,
  ImportOptions,
  ParseError,
  DataType,
  TransformFunction,
} from "../types";

/**
 * Parse CSV content into structured data
 */
export async function parseCSV(
  content: string | File | Blob,
  options: ImportOptions = {}
): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(content as any, {
      header: options.headerRow !== false,
      delimiter: options.delimiter,
      skipEmptyLines: options.skipEmptyLines !== false,
      encoding: options.encoding,
      transformHeader: options.trimWhitespace
        ? (header) => header.trim()
        : undefined,
      transform: options.trimWhitespace
        ? (value) => (typeof value === "string" ? value.trim() : value)
        : undefined,
      complete: (results) => {
        resolve({
          data: results.data as any[],
          errors: results.errors.map(mapPapaError),
          meta: {
            delimiter: results.meta.delimiter,
            linebreak: results.meta.linebreak,
            aborted: results.meta.aborted,
            fields: results.meta.fields,
            truncated: results.meta.truncated || false,
          },
          headers: results.meta.fields,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Parse Excel file into structured data
 */
export async function parseExcel(
  content: File | Blob | ArrayBuffer,
  options: ImportOptions = {}
): Promise<CSVParseResult> {
  try {
    let data: ArrayBuffer;

    if (content instanceof File || content instanceof Blob) {
      data = await content.arrayBuffer();
    } else {
      data = content;
    }

    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: options.headerRow === false ? 1 : undefined,
      defval: "",
      blankrows: !options.skipEmptyLines,
    });

    // Get headers
    const headers = options.headerRow !== false
      ? Object.keys(jsonData[0] || {})
      : [];

    // Transform data if needed
    const transformedData = options.trimWhitespace
      ? jsonData.map(row =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              typeof value === "string" ? value.trim() : value,
            ])
          )
        )
      : jsonData;

    return {
      data: transformedData,
      errors: [],
      meta: {
        delimiter: ",",
        linebreak: "\n",
        aborted: false,
        fields: headers,
        truncated: false,
      },
      headers,
    };
  } catch (error) {
    throw new Error(`Excel parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Auto-detect file format and parse accordingly
 */
export async function parseFile(
  file: File,
  options: ImportOptions = {}
): Promise<CSVParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "xlsx":
    case "xls":
      return parseExcel(file, options);
    case "csv":
    case "txt":
    default:
      return parseCSV(file, options);
  }
}

/**
 * Map Papa Parse errors to our error format
 */
function mapPapaError(error: Papa.ParseError): ParseError {
  return {
    type: error.type as any,
    code: error.code,
    message: error.message,
    row: error.row,
    column: undefined,
    field: undefined,
  };
}

/**
 * Transform a value based on its data type
 */
export function transformValue(
  value: any,
  dataType: DataType,
  format?: string,
  transform?: TransformFunction | string
): any {
  // Apply custom transform first
  if (transform) {
    if (typeof transform === "function") {
      value = transform(value);
    } else {
      value = applyStringTransform(value, transform);
    }
  }

  // Then apply type transformation
  switch (dataType) {
    case "number":
      return parseNumber(value, format);
    case "currency":
      return parseCurrency(value, format);
    case "percentage":
      return parsePercentage(value);
    case "date":
      return parseDate(value, format);
    case "boolean":
      return parseBoolean(value);
    case "email":
      return parseEmail(value);
    case "phone":
      return parsePhone(value, format);
    case "url":
      return parseUrl(value);
    case "string":
    default:
      return String(value || "").trim();
  }
}

/**
 * Apply string transformations
 */
function applyStringTransform(value: any, transform: string): any {
  const str = String(value || "");

  switch (transform) {
    case "uppercase":
      return str.toUpperCase();
    case "lowercase":
      return str.toLowerCase();
    case "capitalize":
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    case "trim":
      return str.trim();
    case "removeSpaces":
      return str.replace(/\s+/g, "");
    case "removeSpecialChars":
      return str.replace(/[^a-zA-Z0-9\s]/g, "");
    case "extractNumbers":
      return str.replace(/[^0-9.-]/g, "");
    case "extractLetters":
      return str.replace(/[^a-zA-Z]/g, "");
    default:
      return str;
  }
}

/**
 * Parse number with locale support
 */
function parseNumber(value: any, format?: string): number | undefined {
  if (typeof value === "number") return value;
  if (!value) return undefined;

  let str = String(value);

  // Handle different number formats
  if (format === "EU") {
    // European format: 1.234,56
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    // US format: 1,234.56
    str = str.replace(/,/g, "");
  }

  // Remove currency symbols and spaces
  str = str.replace(/[^0-9.-]/g, "");

  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse currency value
 */
function parseCurrency(value: any, format?: string): number | undefined {
  if (!value) return undefined;

  let str = String(value);
  
  // Remove currency symbols
  str = str.replace(/[$€£¥₹¢]/g, "");
  
  return parseNumber(str, format);
}

/**
 * Parse percentage value
 */
function parsePercentage(value: any): number | undefined {
  if (!value) return undefined;

  let str = String(value);
  
  // Remove percentage symbol
  str = str.replace(/%/g, "");
  
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num / 100;
}

/**
 * Parse date with multiple format support
 */
function parseDate(value: any, format?: string): string | undefined {
  if (!value) return undefined;

  const dateStr = String(value).trim();
  
  // Common date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY or DD-MM-YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD (ISO)
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY (European)
  ];

  // Try to match known formats
  for (const regex of formats) {
    const match = dateStr.match(regex);
    if (match) {
      let year, month, day;

      // Determine the order based on format hint or regex
      if (regex === formats[2]) {
        // ISO format
        [, year, month, day] = match;
      } else if (format === "US" || format === "MM/DD/YYYY") {
        [, month, day, year] = match;
      } else {
        // Default to DD/MM/YYYY for most of the world
        [, day, month, year] = match;
      }

      // Create ISO date string
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
 * Parse boolean value
 */
function parseBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;

  const str = String(value).toLowerCase().trim();
  return ["true", "yes", "1", "y", "t", "on", "enabled"].includes(str);
}

/**
 * Parse and validate email
 */
function parseEmail(value: any): string | undefined {
  if (!value) return undefined;

  const email = String(value).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email) ? email : undefined;
}

/**
 * Parse and format phone number
 */
function parsePhone(value: any, format?: string): string | undefined {
  if (!value) return undefined;

  // Remove all non-digits
  const digits = String(value).replace(/\D/g, "");
  
  if (digits.length < 10) return undefined;

  // Format based on country
  if (format === "US" && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

/**
 * Parse and validate URL
 */
function parseUrl(value: any): string | undefined {
  if (!value) return undefined;

  let url = String(value).trim();

  // Add protocol if missing
  if (!url.match(/^https?:\/\//)) {
    url = `https://${url}`;
  }

  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Detect column data types from sample data
 */
export function detectDataTypes(
  data: Record<string, any>[],
  sampleSize = 100
): Record<string, DataType> {
  const types: Record<string, DataType> = {};
  const sample = data.slice(0, sampleSize);

  if (sample.length === 0) return types;

  const columns = Object.keys(sample[0]);

  for (const column of columns) {
    const values = sample
      .map(row => row[column])
      .filter(v => v !== null && v !== undefined && v !== "");

    if (values.length === 0) {
      types[column] = "string";
      continue;
    }

    // Check for specific types
    if (values.every(v => !isNaN(parseFloat(String(v).replace(/[$,]/g, ""))))) {
      // Check if currency
      if (values.some(v => String(v).includes("$") || String(v).includes("€"))) {
        types[column] = "currency";
      } else if (values.some(v => String(v).includes("%"))) {
        types[column] = "percentage";
      } else {
        types[column] = "number";
      }
    } else if (values.every(v => parseDate(v) !== undefined)) {
      types[column] = "date";
    } else if (values.every(v => ["true", "false", "yes", "no", "1", "0"].includes(String(v).toLowerCase()))) {
      types[column] = "boolean";
    } else if (values.every(v => parseEmail(v) !== undefined)) {
      types[column] = "email";
    } else if (values.every(v => parseUrl(v) !== undefined)) {
      types[column] = "url";
    } else {
      types[column] = "string";
    }
  }

  return types;
}