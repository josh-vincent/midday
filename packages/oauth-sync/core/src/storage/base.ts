import type { ConnectionRecord, TokenRefreshResult } from "../core/types";

/**
 * Storage adapter interface for managing OAuth connections
 * Implementations can use any database (Supabase, Postgres, KV, etc.)
 */
export interface IStorageAdapter {
  /**
   * Get connections that are expiring soon
   * @param thresholdMinutes - How many minutes before expiry to consider
   * @returns List of connections needing refresh
   */
  getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]>;

  /**
   * Get a specific connection by ID
   * @param connectionId - Connection ID
   * @returns Connection record or null if not found
   */
  getConnection(connectionId: string): Promise<ConnectionRecord | null>;

  /**
   * Get all connections for a specific team
   * @param teamId - Team ID
   * @returns List of connections
   */
  getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]>;

  /**
   * Get all connections for a specific user
   * @param userId - User ID
   * @returns List of connections
   */
  getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]>;

  /**
   * Get all connections for a specific organization
   * @param orgId - Organization ID
   * @returns List of connections
   */
  getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]>;

  /**
   * Save a new connection
   * @param connection - Connection record to save
   */
  saveConnection(connection: ConnectionRecord): Promise<void>;

  /**
   * Delete a connection
   * @param connectionId - Connection ID
   */
  deleteConnection(connectionId: string): Promise<void>;

  /**
   * Update connection with new tokens
   * @param connectionId - Connection ID
   * @param tokens - New token configuration
   * @param expiresAt - New expiration timestamp
   */
  updateTokens(
    connectionId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      expiresAt: string;
    }
  ): Promise<void>;

  /**
   * Acquire a distributed lock for token refresh
   * Prevents concurrent refreshes of the same connection
   * @param connectionId - Connection ID
   * @param ttlMs - Lock time-to-live in milliseconds
   * @returns true if lock was acquired
   */
  acquireLock(connectionId: string, ttlMs: number): Promise<boolean>;

  /**
   * Release a distributed lock
   * @param connectionId - Connection ID
   */
  releaseLock(connectionId: string): Promise<void>;

  /**
   * Log token refresh result (optional, for monitoring)
   * @param result - Refresh result
   */
  logRefreshResult?(result: TokenRefreshResult): Promise<void>;
}

/**
 * Base abstract class for storage adapters
 * Provides common utilities
 */
export abstract class BaseStorageAdapter implements IStorageAdapter {
  abstract getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]>;

  abstract getConnection(connectionId: string): Promise<ConnectionRecord | null>;

  abstract getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]>;

  abstract getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]>;

  abstract getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]>;

  abstract saveConnection(connection: ConnectionRecord): Promise<void>;

  abstract deleteConnection(connectionId: string): Promise<void>;

  abstract updateTokens(
    connectionId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      expiresAt: string;
    }
  ): Promise<void>;

  abstract acquireLock(connectionId: string, ttlMs: number): Promise<boolean>;

  abstract releaseLock(connectionId: string): Promise<void>;

  /**
   * Helper to calculate threshold timestamp
   */
  protected calculateThreshold(thresholdMinutes: number): Date {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() + thresholdMinutes);
    return threshold;
  }

  /**
   * Helper to generate lock key
   */
  protected getLockKey(connectionId: string): string {
    return `oauth:lock:${connectionId}`;
  }
}
