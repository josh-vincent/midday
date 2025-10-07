import type {
  ProviderRecord,
  DatabaseRecord,
  SyncResult,
  TableConfig,
} from "../core/types";

/**
 * Base interface for sync strategies
 */
export interface ISyncStrategy {
  /**
   * Strategy name
   */
  readonly name: string;

  /**
   * Sync records using this strategy
   *
   * @param records - Records from provider
   * @param existingRecords - Existing records in database
   * @param config - Table configuration
   * @returns Records to insert/update/delete
   */
  plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan;

  /**
   * Validate strategy can be used with given configuration
   */
  validate(config: TableConfig): boolean;
}

/**
 * Sync plan - what operations to perform
 */
export interface SyncPlan {
  /**
   * Records to insert
   */
  toInsert: DatabaseRecord[];

  /**
   * Records to update
   */
  toUpdate: DatabaseRecord[];

  /**
   * Records to delete (IDs)
   */
  toDelete: string[];

  /**
   * Records to skip (conflicts, errors)
   */
  toSkip: ProviderRecord[];
}

/**
 * Base abstract class for sync strategies
 */
export abstract class BaseSyncStrategy implements ISyncStrategy {
  abstract readonly name: string;

  abstract plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan;

  validate(config: TableConfig): boolean {
    // Basic validation - can be overridden
    return true;
  }

  /**
   * Helper: Convert provider record to database record
   */
  protected toDatabaseRecord(
    record: ProviderRecord,
    teamId: string,
    connectionId: string,
    provider: string,
    entityType: string,
    config: TableConfig
  ): DatabaseRecord {
    // Apply field mapping if configured
    let data = record.data;
    if (config.mapping) {
      data = this.applyMapping(record.data, config.mapping);
    }

    return {
      externalId: record.externalId || record.id,
      teamId,
      connectionId,
      provider: provider as any,
      entityType: entityType as any,
      data,
      lastSyncedAt: new Date().toISOString(),
      createdAt: record.createdAt,
      updatedAt: record.modifiedAt,
    };
  }

  /**
   * Helper: Apply field mapping
   */
  protected applyMapping(
    data: Record<string, any>,
    mapping: Record<string, string>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};

    for (const [providerField, dbField] of Object.entries(mapping)) {
      if (data[providerField] !== undefined) {
        mapped[dbField] = data[providerField];
      }
    }

    // Keep unmapped fields
    for (const [key, value] of Object.entries(data)) {
      if (!mapping[key]) {
        mapped[key] = value;
      }
    }

    return mapped;
  }

  /**
   * Helper: Find existing record by external ID
   */
  protected findExisting(
    externalId: string,
    existingRecords: DatabaseRecord[]
  ): DatabaseRecord | null {
    return existingRecords.find((r) => r.externalId === externalId) || null;
  }

  /**
   * Helper: Check if record needs update
   */
  protected needsUpdate(
    providerRecord: ProviderRecord,
    dbRecord: DatabaseRecord
  ): boolean {
    // Update if provider record was modified after last sync
    if (providerRecord.modifiedAt && dbRecord.lastSyncedAt) {
      return (
        new Date(providerRecord.modifiedAt) > new Date(dbRecord.lastSyncedAt)
      );
    }

    // Default: always update
    return true;
  }
}
