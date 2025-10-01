import { useCallback, useRef, useState } from "react";
import { toast } from "@midday/ui/use-toast";
import type { BaseEntity, OptimisticUpdateConfig } from "../types";

interface OptimisticUpdate<T> {
  id: string;
  originalData: T;
  optimisticData: T;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

interface UseOptimisticUpdateConfig<T extends BaseEntity> {
  rollbackDelay?: number;
  maxPendingUpdates?: number;
  onRollback?: (error: Error, originalData: T) => void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing optimistic updates with automatic rollback
 * 
 * @param config Configuration for optimistic updates
 * @returns Methods and state for optimistic updates
 * 
 * @example
 * ```tsx
 * const optimistic = useOptimisticUpdate<Customer>({
 *   rollbackDelay: 5000,
 *   onRollback: (error, original) => {
 *     toast({
 *       variant: "destructive",
 *       title: "Update failed",
 *       description: "Changes have been reverted",
 *     });
 *   },
 * });
 * 
 * // Apply optimistic update
 * const handleUpdate = async (customer: Customer) => {
 *   const updatedCustomer = { ...customer, name: "New Name" };
 *   
 *   optimistic.apply(customer.id, customer, updatedCustomer);
 *   
 *   try {
 *     const result = await updateCustomer(customer.id, { name: "New Name" });
 *     optimistic.confirm(customer.id, result);
 *   } catch (error) {
 *     optimistic.rollback(customer.id, error);
 *   }
 * };
 * ```
 */
export function useOptimisticUpdate<T extends BaseEntity>(
  config: UseOptimisticUpdateConfig<T> = {}
) {
  const {
    rollbackDelay = 5000,
    maxPendingUpdates = 10,
    onRollback,
    onSuccess,
    onError,
  } = config;

  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(
    new Map()
  );
  const updateQueueRef = useRef<OptimisticUpdate<T>[]>([]);

  /**
   * Apply an optimistic update
   */
  const apply = useCallback(
    (id: string, originalData: T, optimisticData: T) => {
      // Remove any existing update for this ID
      setPendingUpdates((prev) => {
        const existing = prev.get(id);
        if (existing?.timeoutId) {
          clearTimeout(existing.timeoutId);
        }

        const newMap = new Map(prev);
        
        // Enforce max pending updates limit
        if (newMap.size >= maxPendingUpdates) {
          // Remove oldest update
          const oldestId = Array.from(newMap.keys())[0];
          const oldestUpdate = newMap.get(oldestId);
          if (oldestUpdate?.timeoutId) {
            clearTimeout(oldestUpdate.timeoutId);
          }
          newMap.delete(oldestId);
        }

        const update: OptimisticUpdate<T> = {
          id,
          originalData,
          optimisticData,
          timestamp: Date.now(),
        };

        // Set up automatic rollback timeout
        if (rollbackDelay > 0) {
          update.timeoutId = setTimeout(() => {
            rollback(id, new Error("Optimistic update timeout"));
          }, rollbackDelay);
        }

        newMap.set(id, update);
        return newMap;
      });

      // Add to queue for tracking
      updateQueueRef.current.push({
        id,
        originalData,
        optimisticData,
        timestamp: Date.now(),
      });

      // Limit queue size
      if (updateQueueRef.current.length > 100) {
        updateQueueRef.current = updateQueueRef.current.slice(-50);
      }
    },
    [maxPendingUpdates, rollbackDelay]
  );

  /**
   * Confirm an optimistic update (success)
   */
  const confirm = useCallback(
    (id: string, finalData?: T) => {
      setPendingUpdates((prev) => {
        const update = prev.get(id);
        if (!update) return prev;

        // Clear timeout
        if (update.timeoutId) {
          clearTimeout(update.timeoutId);
        }

        // Call success callback
        onSuccess?.(finalData || update.optimisticData);

        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    },
    [onSuccess]
  );

  /**
   * Rollback an optimistic update (failure)
   */
  const rollback = useCallback(
    (id: string, error: Error) => {
      setPendingUpdates((prev) => {
        const update = prev.get(id);
        if (!update) return prev;

        // Clear timeout
        if (update.timeoutId) {
          clearTimeout(update.timeoutId);
        }

        // Call rollback callbacks
        onRollback?.(error, update.originalData);
        onError?.(error);

        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    },
    [onRollback, onError]
  );

  /**
   * Get the current state for an entity (optimistic or original)
   */
  const getCurrentData = useCallback(
    (id: string, originalData: T): T => {
      const update = pendingUpdates.get(id);
      return update ? update.optimisticData : originalData;
    },
    [pendingUpdates]
  );

  /**
   * Check if an entity has pending optimistic updates
   */
  const hasPendingUpdate = useCallback(
    (id: string): boolean => {
      return pendingUpdates.has(id);
    },
    [pendingUpdates]
  );

  /**
   * Get all pending updates
   */
  const getPendingUpdates = useCallback(() => {
    return Array.from(pendingUpdates.values());
  }, [pendingUpdates]);

  /**
   * Clear all pending updates
   */
  const clearAll = useCallback(() => {
    // Clear all timeouts
    pendingUpdates.forEach((update) => {
      if (update.timeoutId) {
        clearTimeout(update.timeoutId);
      }
    });

    setPendingUpdates(new Map());
    updateQueueRef.current = [];
  }, [pendingUpdates]);

  /**
   * Rollback all pending updates
   */
  const rollbackAll = useCallback(
    (error: Error) => {
      pendingUpdates.forEach((update) => {
        if (update.timeoutId) {
          clearTimeout(update.timeoutId);
        }
        onRollback?.(error, update.originalData);
      });

      setPendingUpdates(new Map());
      onError?.(error);
    },
    [pendingUpdates, onRollback, onError]
  );

  /**
   * Get statistics about optimistic updates
   */
  const getStats = useCallback(() => {
    const updates = Array.from(pendingUpdates.values());
    const now = Date.now();

    return {
      total: updates.length,
      oldest: updates.length > 0 ? Math.max(...updates.map(u => now - u.timestamp)) : 0,
      newest: updates.length > 0 ? Math.min(...updates.map(u => now - u.timestamp)) : 0,
      averageAge: updates.length > 0 
        ? updates.reduce((sum, u) => sum + (now - u.timestamp), 0) / updates.length 
        : 0,
    };
  }, [pendingUpdates]);

  return {
    // Core methods
    apply,
    confirm,
    rollback,

    // Utility methods
    getCurrentData,
    hasPendingUpdate,
    getPendingUpdates,
    clearAll,
    rollbackAll,
    getStats,

    // State
    pendingCount: pendingUpdates.size,
    isPending: pendingUpdates.size > 0,
  };
}

/**
 * Higher-order component for automatic optimistic updates
 */
export function withOptimisticUpdates<T extends BaseEntity>(
  Component: React.ComponentType<any>,
  config?: UseOptimisticUpdateConfig<T>
) {
  return function OptimisticWrapper(props: any) {
    const optimistic = useOptimisticUpdate<T>(config);
    return <Component {...props} optimistic={optimistic} />;
  };
}

/**
 * Utility function to create an optimistic update configuration
 */
export function createOptimisticConfig<T extends BaseEntity>(
  config: Partial<OptimisticUpdateConfig<T>>
): OptimisticUpdateConfig<T> {
  return {
    enabled: true,
    rollbackDelay: 5000,
    ...config,
  };
}