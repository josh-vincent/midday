// Import/Export types for CSV parsing and data import

export interface ParsedImportData {
  date?: string;
  description?: string;
  amount?: number;
  category?: string;
  accountNumber?: string;
  accountName?: string;
  [key: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
  row?: number;
  value?: any;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: any) => any;
  required?: boolean;
  dataType?: "string" | "number" | "date" | "boolean";
  format?: string;
}
