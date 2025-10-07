/**
 * Data Sync System
 *
 * Provides multiple strategies for syncing OAuth provider data:
 * 1. Webhooks (default, secure)
 * 2. Direct DB sync (optional, convenient)
 * 3. Custom transforms (flexible)
 */

import type { OAuthProvider, ConnectionRecord } from "@midday/oauth-sync-core";
import { retryWithBackoff } from "@midday/oauth-sync-core";

// ============================================================================
// Types
// ============================================================================

export type SyncStrategy = 'upsert' | 'replace' | 'append' | 'incremental';
export type DatabaseType = 'postgres' | 'mysql' | 'supabase' | 'mongodb';

export interface DatabaseConfig {
  type: DatabaseType;
  connectionString: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface EntityMapping {
  [providerField: string]: string; // Maps provider field to DB column
}

export interface EntityConfig {
  provider: OAuthProvider;
  endpoint: string;
  table: string;
  mapping: EntityMapping;
  strategy: SyncStrategy;
  primaryKey?: string; // Default: 'id'
  incrementalField?: string; // For incremental sync (e.g., 'updated_at')
  batchSize?: number; // Default: 100
}

export interface SyncConfig {
  database?: DatabaseConfig;
  entities: Record<string, EntityConfig>;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  retries?: number;
  timeout?: number;
}

export interface TransformContext {
  provider: OAuthProvider;
  entity: string;
  connection: ConnectionRecord;
  db?: any; // User's DB client
}

export type TransformFunction = (
  rawData: any,
  context: TransformContext
) => Promise<any[]> | any[];

export interface DataSyncEvent {
  provider: OAuthProvider;
  entity: string;
  connectionId: string;
  data: any[];
  count: number;
  syncedAt: string;
  strategy: SyncStrategy;
}

// ============================================================================
// Database Adapters
// ============================================================================

interface IDatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  upsert(table: string, data: any[], primaryKey: string): Promise<number>;
  replace(table: string, data: any[]): Promise<number>;
  append(table: string, data: any[]): Promise<number>;
  incremental(table: string, data: any[], incrementalField: string): Promise<number>;
}

class PostgresAdapter implements IDatabaseAdapter {
  protected client: any;

  constructor(protected config: DatabaseConfig) {}

  async connect(): Promise<void> {
    // Import pg dynamically
    const { Pool } = await import('pg');
    this.client = new Pool({
      connectionString: this.config.connectionString,
      ssl: this.config.ssl,
      max: this.config.poolSize || 10,
    });
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async upsert(table: string, data: any[], primaryKey: string = 'id'): Promise<number> {
    if (data.length === 0) return 0;

    const columns = Object.keys(data[0]);
    const values = data.map(row =>
      `(${columns.map(col => this.escapeValue(row[col])).join(', ')})`
    ).join(', ');

    const updateSet = columns
      .filter(col => col !== primaryKey)
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${values}
      ON CONFLICT (${primaryKey})
      DO UPDATE SET ${updateSet}
    `;

    const result = await this.client.query(query);
    return result.rowCount;
  }

  async replace(table: string, data: any[]): Promise<number> {
    if (data.length === 0) return 0;

    // Delete all existing rows
    await this.client.query(`DELETE FROM ${table}`);

    // Insert new rows
    return this.append(table, data);
  }

  async append(table: string, data: any[]): Promise<number> {
    if (data.length === 0) return 0;

    const columns = Object.keys(data[0]);
    const values = data.map(row =>
      `(${columns.map(col => this.escapeValue(row[col])).join(', ')})`
    ).join(', ');

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${values}
    `;

    const result = await this.client.query(query);
    return result.rowCount;
  }

  async incremental(table: string, data: any[], incrementalField: string): Promise<number> {
    if (data.length === 0) return 0;

    // Get last sync timestamp
    const lastSyncResult = await this.client.query(
      `SELECT MAX(${incrementalField}) as last_sync FROM ${table}`
    );
    const lastSync = lastSyncResult.rows[0]?.last_sync;

    // Filter data to only new/updated records
    const newData = lastSync
      ? data.filter(row => new Date(row[incrementalField]) > new Date(lastSync))
      : data;

    // Upsert new data
    return this.upsert(table, newData);
  }

  private escapeValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return String(value);
  }
}

class SupabaseAdapter extends PostgresAdapter {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');

    const url = this.config.connectionString.split('@')[1]?.split(':')[0];
    const key = this.config.connectionString.split(':')[2];

    this.client = createClient(`https://${url}`, key);
  }

  async upsert(table: string, data: any[], primaryKey: string = 'id'): Promise<number> {
    const { error, count } = await this.client
      .from(table)
      .upsert(data, { onConflict: primaryKey });

    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    return count || data.length;
  }
}

// ============================================================================
// Data Sync Manager
// ============================================================================

export class DataSyncManager {
  private dbAdapter?: IDatabaseAdapter;
  private webhookConfig?: WebhookConfig;
  private transforms: Map<string, TransformFunction> = new Map();

  constructor(
    private syncConfig?: SyncConfig,
    webhookConfig?: WebhookConfig
  ) {
    this.webhookConfig = webhookConfig;
  }

  async initialize(): Promise<void> {
    if (this.syncConfig?.database) {
      this.dbAdapter = await this.createDatabaseAdapter(this.syncConfig.database);
      await this.dbAdapter.connect();
    }
  }

  async destroy(): Promise<void> {
    if (this.dbAdapter) {
      await this.dbAdapter.disconnect();
    }
  }

  /**
   * Register custom transform function
   */
  registerTransform(entity: string, transform: TransformFunction): void {
    this.transforms.set(entity, transform);
  }

  /**
   * Sync data for an entity
   */
  async syncEntity(
    entity: string,
    rawData: any,
    connection: ConnectionRecord
  ): Promise<DataSyncEvent> {
    const entityConfig = this.syncConfig?.entities[entity];
    if (!entityConfig) {
      throw new Error(`Entity ${entity} not configured for sync`);
    }

    // 1. Transform data
    const transformFn = this.transforms.get(entity);
    let transformedData: any[];

    if (transformFn) {
      // Custom transform
      const context: TransformContext = {
        provider: connection.provider,
        entity,
        connection,
        db: this.dbAdapter,
      };
      transformedData = await transformFn(rawData, context);
    } else {
      // Default transform using mapping
      transformedData = this.applyMapping(rawData, entityConfig.mapping);
    }

    // 2. Sync to database (if configured)
    let recordsProcessed = 0;
    if (this.dbAdapter && entityConfig.table) {
      recordsProcessed = await this.syncToDatabase(
        entityConfig.table,
        transformedData,
        entityConfig.strategy,
        entityConfig.primaryKey,
        entityConfig.incrementalField
      );
    }

    // 3. Send webhook (if configured)
    if (this.webhookConfig) {
      await this.sendWebhook({
        provider: connection.provider,
        entity,
        connectionId: connection.id,
        data: transformedData,
        count: transformedData.length,
        syncedAt: new Date().toISOString(),
        strategy: entityConfig.strategy,
      });
    }

    return {
      provider: connection.provider,
      entity,
      connectionId: connection.id,
      data: transformedData,
      count: recordsProcessed || transformedData.length,
      syncedAt: new Date().toISOString(),
      strategy: entityConfig.strategy,
    };
  }

  /**
   * Apply field mapping
   */
  private applyMapping(rawData: any, mapping: EntityMapping): any[] {
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.mapObject(item, mapping));
    } else if (rawData && typeof rawData === 'object') {
      // Check for common response wrappers
      for (const key of Object.keys(rawData)) {
        if (Array.isArray(rawData[key])) {
          return rawData[key].map((item: any) => this.mapObject(item, mapping));
        }
      }
    }

    return [];
  }

  private mapObject(obj: any, mapping: EntityMapping): any {
    const mapped: any = {};

    for (const [providerField, dbField] of Object.entries(mapping)) {
      // Support nested fields with dot notation
      const value = this.getNestedValue(obj, providerField);
      mapped[dbField] = value;
    }

    return mapped;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Sync data to database
   */
  private async syncToDatabase(
    table: string,
    data: any[],
    strategy: SyncStrategy,
    primaryKey?: string,
    incrementalField?: string
  ): Promise<number> {
    if (!this.dbAdapter) {
      throw new Error('Database adapter not initialized');
    }

    switch (strategy) {
      case 'upsert':
        return this.dbAdapter.upsert(table, data, primaryKey || 'id');
      case 'replace':
        return this.dbAdapter.replace(table, data);
      case 'append':
        return this.dbAdapter.append(table, data);
      case 'incremental':
        if (!incrementalField) {
          throw new Error('incrementalField required for incremental sync');
        }
        return this.dbAdapter.incremental(table, data, incrementalField);
      default:
        throw new Error(`Unknown sync strategy: ${strategy}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(event: DataSyncEvent): Promise<void> {
    if (!this.webhookConfig) return;

    await retryWithBackoff(
      async () => {
        const response = await fetch(this.webhookConfig!.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.webhookConfig!.secret && {
              'X-Webhook-Secret': this.webhookConfig!.secret,
            }),
          },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(this.webhookConfig!.timeout || 30000),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.statusText}`);
        }
      },
      {
        maxRetries: this.webhookConfig.retries || 3,
        initialDelay: 1000,
        maxDelay: 10000,
      }
    );
  }

  private async createDatabaseAdapter(config: DatabaseConfig): Promise<IDatabaseAdapter> {
    switch (config.type) {
      case 'postgres':
        return new PostgresAdapter(config);
      case 'supabase':
        return new SupabaseAdapter(config);
      case 'mysql':
        throw new Error('MySQL adapter not yet implemented');
      case 'mongodb':
        throw new Error('MongoDB adapter not yet implemented');
      default:
        throw new Error(`Unknown database type: ${config.type}`);
    }
  }
}
