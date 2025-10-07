import { BaseStorageAdapter } from "./base";
import type { ConnectionRecord } from "../core/types";

export interface KVStorageConfig {
  kv: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
    del: (key: string) => Promise<void>;
    keys?: (pattern: string) => Promise<string[]>;
  };
  keyPrefix?: string;
}

/**
 * KV storage adapter for OAuth connections
 * Works with Redis, Upstash, Cloudflare KV, etc.
 * NOTE: KV stores are best for caching and locks, not primary data storage
 * This adapter should be used alongside a primary database adapter
 */
export class KVStorageAdapter extends BaseStorageAdapter {
  private kv: KVStorageConfig["kv"];
  private keyPrefix: string;

  constructor(config: KVStorageConfig) {
    super();

    if (!config.kv) {
      throw new Error("KV instance is required");
    }

    this.kv = config.kv;
    this.keyPrefix = config.keyPrefix || "oauth:";
  }

  /**
   * Get connections expiring within threshold
   * NOTE: This requires scanning all connection keys
   * For production, use a database adapter for querying
   */
  async getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]> {
    if (!this.kv.keys) {
      throw new Error("KV store does not support key scanning");
    }

    const threshold = this.calculateThreshold(thresholdMinutes);
    const keys = await this.kv.keys(`${this.keyPrefix}connection:*`);
    const connections: ConnectionRecord[] = [];

    for (const key of keys) {
      const data = await this.kv.get(key);
      if (data) {
        const connection = JSON.parse(data) as ConnectionRecord;
        if (
          connection.expiresAt &&
          new Date(connection.expiresAt) <= threshold
        ) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<ConnectionRecord | null> {
    const key = this.getConnectionKey(connectionId);
    const data = await this.kv.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as ConnectionRecord;
  }

  /**
   * Get all connections for a team
   * NOTE: This requires scanning all connection keys
   * For production, use a database adapter for querying
   */
  async getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]> {
    if (!this.kv.keys) {
      throw new Error("KV store does not support key scanning");
    }

    const keys = await this.kv.keys(`${this.keyPrefix}connection:*`);
    const connections: ConnectionRecord[] = [];

    for (const key of keys) {
      const data = await this.kv.get(key);
      if (data) {
        const connection = JSON.parse(data) as ConnectionRecord;
        if (connection.teamId === teamId) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  async getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]> {
    if (!this.kv.keys) {
      throw new Error("KV store does not support key scanning");
    }

    const keys = await this.kv.keys(`${this.keyPrefix}connection:*`);
    const connections: ConnectionRecord[] = [];

    for (const key of keys) {
      const data = await this.kv.get(key);
      if (data) {
        const connection = JSON.parse(data) as ConnectionRecord;
        if (connection.userId === userId) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  async getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]> {
    if (!this.kv.keys) {
      throw new Error("KV store does not support key scanning");
    }

    const keys = await this.kv.keys(`${this.keyPrefix}connection:*`);
    const connections: ConnectionRecord[] = [];

    for (const key of keys) {
      const data = await this.kv.get(key);
      if (data) {
        const connection = JSON.parse(data) as ConnectionRecord;
        if (connection.orgId === orgId) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  async saveConnection(connection: ConnectionRecord): Promise<void> {
    const key = this.getConnectionKey(connection.id);
    await this.kv.set(key, JSON.stringify(connection));
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const key = this.getConnectionKey(connectionId);
    await this.kv.del(key);
  }

  /**
   * Update connection with new tokens
   */
  async updateTokens(
    connectionId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      expiresAt: string;
    }
  ): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Update credentials
    connection.credentials = {
      ...connection.credentials,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      connectedAt: new Date().toISOString(),
    };
    connection.expiresAt = tokens.expiresAt;
    connection.updatedAt = new Date().toISOString();

    // Save back to KV
    const key = this.getConnectionKey(connectionId);
    await this.kv.set(key, JSON.stringify(connection));
  }

  /**
   * Acquire a distributed lock using KV store
   * Uses SET NX (set if not exists) with expiry
   */
  async acquireLock(connectionId: string, ttlMs: number): Promise<boolean> {
    const lockKey = this.getLockKey(connectionId);
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    try {
      // Try to set the lock with expiry
      // Most KV stores support atomic set-if-not-exists
      await this.kv.set(lockKey, "1", { ex: ttlSeconds });
      return true;
    } catch (error) {
      // Lock already exists
      return false;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(connectionId: string): Promise<void> {
    const lockKey = this.getLockKey(connectionId);
    await this.kv.del(lockKey);
  }

  /**
   * Helper to generate connection key
   */
  private getConnectionKey(connectionId: string): string {
    return `${this.keyPrefix}connection:${connectionId}`;
  }
}
