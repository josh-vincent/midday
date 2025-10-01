import { z } from "zod";

/**
 * Base entity type that all CRUD entities should extend
 */
export interface BaseEntity {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * CRUD operation types
 */
export type CRUDOperation = "create" | "read" | "update" | "delete" | "archive" | "duplicate";

/**
 * Data provider interface for CRUD operations
 */
export interface DataProvider<T extends BaseEntity> {
  create: (data: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  get: (id: string) => Promise<T>;
  list: (params?: ListParams) => Promise<ListResponse<T>>;
  bulkUpdate?: (ids: string[], data: Partial<T>) => Promise<T[]>;
  bulkDelete?: (ids: string[]) => Promise<void>;
  archive?: (id: string) => Promise<T>;
  unarchive?: (id: string) => Promise<T>;
  duplicate?: (id: string, data?: Partial<T>) => Promise<T>;
  import?: (data: ImportData<T>) => Promise<ImportResult<T>>;
  export?: (params?: ExportParams) => Promise<ExportResult>;
}

/**
 * List parameters for queries
 */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

/**
 * List response format
 */
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Optimistic update configuration
 */
export interface OptimisticUpdateConfig<T> {
  enabled: boolean;
  rollbackDelay?: number;
  onRollback?: (error: Error, originalData: T) => void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * CRUD operation state
 */
export interface CRUDState<T extends BaseEntity> {
  data: T[];
  selectedIds: string[];
  isLoading: boolean;
  error: Error | null;
  lastOperation: CRUDOperation | null;
  undoStack: UndoAction<T>[];
  redoStack: UndoAction<T>[];
}

/**
 * Undo/Redo action
 */
export interface UndoAction<T> {
  type: CRUDOperation;
  data: T | T[];
  timestamp: Date;
  description: string;
}

/**
 * Form configuration for CRUD forms
 */
export interface FormConfig<T> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  fields: FormField<T>[];
  validation?: ValidationConfig;
  layout?: FormLayout;
}

/**
 * Form field configuration
 */
export interface FormField<T> {
  name: keyof T;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
  validation?: FieldValidation;
  conditional?: ConditionalField<T>;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
}

/**
 * Field types supported by the form system
 */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "time"
  | "file"
  | "currency"
  | "url"
  | "phone"
  | "custom";

/**
 * Select option for dropdowns
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

/**
 * Conditional field visibility
 */
export interface ConditionalField<T> {
  dependsOn: keyof T;
  condition: (value: any) => boolean;
}

/**
 * Form layout configuration
 */
export interface FormLayout {
  columns?: number;
  spacing?: "sm" | "md" | "lg";
  sections?: FormSection[];
}

/**
 * Form section for grouping fields
 */
export interface FormSection {
  title?: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  revalidateMode?: "onChange" | "onBlur" | "onSubmit";
}

/**
 * Import/Export types
 */
export interface ImportData<T> {
  data: Partial<T>[];
  mapping?: FieldMapping;
  options?: ImportOptions;
}

export interface FieldMapping {
  [csvColumn: string]: string; // Maps CSV column to entity field
}

export interface ImportOptions {
  skipHeader?: boolean;
  delimiter?: string;
  enclosure?: string;
  escape?: string;
  skipEmptyLines?: boolean;
  transform?: (row: any) => any;
  validate?: (row: any) => string[] | null;
}

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  total: number;
  processed: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

export interface ExportParams {
  format: ExportFormat;
  fields?: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type ExportFormat = "csv" | "xlsx" | "json" | "pdf";

export interface ExportResult {
  url?: string;
  data?: any;
  filename: string;
  format: ExportFormat;
}

/**
 * Bulk operation types
 */
export interface BulkOperation<T> {
  type: "update" | "delete" | "archive" | "unarchive";
  ids: string[];
  data?: Partial<T>;
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface BulkOperationResult<T> {
  success: string[];
  errors: BulkOperationError[];
  total: number;
  processed: number;
}

export interface BulkOperationError {
  id: string;
  message: string;
  data?: any;
}

/**
 * Conflict resolution for concurrent edits
 */
export interface ConflictResolution<T> {
  strategy: "overwrite" | "merge" | "cancel" | "manual";
  fields?: (keyof T)[];
  resolver?: (local: T, remote: T) => T;
}

/**
 * Error types
 */
export interface CRUDError extends Error {
  code: string;
  operation: CRUDOperation;
  entityId?: string;
  details?: any;
  retryable?: boolean;
}

/**
 * Progress tracking
 */
export interface ProgressState {
  current: number;
  total: number;
  status: "idle" | "running" | "completed" | "error" | "cancelled";
  message?: string;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Sheet/Modal configuration
 */
export interface SheetConfig {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "left" | "right" | "top" | "bottom";
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  overlay?: boolean;
}

/**
 * Confirmation dialog configuration
 */
export interface ConfirmationConfig {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  requireConfirmation?: boolean; // Require typing confirmation text
  confirmationText?: string;
}

/**
 * Toast notification types
 */
export interface ToastConfig {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Table configuration for data display
 */
export interface TableConfig<T> {
  columns: TableColumn<T>[];
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  pagination?: PaginationConfig;
  actions?: TableAction<T>[];
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  variant?: "default" | "destructive" | "warning";
}

export interface PaginationConfig {
  pageSize: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  showQuickJumper?: boolean;
  showTotal?: boolean;
}

/**
 * Search and filter configuration
 */
export interface SearchConfig {
  placeholder?: string;
  debounceMs?: number;
  searchFields?: string[];
  highlightResults?: boolean;
}

export interface FilterConfig<T> {
  filters: Filter<T>[];
  multiSelect?: boolean;
  clearable?: boolean;
}

export interface Filter<T> {
  key: keyof T;
  label: string;
  type: "text" | "select" | "date" | "number" | "boolean";
  options?: SelectOption[];
  operator?: FilterOperator;
}

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "between";

/**
 * Keyboard shortcuts
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}