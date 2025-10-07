import { BaseSyncStrategy, type SyncPlan } from "./base";
import type {
  ProviderRecord,
  DatabaseRecord,
  TableConfig,
} from "../core/types";

/**
 * Replace strategy: Delete all existing records, insert fresh data
 * Use for full refresh scenarios
 */
export class ReplaceStrategy extends BaseSyncStrategy {
  readonly name = "replace";

  plan(
    records: ProviderRecord[],
    existingRecords: DatabaseRecord[],
    config: TableConfig
  ): SyncPlan {
    const toInsert: DatabaseRecord[] = [];
    const toDelete: string[] = [];

    // Mark all existing records for deletion
    for (const existing of existingRecords) {
      if (existing.id) {
        toDelete.push(existing.id);
      }
    }

    // Insert all provider records as new
    for (const record of records) {
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
    }

    return {
      toInsert,
      toUpdate: [], // Never update in replace strategy
      toDelete,
      toSkip: [],
    };
  }

  validate(config: TableConfig): boolean {
    // Replace strategy works with any configuration
    return true;
  }
}
