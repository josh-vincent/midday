import type { DateRange } from "react-day-picker";

/**
 * Generic filter state type - can hold any filter values
 */
export type FilterState = Record<string, any>;

/**
 * Hook return type for filter management
 */
export interface FilterHookReturn<T = FilterState> {
  /** Current filter values */
  filter: T;
  /** Update filter values */
  setFilter: (filters: T | ((prev: T) => T)) => void;
  /** Check if any filters are active */
  hasFilters: boolean;
  /** Clear all filter values */
  clearAllFilters: () => void;
}

/**
 * Date range preset option
 */
export interface DateRangePreset {
  label: string;
  value: string;
  dateRange: () => DateRange | undefined;
}

/**
 * Filter option for dropdowns/selects
 */
export interface FilterOption {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}

/**
 * Status filter option with colored indicator
 */
export interface StatusOption extends FilterOption {
  color: string;
}

/**
 * Tag with visual styling
 */
export interface Tag {
  id: string;
  label: string;
  color?: string;
}

/**
 * Saved filter preset
 */
export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filter condition for advanced filter builder
 */
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter group with logical operator (AND/OR)
 */
export interface FilterGroup {
  id: string;
  operator: "AND" | "OR";
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

/**
 * Available filter operators
 */
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "between"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty";

/**
 * Filter field definition for builder
 */
export interface FilterField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "boolean";
  operators: FilterOperator[];
  options?: FilterOption[];
}

/**
 * URL sync configuration
 */
export interface FilterSyncConfig {
  /** Whether to sync filters with URL */
  enabled: boolean;
  /** Debounce delay for URL updates (ms) */
  debounceMs?: number;
  /** Custom serialization function */
  serialize?: (filters: FilterState) => Record<string, string>;
  /** Custom deserialization function */
  deserialize?: (params: Record<string, string>) => FilterState;
}

/**
 * Debounce configuration
 */
export interface DebounceConfig {
  /** Debounce delay in milliseconds */
  delay: number;
  /** Whether to debounce on mount */
  immediate?: boolean;
}

/**
 * Amount range value
 */
export interface AmountRange {
  min?: number;
  max?: number;
}

/**
 * Search field configuration
 */
export interface SearchFieldConfig {
  placeholder?: string;
  debounceMs?: number;
  clearable?: boolean;
  icon?: React.ReactNode;
}

/**
 * Multi-select filter configuration
 */
export interface MultiSelectConfig {
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplay?: number;
  clearable?: boolean;
  searchable?: boolean;
}