import { BaseStorageAdapter } from "./base";
import type { ConnectionRecord } from "../core/types";
import postgres from "postgres";

export interface PostgresStorageConfig {
  connectionString: string;
  tableName?: string;
}

/**
 * PostgreSQL storage adapter using postgres.js
 * Works with any PostgreSQL database
 */
export class PostgresStorageAdapter extends BaseStorageAdapter {
  private sql: ReturnType<typeof postgres>;
  private tableName: string;

  constructor(config: PostgresStorageConfig) {
    super();

    if (!config.connectionString) {
      throw new Error("PostgreSQL connection string is required");
    }

    this.sql = postgres(config.connectionString);
    this.tableName = config.tableName || "oauth_connections";
  }

  /**
   * Get connections expiring within threshold
   */
  async getExpiringConnections(
    thresholdMinutes: number
  ): Promise<ConnectionRecord[]> {
    const threshold = this.calculateThreshold(thresholdMinutes);

    const results = await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE expires_at <= ${threshold.toISOString()}
      ORDER BY expires_at ASC
    `;

    return this.mapToConnectionRecords(results);
  }

  /**
   * Get a specific connection by ID
   */
  async getConnection(connectionId: string): Promise<ConnectionRecord | null> {
    const results = await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE id = ${connectionId}
      LIMIT 1
    `;

    if (results.length === 0) {
      return null;
    }

    return this.mapToConnectionRecord(results[0]);
  }

  /**
   * Get all connections for a team
   */
  async getConnectionsByTeam(teamId: string): Promise<ConnectionRecord[]> {
    const results = await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE team_id = ${teamId}
    `;

    return this.mapToConnectionRecords(results);
  }

  async getConnectionsByUserId(userId: string): Promise<ConnectionRecord[]> {
    const results = await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE user_id = ${userId}
    `;

    return this.mapToConnectionRecords(results);
  }

  async getConnectionsByOrgId(orgId: string): Promise<ConnectionRecord[]> {
    const results = await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE org_id = ${orgId}
    `;

    return this.mapToConnectionRecords(results);
  }

  async saveConnection(connection: ConnectionRecord): Promise<void> {
    await this.sql`
      INSERT INTO ${this.sql(this.tableName)} (
        id, team_id, user_id, org_id, provider, credentials,
        expires_at, realm_id, tenant_id, metadata, created_at, updated_at
      )
      VALUES (
        ${connection.id},
        ${connection.teamId},
        ${connection.userId},
        ${connection.orgId || null},
        ${connection.provider},
        ${this.sql.json(connection.credentials)},
        ${connection.expiresAt || null},
        ${connection.realmId || null},
        ${connection.tenantId || null},
        ${this.sql.json(connection.metadata || {})},
        ${connection.createdAt},
        ${connection.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        team_id = EXCLUDED.team_id,
        user_id = EXCLUDED.user_id,
        org_id = EXCLUDED.org_id,
        provider = EXCLUDED.provider,
        credentials = EXCLUDED.credentials,
        expires_at = EXCLUDED.expires_at,
        realm_id = EXCLUDED.realm_id,
        tenant_id = EXCLUDED.tenant_id,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.sql`
      DELETE FROM ${this.sql(this.tableName)}
      WHERE id = ${connectionId}
    `;
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
    const credentials = {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      connected_at: new Date().toISOString(),
    };

    await this.sql`
      UPDATE ${this.sql(this.tableName)}
      SET
        credentials = ${this.sql.json(credentials)},
        expires_at = ${tokens.expiresAt},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${connectionId}
    `;
  }

  /**
   * Acquire a distributed lock using database
   * Uses oauth_locks table
   */
  async acquireLock(connectionId: string, ttlMs: number): Promise<boolean> {
    const lockKey = this.getLockKey(connectionId);
    const expiresAt = new Date(Date.now() + ttlMs);

    try {
      // Try to insert a lock record
      await this.sql`
        INSERT INTO oauth_locks (lock_key, connection_id, expires_at, created_at)
        VALUES (
          ${lockKey},
          ${connectionId},
          ${expiresAt.toISOString()},
          ${new Date().toISOString()}
        )
      `;

      return true;
    } catch (error: any) {
      // If duplicate key error, lock already exists
      if (error.code === "23505" || error.message?.includes("unique")) {
        // Check if existing lock is expired
        const existingLocks = await this.sql`
          SELECT * FROM oauth_locks
          WHERE lock_key = ${lockKey}
          LIMIT 1
        `;

        if (existingLocks.length > 0) {
          const expiresAt = existingLocks[0]?.expires_at;
          if (expiresAt) {
            const lockExpiry = new Date(expiresAt).getTime();
            if (lockExpiry < Date.now()) {
              // Lock is expired, delete it and try again
              await this.releaseLock(connectionId);
              return this.acquireLock(connectionId, ttlMs);
            }
          }
        }

        return false;
      }

      throw error;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(connectionId: string): Promise<void> {
    const lockKey = this.getLockKey(connectionId);

    await this.sql`
      DELETE FROM oauth_locks
      WHERE lock_key = ${lockKey}
    `;
  }

  /**
   * Map database record to ConnectionRecord
   * Converts snake_case to camelCase
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
