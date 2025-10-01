export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  headers?: boolean;
  columns?: string[] | ColumnConfig[];
  filters?: Record<string, any>;
  sortBy?: SortConfig[];
  groupBy?: string[];
  dateFormat?: string;
  numberFormat?: "US" | "EU";
  includeMetadata?: boolean;
  compression?: "none" | "zip" | "gzip";
  encoding?: string;
}

export type ExportFormat = 
  | "csv"
  | "excel"
  | "json"
  | "xml"
  | "pdf"
  | "html";

export interface ColumnConfig {
  field: string;
  header?: string;
  width?: number;
  format?: (value: any) => string;
  align?: "left" | "center" | "right";
  aggregate?: "sum" | "avg" | "count" | "min" | "max";
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  fileName: string;
  format: ExportFormat;
  size: number;
  rows: number;
  url?: string;
  error?: Error;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  status: ExportStatus;
  message?: string;
  estimatedTimeRemaining?: number;
}

export type ExportStatus = 
  | "pending"
  | "preparing"
  | "processing"
  | "formatting"
  | "compressing"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  columns: ColumnConfig[];
  options: Partial<ExportOptions>;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BatchExportOptions {
  batchSize?: number;
  maxRows?: number;
  onProgress?: (progress: ExportProgress) => void;
  onBatchComplete?: (batchResult: ExportResult) => void;
  abortSignal?: AbortSignal;
}

export interface ExportSession {
  id: string;
  format: ExportFormat;
  totalRows: number;
  processedRows: number;
  status: ExportStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: ExportResult;
  error?: Error;
}

// Excel-specific types
export interface ExcelExportOptions extends ExportOptions {
  sheetName?: string;
  sheets?: ExcelSheet[];
  headerStyle?: ExcelStyle;
  dataStyle?: ExcelStyle;
  footerStyle?: ExcelStyle;
  autoFilter?: boolean;
  freezePanes?: { row?: number; column?: number };
  columnFormats?: Record<string, string>;
}

export interface ExcelSheet {
  name: string;
  data: any[];
  columns?: ColumnConfig[];
  headerStyle?: ExcelStyle;
  dataStyle?: ExcelStyle;
}

export interface ExcelStyle {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
  };
  fill?: {
    type?: "solid" | "pattern";
    color?: string;
    pattern?: string;
  };
  border?: {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
  };
  alignment?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "middle" | "bottom";
    wrapText?: boolean;
  };
}

export interface BorderStyle {
  style?: "thin" | "medium" | "thick" | "dotted" | "dashed";
  color?: string;
}

// PDF-specific types
export interface PDFExportOptions extends ExportOptions {
  orientation?: "portrait" | "landscape";
  pageSize?: "A4" | "Letter" | "Legal" | "A3";
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  header?: PDFHeaderFooter;
  footer?: PDFHeaderFooter;
  watermark?: string;
  fontSize?: number;
  fontFamily?: string;
  includePageNumbers?: boolean;
  includeTimestamp?: boolean;
}

export interface PDFHeaderFooter {
  text?: string;
  height?: number;
  fontSize?: number;
  alignment?: "left" | "center" | "right";
  includePageNumber?: boolean;
  includeDate?: boolean;
}