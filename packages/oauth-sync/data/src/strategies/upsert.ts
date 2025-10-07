import { BaseSyncStrategy, type SyncPlan } from "./base";
import type {
  ProviderRecord,
  DatabaseRecord,
  TableConfig,
} from "../core/types";

/**
 * Upsert strategy: Update existing records, insert new ones
 * This is the safest default strategy
 */
export class UpsertStrategy extends BaseSyncStrategy {
  readonly name = "upsert";

  plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan {
    const toInsert: DatabaseRecord[] = [];
    const toUpdate: DatabaseRecord[] = [];
    const toSkip: ProviderRecord[] = [];

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
        // New record - insert
        toInsert.push(dbRecord);
      } else {
        // Existing record - check if update needed
        if (this.needsUpdate(record, existing)) {
          toUpdate.push({
            ...dbRecord,
            id: existing.id, // Preserve database ID
          });
        } else {
          // Skip - already up to date
          toSkip.push(record);
        }
      }
    }

    return {
      toInsert,
      toUpdate,
      toDelete: [], // Never delete in upsert strategy
      toSkip,
    };
  }

  validate(config: TableConfig): boolean {
    // Upsert requires external ID column
    if (!config.externalIdColumn && !config.primaryKey) {
      return false;
    }
    return true;
  }
}
