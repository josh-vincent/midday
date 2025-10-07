import { BaseStorageAdapter } from "../../src/storage/base";
import type { ConnectionRecord } from "../../src/core/types";

/**
 * Mock storage adapter for testing
 * Stores data in memory
 */
export class MockStorageAdapter extends BaseStorageAdapter {
  private connections: Map<string, ConnectionRecord> = new Map();
  private locks: Map<string, number> = new Map(); // connectionId -> expiresAt timestamp

  constructor(initialConnections: ConnectionRecord[] = []) {
    super();
    for (const connection of initialConnections) {
      this.connections.set(connection.id, connection);
    }
  }

  async getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]> {
    const threshold = this.calculateThreshold(thresholdMinutes);
    const results: ConnectionRecord[] = [];

    for (const connection of this.connections.values()) {
      if (connection.expiresAt) {
        const expiresAt = new Date(connection.expiresAt);
        if (expiresAt <= threshold) {
          results.push(connection);
        }
      }
    }

    return results.sort((a, b) => {
      if (!a.expiresAt || !b.expiresAt) return 0;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });
  }

  async getConnection(connectionId: string): Promise<ConnectionRecord | null> {
    return this.connections.get(connectionId) || null;
  }

  async getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]> {
    const results: ConnectionRecord[] = [];

    for (const connection of this.connections.values()) {
      if (connection.teamId === teamId) {
        results.push(connection);
      }
    }

    return results;
  }

  async updateTokens(
    connectionId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      expiresAt: string;
    }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    connection.credentials = {
      ...connection.credentials,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      connectedAt: new Date().toISOString(),
    };
    connection.expiresAt = tokens.expiresAt;
    connection.updatedAt = new Date().toISOString();

    this.connections.set(connectionId, connection);
  }

  async acquireLock(connectionId: string, ttlMs: number): Promise<boolean> {
    const lockKey = this.getLockKey(connectionId);
    const existingLock = this.locks.get(lockKey);

    // Check if lock exists and is not expired
    if (existingLock && existingLock > Date.now()) {
      return false; // Lock already held
    }

    // Acquire lock
    this.locks.set(lockKey, Date.now() + ttlMs);
    return true;
  }

  async releaseLock(connectionId: string): Promise<void> {
    const lockKey = this.getLockKey(connectionId);
    this.locks.delete(lockKey);
  }

  // Helper methods for testing
  addConnection(connection: ConnectionRecord): void {
    this.connections.set(connection.id, connection);
  }

  clearConnections(): void {
    this.connections.clear();
    this.locks.clear();
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  isLocked(connectionId: string): boolean {
    const lockKey = this.getLockKey(connectionId);
    const lockExpiry = this.locks.get(lockKey);
    return lockExpiry ? lockExpiry > Date.now() : false;
  }
}
