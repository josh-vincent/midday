import type { z } from "zod";

/**
 * Configuration for a database table that can be searched/filtered
 */
export type TableConfig = {
  /** Table name (for display and AI context) */
  name: string;

  /** Columns that can be searched with text queries */
  searchableColumns: string[];

  /** Status/enum column configuration */
  statusColumn?: string;
  statusValues?: string[];

  /** Relation columns mapping (e.g., { customerId: "customers" }) */
  relationColumns?: Record<string, string>;

  /** Date columns for temporal filtering */
  dateColumns?: string[];

  /** Custom AI context for this table */
  context?: string;
};

/**
 * Filter state that can be passed via URL params
 */
export type FilterState<T = Record<string, any>> = {
  /** Text search query */
  q?: string | null;

  /** Status filter */
  status?: string | null;
  statuses?: string[] | null;

  /** Date range */
  start?: string | null;
  end?: string | null;

  /** Relations */
  customers?: string[] | null;
  customerId?: string | null;

  /** Custom filters */
  [key: string]: any;
} & Partial<T>;

/**
 * Result from AI filter generation
 */
export type AIFilterResult<T extends z.ZodTypeAny> = {
  object?: z.infer<T>;
  error?: string;
};

/**
 * Configuration for AI search field component
 */
export type AISearchConfig<T extends z.ZodTypeAny> = {
  /** Table configuration (single or multiple tables) */
  tableConfig: TableConfig | TableConfig[];

  /** Zod schema for filter validation */
  schema: T;

  /** Additional AI context */
  context?: string;

  /** Enable/disable AI filtering */
  enableAI?: boolean;

  /** Placeholder text */
  placeholder?: string;
};

/**
 * Hook return type for filter params (nuqs integration)
 */
export type FilterParamsHook<T = any> = {
  filter: T;
  setParams: (params: Partial<T> | null) => void;
  hasFilters: boolean;
};

/**
 * Badge renderer function type
 */
export type BadgeRenderer = (
  key: string,
  value: any,
  context?: {
    statusFilters?: Array<{ id: string; name: string }>;
    customers?: Array<{ id: string; name: string }>;
    [key: string]: any;
  }
) => string | null;

/**
 * Filter badge data
 */
export type FilterBadge = {
  key: string;
  value: any;
  label: string;
  onRemove: () => void;
};
