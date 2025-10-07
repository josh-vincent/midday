import { task } from "@trigger.dev/sdk";
import type { TokenSyncManager } from "@midday/oauth-sync-core";
import type { OAuthProvider } from "@midday/oauth-sync-core";

/**
 * Payload for on-demand token refresh
 */
export interface OnDemandRefreshPayload {
  connectionId?: string;
  teamId?: string;
  provider?: OAuthProvider;
}

/**
 * Create an on-demand token refresh task
 * Useful for refreshing tokens on webhook events or manual triggers
 *
 * @example
 * ```typescript
 * import { createOnDemandRefreshTask } from "@midday/oauth-sync-trigger";
 *
 * export const refreshTokenTask = createOnDemandRefreshTask(manager, {
 *   id: "oauth-refresh-token",
 * });
 *
 * // Trigger the task
 * await refreshTokenTask.trigger({
 *   connectionId: "conn_123",
 * });
 * ```
 */
export function createOnDemandRefreshTask(
  manager: TokenSyncManager,
  options: {
    id?: string;
    maxDuration?: number;
  } = {}
) {
  const {
    id = "oauth-on-demand-refresh",
    maxDuration = 60, // 1 minute
  } = options;

  return task({
    id,
    maxDuration,
    run: async (payload: OnDemandRefreshPayload) => {
      // Refresh specific connection
      if (payload.connectionId && payload.provider) {
        const result = await manager.refreshConnection(
          payload.connectionId,
          payload.provider
        );
        return { success: true, results: [result] };
      }

      // Refresh all connections for a team
      if (payload.teamId) {
        const results = await manager.refreshTeamTokens(payload.teamId);
        return {
          success: true,
          results,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        };
      }

      // Refresh all expiring tokens
      const results = await manager.refreshExpiringTokens();
      return {
        success: true,
        results,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      };
    },
  });
}
