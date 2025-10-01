import { useCallback, useState } from "react";
import { toast } from "@midday/ui/use-toast";
import type {
  BaseEntity,
  BulkOperation,
  BulkOperationResult,
  BulkOperationError,
  ProgressState,
} from "../types";

interface UseBulkOperationsConfig<T extends BaseEntity> {
  onProgress?: (progress: ProgressState) => void;
  onComplete?: (result: BulkOperationResult<T>) => void;
  onError?: (error: Error) => void;
  defaultBatchSize?: number;
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Hook for handling bulk operations on multiple entities
 * 
 * @param config Configuration for bulk operations
 * @returns Methods and state for bulk operations
 * 
 * @example
 * ```tsx
 * const bulkOps = useBulkOperations<Customer>({
 *   defaultBatchSize: 50,
 *   onProgress: (progress) => {
 *     console.log(`Bulk operation progress: ${progress.current}/${progress.total}`);
 *   },
 * });
 * 
 * // Update multiple customers
 * const result = await bulkOps.bulkUpdate(
 *   customerIds,
 *   { status: "active" },
 *   async (ids, data) => await customerAPI.bulkUpdate(ids, data)
 * );
 * 
 * // Delete multiple customers
 * await bulkOps.bulkDelete(
 *   customerIds,
 *   async (ids) => await customerAPI.bulkDelete(ids)
 * );
 * ```
 */
export function useBulkOperations<T extends BaseEntity>(
  config: UseBulkOperationsConfig<T> = {}
) {
  const {
    onProgress,
    onComplete,
    onError,
    defaultBatchSize = 50,
    maxConcurrent = 3,
    retryAttempts = 2,
    retryDelay = 1000,
  } = config;

  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkOperationResult<T> | null>(null);

  /**
   * Execute a bulk operation with batching and progress tracking
   */
  const executeBulkOperation = useCallback(
    async <R>(
      operation: BulkOperation<T>,
      executor: (ids: string[], data?: Partial<T>) => Promise<R[]>,
      itemProcessor?: (item: R, originalId: string) => T
    ): Promise<BulkOperationResult<T>> => {
      const { ids, data, batchSize = defaultBatchSize, type } = operation;

      if (ids.length === 0) {
        throw new Error("No items selected for bulk operation");
      }

      setIsProcessing(true);
      setProgress({
        current: 0,
        total: ids.length,
        status: "running",
        message: `Processing ${type} operation...`,
        startTime: new Date(),
      });

      const successfulIds: string[] = [];
      const errors: BulkOperationError[] = [];
      const batches = createBatches(ids, batchSize);

      try {
        // Process batches with concurrency control
        const batchPromises = batches.map(async (batch, batchIndex) => {
          const batchResults = await processBatchWithRetry(
            batch,
            data,
            executor,
            batchIndex,
            batches.length
          );

          // Update progress
          const processed = (batchIndex + 1) * batchSize;
          const current = Math.min(processed, ids.length);
          setProgress(prev => ({ ...prev, current }));
          onProgress?.({
            current,
            total: ids.length,
            status: "running",
            message: `Processed batch ${batchIndex + 1} of ${batches.length}`,
          });

          return batchResults;
        });

        // Execute batches with concurrency limit
        const batchResults = await executeConcurrently(batchPromises, maxConcurrent);

        // Collect results
        batchResults.forEach((batchResult, batchIndex) => {
          const batch = batches[batchIndex];
          
          if (batchResult.success) {
            successfulIds.push(...batch);
          } else {
            batch.forEach(id => {
              errors.push({
                id,
                message: batchResult.error || "Unknown error occurred",
              });
            });
          }
        });

        const result: BulkOperationResult<T> = {
          success: successfulIds,
          errors,
          total: ids.length,
          processed: successfulIds.length + errors.length,
        };

        setResults(result);
        setProgress({
          current: ids.length,
          total: ids.length,
          status: "completed",
          message: `${type} operation completed`,
          endTime: new Date(),
        });

        onComplete?.(result);

        // Show appropriate toast
        if (errors.length === 0) {
          toast({
            variant: "success",
            title: "Bulk operation completed",
            description: `Successfully processed ${successfulIds.length} items`,
          });
        } else if (successfulIds.length > 0) {
          toast({
            variant: "warning",
            title: "Bulk operation completed with errors",
            description: `${successfulIds.length} successful, ${errors.length} failed`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Bulk operation failed",
            description: `All ${errors.length} items failed to process`,
          });
        }

        return result;
      } catch (error) {
        const err = error as Error;
        setProgress(prev => ({
          ...prev,
          status: "error",
          message: err.message,
          endTime: new Date(),
        }));
        onError?.(err);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [defaultBatchSize, maxConcurrent, onProgress, onComplete, onError]
  );

  /**
   * Bulk update operation
   */
  const bulkUpdate = useCallback(
    async (
      ids: string[],
      data: Partial<T>,
      updateFunction: (ids: string[], data: Partial<T>) => Promise<T[]>
    ): Promise<BulkOperationResult<T>> => {
      return executeBulkOperation(
        { type: "update", ids, data },
        updateFunction
      );
    },
    [executeBulkOperation]
  );

  /**
   * Bulk delete operation
   */
  const bulkDelete = useCallback(
    async (
      ids: string[],
      deleteFunction: (ids: string[]) => Promise<void>
    ): Promise<BulkOperationResult<T>> => {
      return executeBulkOperation(
        { type: "delete", ids },
        async (batchIds) => {
          await deleteFunction(batchIds);
          return batchIds.map(id => ({ id }) as any);
        }
      );
    },
    [executeBulkOperation]
  );

  /**
   * Bulk archive operation
   */
  const bulkArchive = useCallback(
    async (
      ids: string[],
      archiveFunction: (ids: string[]) => Promise<T[]>
    ): Promise<BulkOperationResult<T>> => {
      return executeBulkOperation(
        { type: "archive", ids },
        archiveFunction
      );
    },
    [executeBulkOperation]
  );

  /**
   * Bulk unarchive operation
   */
  const bulkUnarchive = useCallback(
    async (
      ids: string[],
      unarchiveFunction: (ids: string[]) => Promise<T[]>
    ): Promise<BulkOperationResult<T>> => {
      return executeBulkOperation(
        { type: "unarchive", ids },
        unarchiveFunction
      );
    },
    [executeBulkOperation]
  );

  /**
   * Create batches from array of IDs
   */
  const createBatches = (ids: string[], batchSize: number): string[][] => {
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }
    return batches;
  };

  /**
   * Process a single batch with retry logic
   */
  const processBatchWithRetry = async <R>(
    batch: string[],
    data: Partial<T> | undefined,
    executor: (ids: string[], data?: Partial<T>) => Promise<R[]>,
    batchIndex: number,
    totalBatches: number
  ): Promise<{ success: boolean; error?: string; data?: R[] }> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await executor(batch, data);
        return { success: true, data: result };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Unknown error occurred",
    };
  };

  /**
   * Execute promises with concurrency limit
   */
  const executeConcurrently = async <R>(
    promises: Promise<R>[],
    concurrencyLimit: number
  ): Promise<R[]> => {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < promises.length; i++) {
      const promise = promises[i].then(result => {
        results[i] = result;
      });

      executing.push(promise);

      if (executing.length >= concurrencyLimit || i === promises.length - 1) {
        await Promise.all(executing);
        executing.length = 0;
      }
    }

    return results;
  };

  /**
   * Cancel ongoing operation
   */
  const cancel = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      status: "cancelled",
      message: "Operation cancelled by user",
      endTime: new Date(),
    }));
    setIsProcessing(false);
  }, []);

  /**
   * Reset operation state
   */
  const reset = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      status: "idle",
    });
    setResults(null);
    setIsProcessing(false);
  }, []);

  /**
   * Get operation statistics
   */
  const getStats = useCallback(() => {
    if (!results) return null;

    const successRate = results.total > 0 ? (results.success.length / results.total) * 100 : 0;
    const errorRate = results.total > 0 ? (results.errors.length / results.total) * 100 : 0;
    
    const duration = progress.endTime && progress.startTime 
      ? progress.endTime.getTime() - progress.startTime.getTime()
      : 0;

    return {
      total: results.total,
      successful: results.success.length,
      failed: results.errors.length,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      duration,
      itemsPerSecond: duration > 0 ? (results.processed / duration) * 1000 : 0,
    };
  }, [results, progress]);

  /**
   * Retry failed operations
   */
  const retryFailedOperations = useCallback(
    async (
      executor: (ids: string[], data?: Partial<T>) => Promise<any[]>,
      data?: Partial<T>
    ) => {
      if (!results || results.errors.length === 0) {
        throw new Error("No failed operations to retry");
      }

      const failedIds = results.errors.map(error => error.id);
      return executeBulkOperation(
        { type: "update", ids: failedIds, data },
        executor
      );
    },
    [results, executeBulkOperation]
  );

  return {
    // Core operations
    bulkUpdate,
    bulkDelete,
    bulkArchive,
    bulkUnarchive,
    executeBulkOperation,

    // Utility methods
    cancel,
    reset,
    getStats,
    retryFailedOperations,

    // State
    progress,
    results,
    isProcessing,
    
    // Computed state
    canProcess: !isProcessing,
    hasResults: !!results,
    hasErrors: !!results && results.errors.length > 0,
  };
}