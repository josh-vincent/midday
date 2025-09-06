// Import system types
export interface ImportBatch {
  id: string;
  teamId: string;
  userId: string;
  filename: string;
  status:
    | "pending"
    | "validating"
    | "validated"
    | "processing"
    | "processed"
    | "failed";
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  mappingTemplateId?: string;
  errorLog?: any;
  createdAt: string;
  processedAt?: string;
}

export interface ImportRow {
  id: string;
  batchId: string;
  rowNumber: number;
  rawData: Record<string, any>;
  parsedData?: ParsedImportData;
  validationErrors?: ValidationError[];
  invoiceId?: string;
  status: "valid" | "error" | "duplicate" | "processed";
  createdAt: string;
}

export interface ParsedImportData {
  // Customer fields
  customerName?: string;
  customerId?: string;

  // Invoice fields
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;

  // Line item fields
  ticketNumber?: string;
  truckRego?: string;
  weighInTime?: string;
  weighOutTime?: string;
  grossWeight?: number;
  tareWeight?: number;
  netTonnage?: number;
  volumeM3?: number;
  materialType?: string;
  siteFrom?: string;
  siteTo?: string;
  purchaseOrder?: string;
  costCenter?: string;
  rate?: number;
  epaLevyRate?: number;
  amount?: number;

  // Additional fields
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface MappingTemplate {
  id: string;
  teamId: string;
  customerId?: string;
  name: string;
  columnMappings: ColumnMapping[];
  validationRules?: ValidationRule[];
  groupingRules?: GroupingRule[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ColumnMapping {
  sourceColumn: string; // CSV column name
  targetField: string; // Database field name
  dataType: "string" | "number" | "date" | "boolean";
  format?: string; // Date format, number format, etc.
  transform?: string; // Transformation function name
  required?: boolean;
}

export interface ValidationRule {
  field: string;
  rule: "required" | "unique" | "min" | "max" | "regex" | "custom";
  value?: any;
  message?: string;
}

export interface GroupingRule {
  field: string;
  groupBy: "customer" | "po" | "week" | "month" | "site";
  aggregation?: "sum" | "count" | "first" | "last";
}

// Payment types
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: "bank_transfer" | "credit_card" | "cash" | "check" | "other";
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  invoiceId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  reason?: string;
  refundDate: string;
  createdBy: string;
  createdAt: string;
}

// Reminder types
export interface ReminderPolicy {
  id: string;
  teamId: string;
  name: string;
  isDefault?: boolean;
  reminders: Reminder[];
  createdAt: string;
  updatedAt?: string;
}

export interface Reminder {
  daysOffset: number; // Negative for before due date, positive for after
  channel: "email" | "sms";
  template: string;
  enabled: boolean;
}

export interface ScheduledJob {
  id: string;
  type: "send_invoice" | "send_reminder" | "process_import";
  payload: any;
  scheduledFor: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  lastError?: string;
  completedAt?: string;
  createdAt: string;
}

// Email tracking
export interface EmailDelivery {
  id: string;
  invoiceId: string;
  recipientEmail: string;
  type: string; // 'invoice', 'reminder_1', 'reminder_2', etc
  status: "sent" | "delivered" | "opened" | "bounced" | "failed";
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  bouncedAt?: string;
  errorMessage?: string;
}

// Attachment types
export interface Attachment {
  id: string;
  teamId: string;
  invoiceId?: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  uploadedBy: string;
  metadata?: AttachmentMetadata;
  createdAt: string;
}

export interface AttachmentMetadata {
  lineItemIndex?: number;
  ticketNumber?: string;
  type?: "docket" | "photo" | "document";
  description?: string;
}

// Accounting integration types
export interface AccountingConnection {
  id: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "myob";
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  config?: any;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AccountingLink {
  id: string;
  teamId: string;
  entityType: "invoice" | "customer" | "payment";
  entityId: string;
  provider: string;
  externalId: string;
  lastSyncedAt?: string;
  createdAt: string;
}

// Audit log types
export interface AuditLogEntry {
  id: string;
  teamId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Material types for dirt industry
export const MATERIAL_TYPES = [
  "Clean Fill",
  "Virgin Excavated Natural Material (VENM)",
  "Excavated Natural Material (ENM)",
  "Contaminated Soil",
  "Asbestos Contaminated",
  "General Solid Waste",
  "Construction & Demolition Waste",
  "Mixed Waste",
  "Concrete",
  "Asphalt",
  "Rock",
  "Sand",
  "Clay",
  "Topsoil",
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

// EPA levy rates (example - should be configurable)
export const EPA_LEVY_RATES: Record<string, number> = {
  "Clean Fill": 0,
  "Virgin Excavated Natural Material (VENM)": 0,
  "Excavated Natural Material (ENM)": 15.5,
  "Contaminated Soil": 146.7,
  "Asbestos Contaminated": 146.7,
  "General Solid Waste": 146.7,
  "Construction & Demolition Waste": 146.7,
  "Mixed Waste": 146.7,
};

// Helper functions for calculations
export function calculateNetTonnage(
  grossWeight: number,
  tareWeight: number,
): number {
  return Math.max(0, grossWeight - tareWeight);
}

export function calculateEPALevy(
  tonnage: number,
  materialType: string,
): number {
  const rate = EPA_LEVY_RATES[materialType] || 0;
  return tonnage * rate;
}

export function calculateLineItemTotal(
  tonnage: number,
  ratePerTonne: number,
  epaLevyAmount: number = 0,
): number {
  return tonnage * ratePerTonne + epaLevyAmount;
}
