"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Table state interface that can be persisted
 */
export interface TableState {
  /** Column visibility state */
  columnVisibility?: Record<string, boolean>;
  /** Column order */
  columnOrder?: string[];
  /** Column sizes */
  columnSizing?: Record<string, number>;
  /** Sort state */
  sorting?: Array<{ id: string; desc: boolean }>;
  /** Pagination state */
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  /** Filter state */
  globalFilter?: string;
  /** Column filters */
  columnFilters?: Array<{ id: string; value: any }>;
  /** Row selection state */
  rowSelection?: Record<string, boolean>;
  /** Custom state for specific implementations */
  customState?: Record<string, any>;
}

/**
 * Options for the useTableState hook
 */
export interface UseTableStateOptions {
  /** Unique key for localStorage storage */
  storageKey: string;
  /** Default state values */
  defaultState?: Partial<TableState>;
  /** Whether to enable persistence (default: true) */
  enablePersistence?: boolean;
  /** Storage adapter (defaults to localStorage) */
  storage?: Storage;
  /** Debounce delay for saving state (ms) */
  debounceMs?: number;
  /** Callback when state is loaded from storage */
  onStateLoaded?: (state: TableState) => void;
  /** Callback when state is saved to storage */
  onStateSaved?: (state: TableState) => void;
}

/**
 * Return type for the useTableState hook
 */
export interface UseTableStateReturn {
  /** Current table state */
  state: TableState;
  /** Update specific part of the state */
  updateState: <K extends keyof TableState>(key: K, value: TableState[K]) => void;
  /** Set entire state */
  setState: (state: Partial<TableState>) => void;
  /** Reset state to defaults */
  resetState: () => void;
  /** Manually save state to storage */
  saveState: () => void;
  /** Load state from storage */
  loadState: () => void;
  /** Clear state from storage */
  clearState: () => void;
}

/**
 * Custom hook for managing and persisting table state
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing state management functions
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   updateState,
 *   resetState
 * } = useTableState({
 *   storageKey: 'user-table-state',
 *   defaultState: {
 *     columnVisibility: { name: true, email: true, phone: false },
 *     pagination: { pageIndex: 0, pageSize: 10 }
 *   }
 * });
 * 
 * // Use with react-table
 * const table = useReactTable({
 *   data,
 *   columns,
 *   state: {
 *     columnVisibility: state.columnVisibility,
 *     sorting: state.sorting,
 *     pagination: state.pagination
 *   },
 *   onColumnVisibilityChange: (updater) => {
 *     const newValue = typeof updater === 'function' 
 *       ? updater(state.columnVisibility || {})
 *       : updater;
 *     updateState('columnVisibility', newValue);
 *   }
 * });
 * ```
 */
export function useTableState(options: UseTableStateOptions): UseTableStateReturn {
  const {
    storageKey,
    defaultState = {},
    enablePersistence = true,
    storage = typeof window !== "undefined" ? window.localStorage : null,
    debounceMs = 300,
    onStateLoaded,
    onStateSaved,
  } = options;

  const [state, setInternalState] = useState<TableState>(defaultState);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load state from storage on mount
  const loadState = useCallback(() => {
    if (!enablePersistence || !storage) return;

    try {
      const savedState = storage.getItem(storageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as TableState;
        const mergedState = { ...defaultState, ...parsedState };
        setInternalState(mergedState);
        onStateLoaded?.(mergedState);
      }
    } catch (error) {
      console.warn(`Failed to load table state from storage:`, error);
    }
  }, [storageKey, defaultState, enablePersistence, storage, onStateLoaded]);

  // Save state to storage with debouncing
  const saveState = useCallback(() => {
    if (!enablePersistence || !storage) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      try {
        storage.setItem(storageKey, JSON.stringify(state));
        onStateSaved?.(state);
      } catch (error) {
        console.warn(`Failed to save table state to storage:`, error);
      }
    }, debounceMs);

    setSaveTimeout(timeout);
  }, [state, storageKey, enablePersistence, storage, debounceMs, onStateSaved, saveTimeout]);

  // Clear state from storage
  const clearState = useCallback(() => {
    if (!enablePersistence || !storage) return;

    try {
      storage.removeItem(storageKey);
      setInternalState(defaultState);
    } catch (error) {
      console.warn(`Failed to clear table state from storage:`, error);
    }
  }, [storageKey, defaultState, enablePersistence, storage]);

  // Update specific part of state
  const updateState = useCallback(<K extends keyof TableState>(
    key: K,
    value: TableState[K]
  ) => {
    setInternalState(prev => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  }, []);

  // Set entire state
  const setState = useCallback((newState: Partial<TableState>) => {
    setInternalState(prev => ({ ...prev, ...newState }));
  }, []);

  // Reset state to defaults
  const resetState = useCallback(() => {
    setInternalState(defaultState);
    if (enablePersistence && storage) {
      try {
        storage.setItem(storageKey, JSON.stringify(defaultState));
      } catch (error) {
        console.warn(`Failed to reset table state in storage:`, error);
      }
    }
  }, [defaultState, enablePersistence, storage, storageKey]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Save state when it changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    state,
    updateState,
    setState,
    resetState,
    saveState: () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        setSaveTimeout(null);
      }
      if (enablePersistence && storage) {
        try {
          storage.setItem(storageKey, JSON.stringify(state));
          onStateSaved?.(state);
        } catch (error) {
          console.warn(`Failed to save table state to storage:`, error);
        }
      }
    },
    loadState,
    clearState,
  };
}

/**
 * Hook for managing table state with react-table integration
 * 
 * @param storageKey - Unique key for localStorage storage
 * @param defaultState - Default state values
 * @returns React-table compatible state handlers
 * 
 * @example
 * ```tsx
 * const tableState = useReactTableState('users-table', {
 *   columnVisibility: { name: true, email: true },
 *   pagination: { pageIndex: 0, pageSize: 25 }
 * });
 * 
 * const table = useReactTable({
 *   data,
 *   columns,
 *   ...tableState.getTableProps(),
 * });
 * ```
 */
export function useReactTableState(
  storageKey: string,
  defaultState: Partial<TableState> = {}
) {
  const {
    state,
    updateState,
    resetState,
    clearState
  } = useTableState({
    storageKey,
    defaultState
  });

  return {
    state,
    updateState,
    resetState,
    clearState,
    getTableProps: () => ({
      state: {
        columnVisibility: state.columnVisibility || {},
        columnOrder: state.columnOrder || [],
        columnSizing: state.columnSizing || {},
        sorting: state.sorting || [],
        pagination: state.pagination || { pageIndex: 0, pageSize: 10 },
        globalFilter: state.globalFilter || "",
        columnFilters: state.columnFilters || [],
        rowSelection: state.rowSelection || {},
      },
      onColumnVisibilityChange: (updater: any) => {
        const newValue = typeof updater === 'function' 
          ? updater(state.columnVisibility || {})
          : updater;
        updateState('columnVisibility', newValue);
      },
      onColumnOrderChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.columnOrder || [])
          : updater;
        updateState('columnOrder', newValue);
      },
      onColumnSizingChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.columnSizing || {})
          : updater;
        updateState('columnSizing', newValue);
      },
      onSortingChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.sorting || [])
          : updater;
        updateState('sorting', newValue);
      },
      onPaginationChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.pagination || { pageIndex: 0, pageSize: 10 })
          : updater;
        updateState('pagination', newValue);
      },
      onGlobalFilterChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.globalFilter || "")
          : updater;
        updateState('globalFilter', newValue);
      },
      onColumnFiltersChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.columnFilters || [])
          : updater;
        updateState('columnFilters', newValue);
      },
      onRowSelectionChange: (updater: any) => {
        const newValue = typeof updater === 'function'
          ? updater(state.rowSelection || {})
          : updater;
        updateState('rowSelection', newValue);
      },
    })
  };
}