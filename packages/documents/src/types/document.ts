import { z } from "zod";

// Document types
export type DocumentType = "pdf" | "excel" | "word" | "csv" | "image" | "text" | "html" | "json" | "xml";
export type DocumentFormat = "pdf" | "docx" | "xlsx" | "csv" | "png" | "jpg" | "txt" | "html" | "json" | "xml";

// Base document interface
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  format: DocumentFormat;
  size: number;
  content?: Buffer | string;
  url?: string;
  metadata?: DocumentMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  description?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  language?: string;
  encrypted?: boolean;
  custom?: Record<string, any>;
}

// Invoice specific types
export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  
  // Seller information
  seller: {
    name: string;
    address?: Address;
    email?: string;
    phone?: string;
    taxId?: string;
    logo?: string | Buffer;
  };
  
  // Buyer information
  buyer: {
    name: string;
    address?: Address;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  
  // Line items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  tax?: TaxInfo[];
  discount?: DiscountInfo;
  shipping?: number;
  total: number;
  
  // Payment information
  paymentTerms?: string;
  paymentMethods?: string[];
  bankDetails?: BankDetails;
  
  // Additional information
  notes?: string;
  terms?: string;
  currency?: string;
  locale?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  tax?: number;
  discount?: number;
  sku?: string;
  unit?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface TaxInfo {
  name: string;
  rate: number;
  amount: number;
}

export interface DiscountInfo {
  type: "percentage" | "fixed";
  value: number;
  amount: number;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
}

// Report types
export interface ReportData {
  title: string;
  subtitle?: string;
  author?: string;
  date?: Date;
  sections: ReportSection[];
  header?: ReportHeader;
  footer?: ReportFooter;
  pageSettings?: PageSettings;
}

export interface ReportSection {
  title?: string;
  content: ReportContent[];
  pageBreak?: boolean;
}

export type ReportContent = 
  | { type: "text"; value: string; style?: TextStyle }
  | { type: "table"; value: TableData }
  | { type: "chart"; value: ChartData }
  | { type: "image"; value: ImageData }
  | { type: "list"; value: ListData }
  | { type: "pageBreak" };

export interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  color?: string;
  alignment?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface TableData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  style?: TableStyle;
}

export interface TableStyle {
  headerBackground?: string;
  headerColor?: string;
  borderColor?: string;
  striped?: boolean;
  compact?: boolean;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "doughnut" | "area";
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: Record<string, any>;
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

export interface ImageData {
  src: string | Buffer;
  width?: number;
  height?: number;
  alignment?: "left" | "center" | "right";
  caption?: string;
}

export interface ListData {
  type: "bullet" | "numbered";
  items: ListItem[];
}

export interface ListItem {
  text: string;
  subitems?: ListItem[];
}

export interface ReportHeader {
  text?: string;
  logo?: string | Buffer;
  showPageNumbers?: boolean;
  showDate?: boolean;
}

export interface ReportFooter {
  text?: string;
  showPageNumbers?: boolean;
  alignment?: "left" | "center" | "right";
}

export interface PageSettings {
  format?: "A4" | "Letter" | "Legal" | "A3" | "Custom";
  orientation?: "portrait" | "landscape";
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  width?: number;
  height?: number;
}

// Processing options
export interface ProcessingOptions {
  ocr?: boolean;
  extractText?: boolean;
  extractImages?: boolean;
  extractTables?: boolean;
  extractMetadata?: boolean;
  language?: string;
  dpi?: number;
  quality?: number;
  format?: DocumentFormat;
}

// Generation options
export interface GenerationOptions {
  format: DocumentFormat;
  template?: string;
  styles?: Record<string, any>;
  fonts?: FontConfig[];
  images?: ImageConfig[];
  watermark?: WatermarkConfig;
  encryption?: EncryptionConfig;
  compression?: boolean;
  embedFonts?: boolean;
}

export interface FontConfig {
  name: string;
  path: string;
  family?: string;
}

export interface ImageConfig {
  name: string;
  path: string;
  width?: number;
  height?: number;
}

export interface WatermarkConfig {
  text?: string;
  image?: string | Buffer;
  opacity?: number;
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  rotation?: number;
}

export interface EncryptionConfig {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  };
}

// OCR types
export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  blocks?: OcrBlock[];
  pages?: OcrPage[];
}

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words?: OcrWord[];
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
  blocks: OcrBlock[];
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Barcode/QR Code types
export interface BarcodeOptions {
  format?: "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "QR" | "DATAMATRIX";
  width?: number;
  height?: number;
  text?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  color?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"; // For QR codes
}

// Validation schemas
export const invoiceDataSchema = z.object({
  invoiceNumber: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  seller: z.object({
    name: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string(),
    }).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    taxId: z.string().optional(),
  }),
  buyer: z.object({
    name: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string(),
    }).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    taxId: z.string().optional(),
  }),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
    tax: z.number().optional(),
    discount: z.number().optional(),
    sku: z.string().optional(),
    unit: z.string().optional(),
  })),
  subtotal: z.number(),
  tax: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    amount: z.number(),
  })).optional(),
  discount: z.object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number(),
    amount: z.number(),
  }).optional(),
  shipping: z.number().optional(),
  total: z.number(),
  paymentTerms: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
});