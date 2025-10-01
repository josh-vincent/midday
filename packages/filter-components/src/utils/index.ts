import type { FilterState, DateRangePreset, AmountRange } from "../types";
import { endOfDay, startOfDay, subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "react-day-picker";

/**
 * Check if a single filter value is active (has meaningful content)
 */
export function isFilterValueActive(value: any): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null) {
    // Handle date ranges
    if ("from" in value && "to" in value) {
      return !!(value.from || value.to);
    }
    // Handle amount ranges
    if ("min" in value || "max" in value) {
      return value.min !== undefined || value.max !== undefined;
    }
    // Handle other objects
    return Object.keys(value).length > 0;
  }
  return true;
}

/**
 * Check if a filter object has any active filters
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some(isFilterValueActive);
}

/**
 * Clean filters by removing null/undefined/empty values
 */
export function cleanFilters(filters: FilterState): FilterState {
  return Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => isFilterValueActive(value)),
  );
}

/**
 * Compare two filter objects for equality
 */
export function areFiltersEqual(
  filters1: FilterState,
  filters2: FilterState,
): boolean {
  const normalize = (filters: FilterState) => {
    const cleaned = cleanFilters(filters);
    return JSON.stringify(cleaned, Object.keys(cleaned).sort());
  };

  return normalize(filters1) === normalize(filters2);
}

/**
 * Create an empty filter state for any entity
 */
export function createEmptyFilterState<T extends FilterState>(
  keys: (keyof T)[],
): T {
  return keys.reduce((acc, key) => {
    (acc as any)[key] = null;
    return acc;
  }, {} as T);
}

/**
 * Merge multiple filter states
 */
export function mergeFilters(...filterStates: FilterState[]): FilterState {
  return filterStates.reduce((acc, filters) => ({ ...acc, ...filters }), {});
}

/**
 * Deep clone a filter state
 */
export function cloneFilters<T extends FilterState>(filters: T): T {
  return JSON.parse(JSON.stringify(filters));
}

/**
 * Serialize filters to URL-safe query parameters
 */
export function serializeFiltersToQuery(filters: FilterState): Record<string, string> {
  const cleaned = cleanFilters(filters);
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(cleaned)) {
    if (Array.isArray(value)) {
      result[key] = value.join(",");
    } else if (typeof value === "object" && value !== null) {
      // Handle date ranges
      if ("from" in value && "to" in value) {
        if (value.from) result[`${key}_from`] = value.from.toISOString();
        if (value.to) result[`${key}_to`] = value.to.toISOString();
      }
      // Handle amount ranges
      else if ("min" in value || "max" in value) {
        if (value.min !== undefined) result[`${key}_min`] = value.min.toString();
        if (value.max !== undefined) result[`${key}_max`] = value.max.toString();
      }
      // Handle other objects
      else {
        result[key] = JSON.stringify(value);
      }
    } else {
      result[key] = value.toString();
    }
  }

  return result;
}

/**
 * Deserialize URL query parameters to filters
 */
export function deserializeFiltersFromQuery(query: Record<string, string>): FilterState {
  const filters: FilterState = {};
  const dateRangeKeys = new Set<string>();
  const amountRangeKeys = new Set<string>();

  // First pass: identify date and amount range keys
  for (const key of Object.keys(query)) {
    if (key.endsWith("_from") || key.endsWith("_to")) {
      const baseKey = key.replace(/_from|_to$/, "");
      dateRangeKeys.add(baseKey);
    } else if (key.endsWith("_min") || key.endsWith("_max")) {
      const baseKey = key.replace(/_min|_max$/, "");
      amountRangeKeys.add(baseKey);
    }
  }

  // Second pass: process all parameters
  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;

    // Skip range components - they're handled below
    if (key.endsWith("_from") || key.endsWith("_to") || key.endsWith("_min") || key.endsWith("_max")) {
      continue;
    }

    // Handle arrays (comma-separated values)
    if (value.includes(",")) {
      filters[key] = value.split(",");
    }
    // Handle JSON objects
    else if (value.startsWith("{") && value.endsWith("}")) {
      try {
        filters[key] = JSON.parse(value);
      } catch {
        filters[key] = value;
      }
    }
    // Handle boolean values
    else if (value === "true" || value === "false") {
      filters[key] = value === "true";
    }
    // Handle numbers
    else if (!isNaN(Number(value))) {
      filters[key] = Number(value);
    }
    // Handle strings
    else {
      filters[key] = value;
    }
  }

  // Process date ranges
  for (const baseKey of dateRangeKeys) {
    const fromValue = query[`${baseKey}_from`];
    const toValue = query[`${baseKey}_to`];
    
    if (fromValue || toValue) {
      filters[baseKey] = {
        from: fromValue ? new Date(fromValue) : undefined,
        to: toValue ? new Date(toValue) : undefined,
      };
    }
  }

  // Process amount ranges
  for (const baseKey of amountRangeKeys) {
    const minValue = query[`${baseKey}_min`];
    const maxValue = query[`${baseKey}_max`];
    
    if (minValue || maxValue) {
      filters[baseKey] = {
        min: minValue ? Number(minValue) : undefined,
        max: maxValue ? Number(maxValue) : undefined,
      };
    }
  }

  return filters;
}

/**
 * Debounce utility function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Default date range presets
 */
export const DEFAULT_DATE_PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    value: "today",
    dateRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    value: "yesterday",
    dateRange: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
  },
  {
    label: "Last 7 days",
    value: "last7days",
    dateRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    value: "last30days",
    dateRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 90 days",
    value: "last90days",
    dateRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    value: "thismonth",
    dateRange: () => {
      const now = new Date();
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    },
  },
  {
    label: "Last month",
    value: "lastmonth",
    dateRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)),
        to: endOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)),
      };
    },
  },
  {
    label: "This year",
    value: "thisyear",
    dateRange: () => {
      const now = new Date();
      return {
        from: startOfDay(new Date(now.getFullYear(), 0, 1)),
        to: endOfDay(new Date(now.getFullYear(), 11, 31)),
      };
    },
  },
  {
    label: "Last year",
    value: "lastyear",
    dateRange: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfDay(new Date(lastYear.getFullYear(), 0, 1)),
        to: endOfDay(new Date(lastYear.getFullYear(), 11, 31)),
      };
    },
  },
];

/**
 * Validate amount range
 */
export function validateAmountRange(range: AmountRange): boolean {
  if (range.min !== undefined && range.max !== undefined) {
    return range.min <= range.max;
  }
  return true;
}

/**
 * Format amount range for display
 */
export function formatAmountRange(range: AmountRange): string {
  if (range.min !== undefined && range.max !== undefined) {
    return `$${range.min} - $${range.max}`;
  }
  if (range.min !== undefined) {
    return `≥ $${range.min}`;
  }
  if (range.max !== undefined) {
    return `≤ $${range.max}`;
  }
  return "";
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}