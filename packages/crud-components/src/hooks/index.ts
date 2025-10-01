// Main CRUD hook
export { useCRUD } from "./use-crud";
export type { UseCRUDConfig } from "./use-crud";

// Optimistic updates
export { 
  useOptimisticUpdate, 
  withOptimisticUpdates, 
  createOptimisticConfig 
} from "./use-optimistic-update";
export type { UseOptimisticUpdateConfig } from "./use-optimistic-update";

// Import functionality
export { useImport } from "./use-import";
export type { UseImportConfig } from "./use-import";

// Export functionality
export { useExport } from "./use-export";
export type { UseExportConfig, ExportColumn } from "./use-export";

// Bulk operations
export { useBulkOperations } from "./use-bulk-operations";
export type { UseBulkOperationsConfig } from "./use-bulk-operations";

// Re-export types from main types file for convenience
export type {
  BaseEntity,
  DataProvider,
  CRUDOperation,
  CRUDState,
  OptimisticUpdateConfig,
  ImportData,
  ImportResult,
  ExportParams,
  ExportResult,
  BulkOperation,
  BulkOperationResult,
  ProgressState,
} from "../types";