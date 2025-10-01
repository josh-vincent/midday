import { useCallback, useEffect, useReducer } from "react";
import { toast } from "@midday/ui/use-toast";
import type {
  BaseEntity,
  DataProvider,
  CRUDState,
  CRUDOperation,
  OptimisticUpdateConfig,
  UndoAction,
  ListParams,
} from "../types";

interface UseCRUDConfig<T extends BaseEntity> {
  dataProvider: DataProvider<T>;
  optimisticUpdates?: OptimisticUpdateConfig<T>;
  enableUndo?: boolean;
  maxUndoStack?: number;
  onError?: (error: Error, operation: CRUDOperation) => void;
  onSuccess?: (data: T | T[], operation: CRUDOperation) => void;
}

type CRUDAction<T extends BaseEntity> =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "SET_DATA"; payload: T[] }
  | { type: "ADD_ITEM"; payload: T }
  | { type: "UPDATE_ITEM"; payload: T }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "SET_SELECTED"; payload: string[] }
  | { type: "ADD_SELECTED"; payload: string }
  | { type: "REMOVE_SELECTED"; payload: string }
  | { type: "TOGGLE_SELECTED"; payload: string }
  | { type: "CLEAR_SELECTED" }
  | { type: "SET_LAST_OPERATION"; payload: CRUDOperation | null }
  | { type: "ADD_UNDO"; payload: UndoAction<T> }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_UNDO" }
  | { type: "OPTIMISTIC_UPDATE"; payload: { id: string; data: Partial<T> } }
  | { type: "ROLLBACK_OPTIMISTIC"; payload: { id: string; originalData: T } };

function crudReducer<T extends BaseEntity>(
  state: CRUDState<T>,
  action: CRUDAction<T>
): CRUDState<T> {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_DATA":
      return { ...state, data: action.payload, isLoading: false, error: null };

    case "ADD_ITEM":
      return {
        ...state,
        data: [...state.data, action.payload],
        isLoading: false,
        error: null,
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        data: state.data.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
        isLoading: false,
        error: null,
      };

    case "REMOVE_ITEM":
      return {
        ...state,
        data: state.data.filter((item) => item.id !== action.payload),
        selectedIds: state.selectedIds.filter((id) => id !== action.payload),
        isLoading: false,
        error: null,
      };

    case "SET_SELECTED":
      return { ...state, selectedIds: action.payload };

    case "ADD_SELECTED":
      return {
        ...state,
        selectedIds: [...state.selectedIds, action.payload],
      };

    case "REMOVE_SELECTED":
      return {
        ...state,
        selectedIds: state.selectedIds.filter((id) => id !== action.payload),
      };

    case "TOGGLE_SELECTED":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.payload)
          ? state.selectedIds.filter((id) => id !== action.payload)
          : [...state.selectedIds, action.payload],
      };

    case "CLEAR_SELECTED":
      return { ...state, selectedIds: [] };

    case "SET_LAST_OPERATION":
      return { ...state, lastOperation: action.payload };

    case "ADD_UNDO":
      return {
        ...state,
        undoStack: [...state.undoStack, action.payload].slice(-10), // Keep last 10
        redoStack: [], // Clear redo stack on new action
      };

    case "UNDO":
      if (state.undoStack.length === 0) return state;
      const lastAction = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, lastAction],
      };

    case "REDO":
      if (state.redoStack.length === 0) return state;
      const redoAction = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, redoAction],
      };

    case "CLEAR_UNDO":
      return { ...state, undoStack: [], redoStack: [] };

    case "OPTIMISTIC_UPDATE":
      return {
        ...state,
        data: state.data.map((item) =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.data }
            : item
        ),
      };

    case "ROLLBACK_OPTIMISTIC":
      return {
        ...state,
        data: state.data.map((item) =>
          item.id === action.payload.id ? action.payload.originalData : item
        ),
      };

    default:
      return state;
  }
}

/**
 * Main CRUD hook for managing entity operations
 * 
 * @param config Configuration object for the CRUD operations
 * @returns Object with CRUD methods and state
 * 
 * @example
 * ```tsx
 * const customerCRUD = useCRUD({
 *   dataProvider: customerAPI,
 *   optimisticUpdates: { enabled: true },
 *   enableUndo: true,
 * });
 * 
 * // Create a new customer
 * await customerCRUD.create({ name: "John Doe", email: "john@example.com" });
 * 
 * // Update optimistically
 * await customerCRUD.update("123", { name: "Jane Doe" });
 * 
 * // Delete with confirmation
 * await customerCRUD.delete("123");
 * ```
 */
export function useCRUD<T extends BaseEntity>(config: UseCRUDConfig<T>) {
  const {
    dataProvider,
    optimisticUpdates = { enabled: false },
    enableUndo = false,
    maxUndoStack = 10,
    onError,
    onSuccess,
  } = config;

  const [state, dispatch] = useReducer(crudReducer<T>, {
    data: [],
    selectedIds: [],
    isLoading: false,
    error: null,
    lastOperation: null,
    undoStack: [],
    redoStack: [],
  });

  /**
   * Fetch list of entities
   */
  const fetchList = useCallback(
    async (params?: ListParams) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const response = await dataProvider.list(params);
        dispatch({ type: "SET_DATA", payload: response.data });
        dispatch({ type: "SET_LAST_OPERATION", payload: "read" });
        return response;
      } catch (error) {
        const err = error as Error;
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "read");
        toast({
          variant: "destructive",
          title: "Failed to fetch data",
          description: err.message,
        });
        throw error;
      }
    },
    [dataProvider, onError]
  );

  /**
   * Create a new entity
   */
  const create = useCallback(
    async (data: Omit<T, "id" | "createdAt" | "updatedAt">) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const newItem = await dataProvider.create(data);
        dispatch({ type: "ADD_ITEM", payload: newItem });
        dispatch({ type: "SET_LAST_OPERATION", payload: "create" });

        if (enableUndo) {
          dispatch({
            type: "ADD_UNDO",
            payload: {
              type: "create",
              data: newItem,
              timestamp: new Date(),
              description: `Created item ${newItem.id}`,
            },
          });
        }

        onSuccess?.(newItem, "create");
        toast({
          variant: "success",
          title: "Success",
          description: "Item created successfully",
        });

        return newItem;
      } catch (error) {
        const err = error as Error;
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "create");
        toast({
          variant: "destructive",
          title: "Failed to create item",
          description: err.message,
        });
        throw error;
      }
    },
    [dataProvider, enableUndo, onSuccess, onError]
  );

  /**
   * Update an existing entity
   */
  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      const originalItem = state.data.find((item) => item.id === id);
      if (!originalItem) {
        throw new Error(`Item with id ${id} not found`);
      }

      // Optimistic update
      if (optimisticUpdates.enabled) {
        dispatch({ type: "OPTIMISTIC_UPDATE", payload: { id, data } });
      } else {
        dispatch({ type: "SET_LOADING", payload: true });
      }

      try {
        const updatedItem = await dataProvider.update(id, data);
        dispatch({ type: "UPDATE_ITEM", payload: updatedItem });
        dispatch({ type: "SET_LAST_OPERATION", payload: "update" });

        if (enableUndo) {
          dispatch({
            type: "ADD_UNDO",
            payload: {
              type: "update",
              data: originalItem,
              timestamp: new Date(),
              description: `Updated item ${id}`,
            },
          });
        }

        onSuccess?.(updatedItem, "update");
        optimisticUpdates.onSuccess?.(updatedItem);
        
        if (!optimisticUpdates.enabled) {
          toast({
            variant: "success",
            title: "Success",
            description: "Item updated successfully",
          });
        }

        return updatedItem;
      } catch (error) {
        const err = error as Error;
        
        // Rollback optimistic update
        if (optimisticUpdates.enabled) {
          dispatch({
            type: "ROLLBACK_OPTIMISTIC",
            payload: { id, originalData: originalItem },
          });
          optimisticUpdates.onRollback?.(err, originalItem);
        }

        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "update");
        optimisticUpdates.onError?.(err);
        
        toast({
          variant: "destructive",
          title: "Failed to update item",
          description: err.message,
        });
        throw error;
      }
    },
    [state.data, dataProvider, optimisticUpdates, enableUndo, onSuccess, onError]
  );

  /**
   * Delete an entity
   */
  const remove = useCallback(
    async (id: string) => {
      const itemToDelete = state.data.find((item) => item.id === id);
      if (!itemToDelete) {
        throw new Error(`Item with id ${id} not found`);
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await dataProvider.delete(id);
        dispatch({ type: "REMOVE_ITEM", payload: id });
        dispatch({ type: "SET_LAST_OPERATION", payload: "delete" });

        if (enableUndo) {
          dispatch({
            type: "ADD_UNDO",
            payload: {
              type: "delete",
              data: itemToDelete,
              timestamp: new Date(),
              description: `Deleted item ${id}`,
            },
          });
        }

        onSuccess?.(itemToDelete, "delete");
        toast({
          variant: "success",
          title: "Success",
          description: "Item deleted successfully",
        });
      } catch (error) {
        const err = error as Error;
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "delete");
        toast({
          variant: "destructive",
          title: "Failed to delete item",
          description: err.message,
        });
        throw error;
      }
    },
    [state.data, dataProvider, enableUndo, onSuccess, onError]
  );

  /**
   * Archive an entity (soft delete)
   */
  const archive = useCallback(
    async (id: string) => {
      if (!dataProvider.archive) {
        throw new Error("Archive operation not supported by data provider");
      }

      const originalItem = state.data.find((item) => item.id === id);
      if (!originalItem) {
        throw new Error(`Item with id ${id} not found`);
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const archivedItem = await dataProvider.archive(id);
        dispatch({ type: "UPDATE_ITEM", payload: archivedItem });
        dispatch({ type: "SET_LAST_OPERATION", payload: "archive" });

        if (enableUndo) {
          dispatch({
            type: "ADD_UNDO",
            payload: {
              type: "archive",
              data: originalItem,
              timestamp: new Date(),
              description: `Archived item ${id}`,
            },
          });
        }

        onSuccess?.(archivedItem, "archive");
        toast({
          variant: "success",
          title: "Success",
          description: "Item archived successfully",
        });

        return archivedItem;
      } catch (error) {
        const err = error as Error;
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "archive");
        toast({
          variant: "destructive",
          title: "Failed to archive item",
          description: err.message,
        });
        throw error;
      }
    },
    [state.data, dataProvider, enableUndo, onSuccess, onError]
  );

  /**
   * Duplicate an entity
   */
  const duplicate = useCallback(
    async (id: string, overrides?: Partial<T>) => {
      if (!dataProvider.duplicate) {
        throw new Error("Duplicate operation not supported by data provider");
      }

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const duplicatedItem = await dataProvider.duplicate(id, overrides);
        dispatch({ type: "ADD_ITEM", payload: duplicatedItem });
        dispatch({ type: "SET_LAST_OPERATION", payload: "duplicate" });

        if (enableUndo) {
          dispatch({
            type: "ADD_UNDO",
            payload: {
              type: "duplicate",
              data: duplicatedItem,
              timestamp: new Date(),
              description: `Duplicated item ${id}`,
            },
          });
        }

        onSuccess?.(duplicatedItem, "duplicate");
        toast({
          variant: "success",
          title: "Success",
          description: "Item duplicated successfully",
        });

        return duplicatedItem;
      } catch (error) {
        const err = error as Error;
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err, "duplicate");
        toast({
          variant: "destructive",
          title: "Failed to duplicate item",
          description: err.message,
        });
        throw error;
      }
    },
    [dataProvider, enableUndo, onSuccess, onError]
  );

  /**
   * Selection management
   */
  const selection = {
    select: (id: string) => dispatch({ type: "ADD_SELECTED", payload: id }),
    deselect: (id: string) => dispatch({ type: "REMOVE_SELECTED", payload: id }),
    toggle: (id: string) => dispatch({ type: "TOGGLE_SELECTED", payload: id }),
    selectAll: () => dispatch({ type: "SET_SELECTED", payload: state.data.map(item => item.id) }),
    deselectAll: () => dispatch({ type: "CLEAR_SELECTED" }),
    set: (ids: string[]) => dispatch({ type: "SET_SELECTED", payload: ids }),
  };

  /**
   * Undo/Redo functionality
   */
  const undo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    dispatch({ type: "UNDO" });
    toast({
      title: "Undone",
      description: "Last action was undone",
    });
  }, [state.undoStack.length]);

  const redo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    dispatch({ type: "REDO" });
    toast({
      title: "Redone",
      description: "Action was redone",
    });
  }, [state.redoStack.length]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  return {
    // State
    data: state.data,
    selectedIds: state.selectedIds,
    isLoading: state.isLoading,
    error: state.error,
    lastOperation: state.lastOperation,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,

    // CRUD operations
    fetchList,
    create,
    update,
    delete: remove,
    archive,
    duplicate,

    // Selection
    selection,

    // Undo/Redo
    undo,
    redo,

    // Utilities
    clearError,
  };
}