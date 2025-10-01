import { useCallback, useState } from "react";
import type { FilterState, FilterHookReturn } from "../types";
import { hasActiveFilters, createEmptyFilterState } from "../utils";

/**
 * Main hook for filter state management
 * 
 * @param initialFilters - Initial filter state
 * @param defaultKeys - Default filter keys to initialize with null values
 * @returns FilterHookReturn with filter state and management functions
 * 
 * @example
 * ```tsx
 * const { filter, setFilter, hasFilters, clearAllFilters } = useFilters({
 *   search: "",
 *   status: null,
 *   dateRange: null
 * });
 * ```
 */
export function useFilters<T extends FilterState>(
  initialFilters?: T,
  defaultKeys?: (keyof T)[],
): FilterHookReturn<T> {
  // Create initial state from provided filters or default keys
  const getInitialState = useCallback((): T => {
    if (initialFilters) {
      return initialFilters;
    }
    if (defaultKeys) {
      return createEmptyFilterState(defaultKeys);
    }
    return {} as T;
  }, [initialFilters, defaultKeys]);

  const [filter, setFilterState] = useState<T>(getInitialState);

  /**
   * Update filter state
   * Supports both direct values and updater functions
   */
  const setFilter = useCallback((newFilters: T | ((prev: T) => T)) => {
    if (typeof newFilters === "function") {
      setFilterState(newFilters);
    } else {
      setFilterState(newFilters);
    }
  }, []);

  /**
   * Update a single filter value
   */
  const updateFilter = useCallback((key: keyof T, value: any) => {
    setFilterState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Clear all filters to their initial/null state
   */
  const clearAllFilters = useCallback(() => {
    const clearedState = getInitialState();
    // Set all values to null while preserving the structure
    const resetState = Object.keys(clearedState).reduce((acc, key) => {
      acc[key as keyof T] = null as any;
      return acc;
    }, {} as T);
    setFilterState(resetState);
  }, [getInitialState]);

  /**
   * Remove a specific filter
   */
  const removeFilter = useCallback((key: keyof T) => {
    setFilterState((prev) => {
      const { [key]: removed, ...rest } = prev;
      return { ...rest, [key]: null } as T;
    });
  }, []);

  /**
   * Check if any filters are currently active
   */
  const hasFilters = hasActiveFilters(filter);

  return {
    filter,
    setFilter,
    hasFilters,
    clearAllFilters,
    updateFilter,
    removeFilter,
  } as FilterHookReturn<T> & {
    updateFilter: (key: keyof T, value: any) => void;
    removeFilter: (key: keyof T) => void;
  };
}