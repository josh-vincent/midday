import { BaseSyncStrategy, type SyncPlan } from "./base";
import type {
  ProviderRecord,
  DatabaseRecord,
  TableConfig,
} from "../core/types";

/**
 * Incremental strategy: Only sync changed records using sync tokens
 * Most efficient for large datasets
 *
 * Requires provider support for:
 * - Sync tokens (QuickBooks Change Data Capture)
 * - Modified since queries (Xero If-Modified-Since)
 */
export class IncrementalStrategy extends BaseSyncStrategy {
  readonly name = "incremental";

  plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan {
    const toInsert: DatabaseRecord[] = [];
    const toUpdate: DatabaseRecord[] = [];
    const toSkip: ProviderRecord[] = [];

    // Incremental sync: provider already filtered changed records
    // We just need to upsert them
    for (const record of records) {
      const externalId = record.externalId || record.id;
      const existing = this.findExisting(externalId, existingRecords);

      // Placeholder values - will be set by DataSyncManager
      const teamId = "";
      const connectionId = "";
      const provider = "";
      const entityType = "";

      const dbRecord = this.toDatabaseRecord(
        record,
        teamId,
        connectionId,
        provider,
        entityType,
        config
      );

      if (!existing) {
        // New record
        toInsert.push(dbRecord);
      } else {
        // Updated record
        toUpdate.push({
          ...dbRecord,
          id: existing.id,
        });
      }
    }

    return {
      toInsert,
      toUpdate,
      toDelete: [], // Deletions handled separately via webhooks
      toSkip,
    };
  }

  validate(config: TableConfig): boolean {
    // Incremental requires external ID column
    if (!config.externalIdColumn && !config.primaryKey) {
      return false;
    }
    return true;
  }

  /**
   * Override: Incremental sync assumes provider filtered by modifiedSince
   * So we don't need additional filtering
   */
  protected needsUpdate(
    providerRecord: ProviderRecord,
    dbRecord: DatabaseRecord
  ): boolean {
    return true; // Provider already filtered, always update
  }
}
