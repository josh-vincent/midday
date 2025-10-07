import { getAccountingConnectionById, updateLastSyncTime } from "@midday/db/queries";
import { createClient as createDbClient } from "@midday/db/client";
import { createAccountingSyncManager } from "@midday/accounting-providers/accounting-sync-manager";
import type { AccountingSyncOptions } from "@midday/accounting-providers/types";
import { logger, task } from "@trigger.dev/sdk";
import { z } from "zod";

const syncAccountingDataSchema = z.object({
  connectionId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  entities: z
    .array(
      z.enum([
        "customers",
        "invoices",
        "payments",
        "accounts",
        "items",
        "vendors",
        "bills",
      ])
    )
    .optional(),
  modifiedSince: z.string().optional(), // ISO date string
  maxResults: z.number().optional(),
});

type SyncAccountingDataPayload = z.infer<typeof syncAccountingDataSchema>;

/**
 * Task to sync accounting data from external providers (QuickBooks, Xero)
 * Can be triggered manually or on a schedule
 */
export const syncAccountingData = task({
  id: "sync-accounting-data",
  maxDuration: 600, // 10 minutes
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: SyncAccountingDataPayload) => {
    const db = createDbClient();

    const { connectionId, teamId, userId, entities, modifiedSince, maxResults } = payload;

    try {
      // Get the accounting connection
      const connection = await getAccountingConnectionById(db, {
        id: connectionId,
        teamId,
      });

      if (!connection) {
        logger.error("Accounting connection not found");
        throw new Error("Accounting connection not found");
      }

      if (!connection.syncEnabled) {
        logger.info("Sync is disabled for this connection");
        return { success: false, message: "Sync is disabled" };
      }

      logger.info(`Starting sync for ${connection.provider} connection ${connectionId}`, {
        provider: connection.provider,
        entities: entities || "all",
      });

      // Create the sync manager (without queueManager to perform sync directly)
      const syncManager = createAccountingSyncManager();

      // Prepare sync options
      const syncOptions: AccountingSyncOptions = {
        teamId,
        userId,
        provider: connection.provider as "quickbooks" | "xero",
        credentials: connection.credentials,
        entities,
        modifiedSince: modifiedSince ? new Date(modifiedSince) : undefined,
        maxResults,
      };

      // Perform the sync
      const result = await syncManager.performSync(syncOptions);

      // Update last sync time
      if (result.success) {
        await updateLastSyncTime(db, connectionId, teamId);
      }

      logger.info(`Sync completed for ${connection.provider} connection ${connectionId}`, {
        result,
        synced: result.synced,
        errors: result.errors?.length || 0,
      });

      // Cleanup
      await syncManager.disconnectAll();

      return result;
    } catch (error) {
      logger.error("Failed to sync accounting data", {
        error,
        connectionId,
        teamId,
      });

      throw error;
    }
  },
});
