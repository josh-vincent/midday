import { BaseStorageAdapter } from "./base";
import type { ConnectionRecord } from "../core/types";
import { createClient } from "@supabase/supabase-js";

export interface SupabaseStorageConfig {
  url: string;
  key: string;
  tableName?: string;
}

/**
 * Supabase storage adapter for OAuth connections
 * Uses the accounting_connections table
 */
export class SupabaseStorageAdapter extends BaseStorageAdapter {
  private supabase: any;
  private tableName: string;

  constructor(config: SupabaseStorageConfig) {
    super();

    if (!config.url || !config.key) {
      throw new Error("Supabase URL and key are required");
    }

    this.supabase = createClient(config.url, config.key);
    this.tableName = config.tableName || "oauth_connections";
  }

  /**
   * Get connections expiring within threshold
   */
  async getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]> {
    const threshold = this.calculateThreshold(thresholdMinutes);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .lte("expires_at", threshold.toISOString())
      .order("expires_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expiring connections: ${error.message}`);
    }

    return this.mapToConnectionRecords(data || []);
  }

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<ConnectionRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", connectionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch connection: ${error.message}`);
    }

    return this.mapToConnectionRecord(data);
  }

  /**
   * Get all connections for a team
   */
  async getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("team_id", teamId);

    if (error) {
      throw new Error(`Failed to fetch team connections: ${error.message}`);
    }

    return this.mapToConnectionRecords(data || []);
  }

  async getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch user connections: ${error.message}`);
    }

    return this.mapToConnectionRecords(data || []);
  }

  async getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("org_id", orgId);

    if (error) {
      throw new Error(`Failed to fetch org connections: ${error.message}`);
    }

    return this.mapToConnectionRecords(data || []);
  }

  async saveConnection(connection: ConnectionRecord): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert({
        id: connection.id,
        team_id: connection.teamId,
        user_id: connection.userId,
        org_id: connection.orgId,
        provider: connection.provider,
        credentials: connection.credentials,
        expires_at: connection.expiresAt,
        realm_id: connection.realmId,
        tenant_id: connection.tenantId,
        metadata: connection.metadata,
        created_at: connection.createdAt,
        updated_at: connection.updatedAt,
      }, {
        onConflict: "id", // Update on id conflict
      });

    if (error) {
      throw new Error(`Failed to save connection: ${error.message}`);
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", connectionId);

    if (error) {
      throw new Error(`Failed to delete connection: ${error.message}`);
    }
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
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        credentials: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: tokens.expiresIn,
          connected_at: new Date().toISOString(),
        },
        expires_at: tokens.expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) {
      throw new Error(`Failed to update tokens: ${error.message}`);
    }
  }

  /**
   * Acquire a distributed lock using Supabase
   * Uses a separate locks table or KV store
   */
  async acquireLock(connectionId: string, ttlMs: number): Promise<boolean> {
    const lockKey = this.getLockKey(connectionId);
    const expiresAt = new Date(Date.now() + ttlMs);

    try {
      // Try to insert a lock record
      const { error } = await this.supabase.from("oauth_locks").insert({
        lock_key: lockKey,
        connection_id: connectionId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

      // If no error, we got the lock
      if (!error) {
        return true;
      }

      // If duplicate key error, lock already exists
      if (error.code === "23505") {
        // Check if existing lock is expired
        const { data: existingLock } = await this.supabase
          .from("oauth_locks")
          .select("*")
          .eq("lock_key", lockKey)
          .single();

        if (existingLock) {
          const lockExpiry = new Date(existingLock.expires_at).getTime();
          if (lockExpiry < Date.now()) {
            // Lock is expired, delete it and try again
            await this.releaseLock(connectionId);
            return this.acquireLock(connectionId, ttlMs);
          }
        }

        return false;
      }

      // Other error
      throw error;
    } catch (error) {
      console.error("Failed to acquire lock:", error);
      return false;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(connectionId: string): Promise<void> {
    const lockKey = this.getLockKey(connectionId);

    await this.supabase.from("oauth_locks").delete().eq("lock_key", lockKey);
  }

  /**
   * Map database record to ConnectionRecord
   */
  private mapToConnectionRecord(record: any): ConnectionRecord {
    return {
      id: record.id,
      teamId: record.team_id,
      userId: record.user_id,
      orgId: record.org_id,
      provider: record.provider,
      credentials: record.credentials,
      expiresAt: record.expires_at,
      realmId: record.realm_id,
      tenantId: record.tenant_id,
      metadata: record.metadata || {},
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * Map multiple database records
   */
  private mapToConnectionRecords(records: any[]): ConnectionRecord[] {
    return records.map((record) => this.mapToConnectionRecord(record));
  }
}
