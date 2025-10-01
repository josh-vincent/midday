import { useState, useCallback, useEffect } from "react";
import type { SavedFilter, FilterState } from "../types";
import { generateId } from "../utils";

/**
 * Hook for managing saved filter presets
 * 
 * @param storageKey - Key to use for localStorage (optional)
 * @returns Object with saved filters and management functions
 * 
 * @example
 * ```tsx
 * const {
 *   savedFilters,
 *   saveFilter,
 *   loadFilter,
 *   deleteFilter,
 *   updateFilter,
 *   setDefaultFilter
 * } = useSavedFilters("transaction-filters");
 * ```
 */
export function useSavedFilters<T extends FilterState>(
  storageKey?: string
) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveStorageKey = storageKey || "saved-filters";

  /**
   * Load saved filters from localStorage
   */
  const loadSavedFilters = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      
      const stored = localStorage.getItem(effectiveStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const filters = parsed.map((filter: any) => ({
          ...filter,
          createdAt: new Date(filter.createdAt),
          updatedAt: new Date(filter.updatedAt),
        }));
        setSavedFilters(filters);
      }
    } catch (error) {
      console.warn("Failed to load saved filters:", error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveStorageKey]);

  /**
   * Save filters to localStorage
   */
  const saveSavedFilters = useCallback((filters: SavedFilter[]) => {
    try {
      if (typeof window === "undefined") return;
      
      localStorage.setItem(effectiveStorageKey, JSON.stringify(filters));
    } catch (error) {
      console.warn("Failed to save filters:", error);
    }
  }, [effectiveStorageKey]);

  /**
   * Save a new filter preset
   */
  const saveFilter = useCallback((
    name: string,
    filters: T,
    description?: string,
    isDefault?: boolean
  ): SavedFilter => {
    const newFilter: SavedFilter = {
      id: generateId(),
      name,
      description,
      filters,
      isDefault: isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSavedFilters((prev) => {
      let updated = [...prev];
      
      // If this is being set as default, remove default from others
      if (isDefault) {
        updated = updated.map(filter => ({ ...filter, isDefault: false }));
      }
      
      updated.push(newFilter);
      saveSavedFilters(updated);
      return updated;
    });

    return newFilter;
  }, [saveSavedFilters]);

  /**
   * Load a saved filter preset
   */
  const loadFilter = useCallback((filterId: string): T | null => {
    const filter = savedFilters.find(f => f.id === filterId);
    return filter ? filter.filters as T : null;
  }, [savedFilters]);

  /**
   * Delete a saved filter preset
   */
  const deleteFilter = useCallback((filterId: string) => {
    setSavedFilters((prev) => {
      const updated = prev.filter(f => f.id !== filterId);
      saveSavedFilters(updated);
      return updated;
    });
  }, [saveSavedFilters]);

  /**
   * Update an existing filter preset
   */
  const updateFilter = useCallback((
    filterId: string,
    updates: Partial<Omit<SavedFilter, 'id' | 'createdAt'>>
  ) => {
    setSavedFilters((prev) => {
      const updated = prev.map(filter => {
        if (filter.id === filterId) {
          let updatedFilter = {
            ...filter,
            ...updates,
            updatedAt: new Date(),
          };

          // If this is being set as default, remove default from others
          if (updates.isDefault) {
            prev.forEach(f => {
              if (f.id !== filterId) {
                f.isDefault = false;
              }
            });
          }

          return updatedFilter;
        }
        return filter;
      });
      
      saveSavedFilters(updated);
      return updated;
    });
  }, [saveSavedFilters]);

  /**
   * Set a filter as the default
   */
  const setDefaultFilter = useCallback((filterId: string) => {
    updateFilter(filterId, { isDefault: true });
  }, [updateFilter]);

  /**
   * Get the default filter
   */
  const getDefaultFilter = useCallback((): SavedFilter | null => {
    return savedFilters.find(f => f.isDefault) || null;
  }, [savedFilters]);

  /**
   * Check if a filter name already exists
   */
  const filterNameExists = useCallback((name: string, excludeId?: string): boolean => {
    return savedFilters.some(f => f.name === name && f.id !== excludeId);
  }, [savedFilters]);

  /**
   * Get filters sorted by most recently updated
   */
  const getRecentFilters = useCallback((limit?: number): SavedFilter[] => {
    const sorted = [...savedFilters].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [savedFilters]);

  /**
   * Export all saved filters
   */
  const exportFilters = useCallback((): string => {
    return JSON.stringify(savedFilters, null, 2);
  }, [savedFilters]);

  /**
   * Import saved filters from JSON
   */
  const importFilters = useCallback((jsonString: string, replace: boolean = false) => {
    try {
      const imported: SavedFilter[] = JSON.parse(jsonString);
      
      // Validate the imported data
      const validFilters = imported.filter(filter => 
        filter.id && filter.name && filter.filters && filter.createdAt && filter.updatedAt
      ).map(filter => ({
        ...filter,
        createdAt: new Date(filter.createdAt),
        updatedAt: new Date(filter.updatedAt),
        // Regenerate IDs to avoid conflicts
        id: replace ? filter.id : generateId(),
      }));

      setSavedFilters((prev) => {
        const updated = replace ? validFilters : [...prev, ...validFilters];
        saveSavedFilters(updated);
        return updated;
      });

      return validFilters.length;
    } catch (error) {
      console.warn("Failed to import filters:", error);
      throw new Error("Invalid filter data format");
    }
  }, [saveSavedFilters]);

  /**
   * Clear all saved filters
   */
  const clearAllFilters = useCallback(() => {
    setSavedFilters([]);
    saveSavedFilters([]);
  }, [saveSavedFilters]);

  // Load saved filters on mount
  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  return {
    savedFilters,
    isLoading,
    saveFilter,
    loadFilter,
    deleteFilter,
    updateFilter,
    setDefaultFilter,
    getDefaultFilter,
    filterNameExists,
    getRecentFilters,
    exportFilters,
    importFilters,
    clearAllFilters,
    reload: loadSavedFilters,
  };
}