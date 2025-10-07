import { logger, schedules } from "@trigger.dev/sdk";
import type { TokenSyncManager } from "@midday/oauth-sync-core";

/**
 * Create a Trigger.dev scheduled task for token refresh
 *
 * @example
 * ```typescript
 * import { createTokenRefreshScheduler } from "@midday/oauth-sync-trigger";
 * import { TokenSyncManager, SupabaseStorageAdapter } from "@midday/oauth-sync-core";
 * import { createClient } from "@supabase/supabase-js";
 *
 * const supabase = createClient(url, key);
 * const manager = new TokenSyncManager({
 *   storage: new SupabaseStorageAdapter(supabase),
 *   providers: {
 *     quickbooks: {
 *       clientId: process.env.QB_CLIENT_ID,
 *       clientSecret: process.env.QB_SECRET,
 *     },
 *     xero: {
 *       clientId: process.env.XERO_CLIENT_ID,
 *       clientSecret: process.env.XERO_SECRET,
 *     },
 *   },
 * });
 *
 * export const tokenRefreshTask = createTokenRefreshScheduler(manager, {
 *   cron: "*/30 * * * *", // Every 30 minutes
 * });
 * ```
 */
export function createTokenRefreshScheduler(
  manager: TokenSyncManager,
  options: {
    id?: string;
    cron?: string;
    maxDuration?: number;
    onSuccess?: (results: any[]) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  } = {}
) {
  const {
    id = "oauth-token-refresh-scheduler",
    cron = "*/30 * * * *", // Default: every 30 minutes
    maxDuration = 300, // Default: 5 minutes
    onSuccess,
    onError,
  } = options;

  return schedules.task({
    id,
    cron,
    maxDuration,
    run: async () => {
      logger.info("Starting OAuth token refresh");

      const startTime = Date.now();

      try {
        const results = await manager.refreshExpiringTokens();

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const duration = Date.now() - startTime;

        logger.info("OAuth token refresh completed", {
          total: results.length,
          successful,
          failed,
          duration,
        });

        // Call success callback if provided
        if (onSuccess) {
          await onSuccess(results);
        }

        return {
          success: true,
          total: results.length,
          successful,
          failed,
          duration,
          results,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error("OAuth token refresh failed", {
          error: errorMessage,
          duration,
        });

        // Call error callback if provided
        if (onError && error instanceof Error) {
          await onError(error);
        }

        throw error;
      }
    },
  });
}
