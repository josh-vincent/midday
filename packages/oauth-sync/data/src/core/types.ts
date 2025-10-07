import { z } from "zod";
import type { OAuthProvider } from "@midday/oauth-sync-core";

/**
 * Entity types that can be synced
 */
export type SyncEntity =
  | "customers"
  | "invoices"
  | "payments"
  | "accounts"
  | "items"
  | "vendors"
  | "bills"
  | "tax_rates";

/**
 * Sync strategies
 */
export type SyncStrategy = "upsert" | "replace" | "append" | "incremental";

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy = "update" | "ignore" | "error";

/**
 * Sync configuration
 */
export interface SyncConfig {
  /**
   * OAuth provider
   */
  provider: OAuthProvider;

  /**
   * Connection ID for this provider
   */
  connectionId: string;

  /**
   * Team ID (for multi-tenant)
   */
  teamId: string;

  /**
   * Entities to sync
   */
  entities: SyncEntity[];

  /**
   * Sync strategy (default: upsert)
   */
  strategy?: SyncStrategy;

  /**
   * Database table configuration
   */
  tableConfig?: TableConfig;

  /**
   * Retry configuration
   */
  retryConfig?: RetryConfig;

  /**
   * Sync options
   */
  options?: SyncOptions;
}

/**
 * Table configuration for database sync
 */
export interface TableConfig {
  /**
   * Table name (default: entity name)
   */
  tableName?: string;

  /**
   * Column mapping (provider field → database column)
   */
  mapping?: Record<string, string>;

  /**
   * Conflict resolution (default: update)
   */
  onConflict?: ConflictStrategy;

  /**
   * Primary key column (default: id)
   */
  primaryKey?: string;

  /**
   * External ID column (default: external_id)
   */
  externalIdColumn?: string;

  /**
   * Additional metadata to store
   */
  metadata?: Record<string, any>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Max retry attempts (default: 3)
   */
  attempts?: number;

  /**
   * Initial delay in ms (default: 100)
   */
  initialDelay?: number;

  /**
   * Max delay in ms (default: 5000)
   */
  maxDelay?: number;

  /**
   * Use exponential backoff (default: true)
   */
  exponentialBackoff?: boolean;

  /**
   * Retry on specific error codes
   */
  retryOnCodes?: number[];
}

/**
 * Sync options
 */
export interface SyncOptions {
  /**
   * Only sync records modified after this date
   */
  modifiedSince?: Date;

  /**
   * Max records to fetch per request (default: 100)
   */
  batchSize?: number;

  /**
   * Sync token for incremental sync
   */
  syncToken?: string;

  /**
   * Dry run (don't actually write to database)
   */
  dryRun?: boolean;

  /**
   * Verbose logging
   */
  verbose?: boolean;
}

/**
 * Sync result for a single entity
 */
export interface SyncResult {
  /**
   * Entity type
   */
  entity: SyncEntity;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Records fetched from provider
   */
  fetched: number;

  /**
   * Records inserted
   */
  inserted: number;

  /**
   * Records updated
   */
  updated: number;

  /**
   * Records skipped (conflicts, errors)
   */
  skipped: number;

  /**
   * Records deleted (replace strategy)
   */
  deleted?: number;

  /**
   * New sync token (for incremental sync)
   */
  syncToken?: string;

  /**
   * Errors encountered
   */
  errors: SyncError[];

  /**
   * Duration in milliseconds
   */
  duration: number;

  /**
   * Timestamp
   */
  timestamp: string;
}

/**
 * Sync error details
 */
export interface SyncError {
  /**
   * Error message
   */
  message: string;

  /**
   * Error code (HTTP status, etc.)
   */
  code?: number | string;

  /**
   * Record ID that failed (if applicable)
   */
  recordId?: string;

  /**
   * Stack trace (for debugging)
   */
  stack?: string;

  /**
   * Retry attempt number
   */
  retryAttempt?: number;
}

/**
 * Generic record from provider
 */
export interface ProviderRecord {
  /**
   * Provider's ID for this record
   */
  id: string;

  /**
   * Provider's external ID (if different from id)
   */
  externalId?: string;

  /**
   * Record data
   */
  data: Record<string, any>;

  /**
   * Last modified timestamp
   */
  modifiedAt?: string;

  /**
   * Created timestamp
   */
  createdAt?: string;
}

/**
 * Database record
 */
export interface DatabaseRecord {
  /**
   * Internal database ID
   */
  id?: string;

  /**
   * External ID from provider
   */
  externalId: string;

  /**
   * Team ID (for multi-tenant)
   */
  teamId: string;

  /**
   * Connection ID
   */
  connectionId: string;

  /**
   * Provider name
   */
  provider: OAuthProvider;

  /**
   * Entity type
   */
  entityType: SyncEntity;

  /**
   * Record data (JSONB)
   */
  data: Record<string, any>;

  /**
   * Last synced timestamp
   */
  lastSyncedAt: string;

  /**
   * Created timestamp
   */
  createdAt?: string;

  /**
   * Updated timestamp
   */
  updatedAt?: string;
}

// Zod schemas for validation
export const syncConfigSchema = z.object({
  provider: z.enum(["quickbooks", "xero", "gmail", "outlook"]),
  connectionId: z.string(),
  teamId: z.string(),
  entities: z.array(
    z.enum([
      "customers",
      "invoices",
      "payments",
      "accounts",
      "items",
      "vendors",
      "bills",
      "tax_rates",
    ])
  ),
  strategy: z.enum(["upsert", "replace", "append", "incremental"]).optional(),
  tableConfig: z
    .object({
      tableName: z.string().optional(),
      mapping: z.record(z.string()).optional(),
      onConflict: z.enum(["update", "ignore", "error"]).optional(),
      primaryKey: z.string().optional(),
      externalIdColumn: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
  retryConfig: z
    .object({
      attempts: z.number().optional(),
      initialDelay: z.number().optional(),
      maxDelay: z.number().optional(),
      exponentialBackoff: z.boolean().optional(),
      retryOnCodes: z.array(z.number()).optional(),
    })
    .optional(),
  options: z
    .object({
      modifiedSince: z.date().optional(),
      batchSize: z.number().optional(),
      syncToken: z.string().optional(),
      dryRun: z.boolean().optional(),
      verbose: z.boolean().optional(),
    })
    .optional(),
});
