import { initialQuickBooksSetupSchema } from "@jobs/schema";
import { schemaTask, logger } from "@trigger.dev/sdk";
import { syncQuickBooksEntity } from "../sync/sync-entity";

// This task runs the initial sync after QuickBooks OAuth connection
export const initialQuickBooksSetup = schemaTask({
  id: "initial-quickbooks-setup",
  schema: initialQuickBooksSetupSchema,
  maxDuration: 300, // 5 minutes
  queue: {
    concurrencyLimit: 10,
  },
  run: async (payload) => {
    const { integrationId, tenantId, realmId } = payload;

    logger.info("Starting initial QuickBooks setup", {
      integrationId,
      tenantId,
      realmId,
    });

    // Trigger initial sync for all major entity types
    const entityTypes = [
      "customer",
      "vendor",
      "account",
      "invoice",
      "item",
      "payment",
    ];

    const results = [];

    for (const entityType of entityTypes) {
      try {
        await syncQuickBooksEntity.trigger({
          integrationId,
          tenantId,
          entityType: entityType as any,
          entityId: "all", // Special case for initial sync
          operation: "sync_all",
          realmId,
          lastUpdated: new Date().toISOString(),
        });

        results.push({ entityType, success: true });

        logger.info(`Triggered initial sync for ${entityType}`, {
          integrationId,
          entityType,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error(`Failed to trigger initial sync for ${entityType}`, {
          integrationId,
          entityType,
          error: errorMessage,
        });

        results.push({ entityType, success: false, error: errorMessage });
        // Continue with other entity types even if one fails
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info("Initial QuickBooks setup completed", {
      integrationId,
      totalEntities: entityTypes.length,
      successCount,
      failureCount,
    });

    return {
      success: failureCount === 0,
      message: `Initial QuickBooks sync triggered for integration ${integrationId}`,
      results,
    };
  },
});
