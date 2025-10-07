import { BaseStorageAdapter } from "./base";
import type { ConnectionRecord } from "../core/types";

/**
 * LocalStorage-based storage adapter for browser testing
 * WARNING: This is for development/testing only. Use database storage in production!
 *
 * Note: Since localStorage is browser-only, this adapter is meant for client-side testing.
 * For server-side testing, use the mock storage adapter instead.
 */
export class LocalStorageAdapter extends BaseStorageAdapter {
  private readonly storageKey = "oauth_connections";
  private readonly lockKey = "oauth_locks";

  /**
   * Get all connections from localStorage
   */
  private getAll(): ConnectionRecord[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  }

  /**
   * Save all connections to localStorage
   */
  private saveAll(connections: ConnectionRecord[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(connections));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }

  /**
   * Get all locks from localStorage
   */
  private getAllLocks(): Record<string, { expiresAt: number }> {
    if (typeof window === "undefined") return {};

    try {
      const stored = localStorage.getItem(this.lockKey);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error reading locks from localStorage:", error);
      return {};
    }
  }

  /**
   * Save all locks to localStorage
   */
  private saveAllLocks(locks: Record<string, { expiresAt: number }>): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.lockKey, JSON.stringify(locks));
    } catch (error) {
      console.error("Error writing locks to localStorage:", error);
    }
  }

  async getExpiringConnections(thresholdMinutes: number): Promise<ConnectionRecord[]> {
    const threshold = this.calculateThreshold(thresholdMinutes);
    const connections = this.getAll();

    return connections.filter((conn) => {
      if (!conn.expiresAt) return false;

      const expiresAt = new Date(conn.expiresAt);
      return expiresAt <= threshold;
    });
  }

  async getConnection(connectionId: string): Promise<ConnectionRecord | null> {
    const connections = this.getAll();
    return connections.find((c) => c.id === connectionId) || null;
  }

  async getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]> {
    const connections = this.getAll();
    return connections.filter((c) => c.teamId === teamId);
  }

  async getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]> {
    const connections = this.getAll();
    return connections.filter((c) => c.userId === userId);
  }

  async getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]> {
    const connections = this.getAll();
    return connections.filter((c) => c.orgId === orgId);
  }

  async saveConnection(connection: ConnectionRecord): Promise<void> {
    const connections = this.getAll();
    connections.push(connection);
    this.saveAll(connections);
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const connections = this.getAll();
    const filtered = connections.filter((c) => c.id !== connectionId);
    this.saveAll(filtered);
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
    const connections = this.getAll();
    const index = connections.findIndex((c) => c.id === connectionId);

    if (index === -1) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const existingConnection = connections[index];
    if (!existingConnection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    connections[index] = {
      ...existingConnection,
      credentials: {
        ...existingConnection.credentials,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        expiresAt: tokens.expiresAt,
        connectedAt: existingConnection.credentials.connectedAt,
      },
      expiresAt: tokens.expiresAt,
      updatedAt: new Date().toISOString(),
    };

    this.saveAll(connections);
  }

  async acquireLock(connectionId: string, ttlMs: number): Promise<boolean> {
    const locks = this.getAllLocks();
    const lockKey = this.getLockKey(connectionId);
    const now = Date.now();

    // Check if lock exists and is not expired
    if (locks[lockKey] && locks[lockKey].expiresAt > now) {
      return false; // Lock already held
    }

    // Acquire lock
    locks[lockKey] = {
      expiresAt: now + ttlMs,
    };

    this.saveAllLocks(locks);
    return true;
  }

  async releaseLock(connectionId: string): Promise<void> {
    const locks = this.getAllLocks();
    const lockKey = this.getLockKey(connectionId);

    delete locks[lockKey];
    this.saveAllLocks(locks);
  }


  /**
   * Clear all connections (helper for testing)
   */
  async clearAll(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.lockKey);
  }
}
