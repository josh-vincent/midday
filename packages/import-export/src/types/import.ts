import type { z } from "zod";

export interface ImportOptions {
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
  skipEmptyLines?: boolean;
  headerRow?: boolean;
  delimiter?: string;
  encoding?: string;
  dateFormat?: string;
  numberFormat?: "US" | "EU"; // 1,000.00 vs 1.000,00
  trimWhitespace?: boolean;
}

export interface CSVParseResult {
  data: any[];
  errors: ParseError[];
  meta: ParseMeta;
  headers?: string[];
}

export interface ParseError {
  type: "Quotes" | "Delimiter" | "FieldMismatch" | "InvalidChar" | "UndetectableDelimiter";
  code: string;
  message: string;
  row?: number;
  column?: number;
  field?: string;
}

export interface ParseMeta {
  delimiter: string;
  linebreak: string;
  aborted: boolean;
  fields?: string[];
  truncated: boolean;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  dataType: DataType;
  required?: boolean;
  format?: string;
  transform?: TransformFunction | string;
  validation?: ValidationRule[];
  defaultValue?: any;
}

export type DataType = "string" | "number" | "date" | "boolean" | "currency" | "percentage" | "email" | "phone" | "url";

export type TransformFunction = (value: any, row?: Record<string, any>) => any;

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "unique" | "custom";
  value?: any;
  message?: string;
  validator?: (value: any, row?: Record<string, any>) => boolean;
}

export interface ValidationError {
  row?: number;
  column?: string;
  field: string;
  message: string;
  value?: any;
  type?: string;
}

export interface ImportResult<T = any> {
  success: boolean;
  data: T[];
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: ImportStats;
}

export interface ImportStats {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  duplicateRows: number;
  processingTime: number;
}

export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  mappings: ColumnMapping[];
  validationSchema?: z.ZodSchema;
  sampleData?: Record<string, any>[];
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ImportSession {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  processedRows: number;
  status: ImportStatus;
  startedAt: Date;
  completedAt?: Date;
  errors: ValidationError[];
  template?: ImportTemplate;
}

export type ImportStatus = 
  | "pending"
  | "parsing"
  | "validating"
  | "mapping"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BatchImportOptions {
  batchSize?: number;
  parallel?: boolean;
  onProgress?: (progress: ImportProgress) => void;
  onBatchComplete?: (batchResult: ImportResult) => void;
  abortSignal?: AbortSignal;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  status: ImportStatus;
  message?: string;
  estimatedTimeRemaining?: number;
}