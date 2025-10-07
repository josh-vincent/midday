import { BaseSyncStrategy, type SyncPlan } from "./base";
import type {
  ProviderRecord,
  DatabaseRecord,
  TableConfig,
} from "../core/types";

/**
 * Append strategy: Only insert new records, never update or delete
 * Use for append-only scenarios like audit logs
 */
export class AppendStrategy extends BaseSyncStrategy {
  readonly name = "append";

  plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan {
    const toInsert: DatabaseRecord[] = [];
    const toSkip: ProviderRecord[] = [];

    for (const record of records) {
      const externalId = record.externalId || record.id;
      const existing = this.findExisting(externalId, existingRecords);

      if (!existing) {
        // New record - insert
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

        toInsert.push(dbRecord);
      } else {
        // Already exists - skip
        toSkip.push(record);
      }
    }

    return {
      toInsert,
      toUpdate: [], // Never update in append strategy
      toDelete: [], // Never delete in append strategy
      toSkip,
    };
  }

  validate(config: TableConfig): boolean {
    // Append requires external ID to detect duplicates
    if (!config.externalIdColumn && !config.primaryKey) {
      return false;
    }
    return true;
  }
}
