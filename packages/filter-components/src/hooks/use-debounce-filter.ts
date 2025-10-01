import { useEffect, useState, useCallback } from "react";
import type { DebounceConfig } from "../types";

/**
 * Hook for debouncing filter values to prevent excessive updates
 * 
 * @param value - The value to debounce
 * @param config - Debounce configuration
 * @returns Debounced value
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebounceFilter(searchValue, { delay: 300 });
 * ```
 */
export function useDebounceFilter<T>(
  value: T,
  config: DebounceConfig
): T {
  const { delay, immediate = false } = config;
  const [debouncedValue, setDebouncedValue] = useState<T>(
    immediate ? value : value
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for creating a debounced callback function
 * 
 * @param callback - The callback function to debounce
 * @param delay - Debounce delay in milliseconds
 * @param deps - Dependency array for the callback
 * @returns Debounced callback function
 * 
 * @example
 * ```tsx
 * const debouncedUpdateFilter = useDebouncedCallback(
 *   (value) => updateFilter('search', value),
 *   300,
 *   [updateFilter]
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, ...deps]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

/**
 * Hook for debouncing filter state updates with additional control
 * 
 * @param initialValue - Initial filter value
 * @param config - Debounce configuration
 * @returns Object with current value, debounced value, and update function
 * 
 * @example
 * ```tsx
 * const {
 *   value: searchValue,
 *   debouncedValue: debouncedSearch,
 *   setValue: setSearchValue,
 *   flush,
 *   cancel
 * } = useFilterDebounce("", { delay: 300 });
 * ```
 */
export function useFilterDebounce<T>(
  initialValue: T,
  config: DebounceConfig
) {
  const { delay, immediate = false } = config;
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(
    immediate ? initialValue : initialValue
  );
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Update debounced value when value changes
  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setDebouncedValue(value);
      setTimeoutId(null);
    }, delay);

    setTimeoutId(newTimeoutId);

    return () => {
      if (newTimeoutId) {
        clearTimeout(newTimeoutId);
      }
    };
  }, [value, delay]);

  /**
   * Immediately flush the debounced value
   */
  const flush = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setDebouncedValue(value);
  }, [timeoutId, value]);

  /**
   * Cancel the pending debounced update
   */
  const cancel = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  /**
   * Check if there's a pending debounced update
   */
  const isPending = timeoutId !== null;

  return {
    value,
    debouncedValue,
    setValue,
    flush,
    cancel,
    isPending,
  };
}