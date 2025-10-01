import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterState, FilterSyncConfig } from "../types";
import { serializeFiltersToQuery, deserializeFiltersFromQuery, areFiltersEqual, debounce } from "../utils";

/**
 * Hook for synchronizing filters with URL query parameters
 * 
 * @param filters - Current filter state
 * @param setFilters - Function to update filter state
 * @param config - Sync configuration options
 * @returns Object with sync utilities
 * 
 * @example
 * ```tsx
 * const { syncToUrl, syncFromUrl, isSyncing } = useFilterSync(
 *   filters,
 *   setFilters,
 *   { enabled: true, debounceMs: 500 }
 * );
 * ```
 */
export function useFilterSync<T extends FilterState>(
  filters: T,
  setFilters: (filters: T) => void,
  config: FilterSyncConfig = { enabled: true },
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastSyncedFilters = useRef<T>(filters);
  const isSyncing = useRef(false);

  const {
    enabled = true,
    debounceMs = 300,
    serialize = serializeFiltersToQuery,
    deserialize = deserializeFiltersFromQuery,
  } = config;

  /**
   * Update URL with current filter state
   */
  const syncToUrl = useCallback((filtersToSync: T) => {
    if (!enabled || isSyncing.current) return;

    try {
      const serialized = serialize(filtersToSync);
      const params = new URLSearchParams();

      // Add non-filter params from current URL
      for (const [key, value] of searchParams.entries()) {
        if (!key.endsWith('_from') && !key.endsWith('_to') && 
            !key.endsWith('_min') && !key.endsWith('_max') &&
            !Object.keys(filtersToSync).includes(key)) {
          params.set(key, value);
        }
      }

      // Add serialized filters
      for (const [key, value] of Object.entries(serialized)) {
        if (value) {
          params.set(key, value);
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `?${queryString}` : window.location.pathname;
      
      // Only update if the URL would actually change
      if (window.location.search !== (queryString ? `?${queryString}` : '')) {
        isSyncing.current = true;
        router.replace(newUrl, { scroll: false });
        
        // Reset syncing flag after navigation
        setTimeout(() => {
          isSyncing.current = false;
        }, 100);
      }
      
      lastSyncedFilters.current = filtersToSync;
    } catch (error) {
      console.warn("Failed to sync filters to URL:", error);
    }
  }, [enabled, serialize, searchParams, router]);

  /**
   * Debounced version of syncToUrl
   */
  const debouncedSyncToUrl = useCallback(
    debounce(syncToUrl, debounceMs),
    [syncToUrl, debounceMs]
  );

  /**
   * Load filters from current URL
   */
  const syncFromUrl = useCallback((): T => {
    if (!enabled) return filters;

    try {
      const params: Record<string, string> = {};
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      const deserialized = deserialize(params) as T;
      return deserialized;
    } catch (error) {
      console.warn("Failed to sync filters from URL:", error);
      return filters;
    }
  }, [enabled, deserialize, searchParams, filters]);

  /**
   * Initialize filters from URL on mount
   */
  useEffect(() => {
    if (!enabled) return;

    const urlFilters = syncFromUrl();
    if (urlFilters && Object.keys(urlFilters).length > 0) {
      // Only update if the filters are actually different
      if (!areFiltersEqual(urlFilters, filters)) {
        isSyncing.current = true;
        setFilters(urlFilters);
        lastSyncedFilters.current = urlFilters;
        
        setTimeout(() => {
          isSyncing.current = false;
        }, 100);
      }
    }
  }, [enabled]); // Only run on mount

  /**
   * Sync filters to URL when they change
   */
  useEffect(() => {
    if (!enabled || isSyncing.current) return;

    // Only sync if filters have actually changed
    if (!areFiltersEqual(filters, lastSyncedFilters.current)) {
      debouncedSyncToUrl(filters);
    }
  }, [filters, enabled, debouncedSyncToUrl]);

  /**
   * Clear all URL parameters related to filters
   */
  const clearUrlFilters = useCallback(() => {
    if (!enabled) return;

    const params = new URLSearchParams();
    
    // Keep non-filter params
    for (const [key, value] of searchParams.entries()) {
      if (!key.endsWith('_from') && !key.endsWith('_to') && 
          !key.endsWith('_min') && !key.endsWith('_max') &&
          !Object.keys(filters).includes(key)) {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    
    isSyncing.current = true;
    router.replace(newUrl, { scroll: false });
    
    setTimeout(() => {
      isSyncing.current = false;
    }, 100);
  }, [enabled, searchParams, router, filters]);

  /**
   * Get the current URL with filters
   */
  const getUrlWithFilters = useCallback((filtersToInclude: T): string => {
    if (!enabled) return window.location.href;

    try {
      const serialized = serialize(filtersToInclude);
      const params = new URLSearchParams();

      // Add non-filter params from current URL
      for (const [key, value] of searchParams.entries()) {
        if (!key.endsWith('_from') && !key.endsWith('_to') && 
            !key.endsWith('_min') && !key.endsWith('_max') &&
            !Object.keys(filtersToInclude).includes(key)) {
          params.set(key, value);
        }
      }

      // Add serialized filters
      for (const [key, value] of Object.entries(serialized)) {
        if (value) {
          params.set(key, value);
        }
      }

      const queryString = params.toString();
      const baseUrl = window.location.origin + window.location.pathname;
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    } catch (error) {
      console.warn("Failed to generate URL with filters:", error);
      return window.location.href;
    }
  }, [enabled, serialize, searchParams]);

  return {
    syncToUrl: debouncedSyncToUrl,
    syncFromUrl,
    clearUrlFilters,
    getUrlWithFilters,
    isSyncing: isSyncing.current,
  };
}