import type { TokenSyncManager } from "@midday/oauth-sync-core";

/**
 * Cloudflare Workers scheduled event handler for token refresh
 *
 * @example
 * ```typescript
 * // wrangler.toml
 * [triggers]
 * crons = ["* /30 * * * *"] # Every 30 minutes
 *
 * // src/index.ts
 * import { createTokenRefreshHandler } from "@midday/oauth-sync-cloudflare";
 * import { TokenSyncManager, KVStorageAdapter } from "@midday/oauth-sync-core";
 *
 * export default {
 *   async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
 *     const manager = new TokenSyncManager({
 *       storage: new KVStorageAdapter({
 *         get: (key) => env.KV.get(key),
 *         set: (key, value, opts) => env.KV.put(key, value, opts),
 *         del: (key) => env.KV.delete(key),
 *       }),
 *       providers: {
 *         quickbooks: {
 *           clientId: env.QB_CLIENT_ID,
 *           clientSecret: env.QB_SECRET,
 *         },
 *       },
 *     });
 *
 *     const handler = createTokenRefreshHandler(manager);
 *     await handler(event, env, ctx);
 *   },
 * };
 * ```
 */
export function createTokenRefreshHandler(
  manager: TokenSyncManager,
  options: {
    onSuccess?: (results: any[]) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  } = {}
) {
  return async function handleScheduled(
    event: ScheduledEvent,
    env: any,
    ctx: ExecutionContext
  ) {
    const startTime = Date.now();

    console.log("Starting OAuth token refresh", {
      cron: event.cron,
      scheduledTime: new Date(event.scheduledTime).toISOString(),
    });

    try {
      const results = await manager.refreshExpiringTokens();

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const duration = Date.now() - startTime;

      console.log("OAuth token refresh completed", {
        total: results.length,
        successful,
        failed,
        duration,
      });

      // Call success callback if provided
      if (options.onSuccess) {
        await options.onSuccess(results);
      }

      return {
        success: true,
        total: results.length,
        successful,
        failed,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error("OAuth token refresh failed", {
        error: errorMessage,
        duration,
      });

      // Call error callback if provided
      if (options.onError && error instanceof Error) {
        await options.onError(error);
      }

      throw error;
    }
  };
}

/**
 * Create a fetch handler for on-demand token refresh
 * Useful for HTTP-triggered refreshes
 *
 * @example
 * ```typescript
 * export default {
 *   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *     const url = new URL(request.url);
 *
 *     if (url.pathname === "/oauth/refresh" && request.method === "POST") {
 *       const handler = createTokenRefreshFetchHandler(manager);
 *       return handler(request, env, ctx);
 *     }
 *
 *     return new Response("Not found", { status: 404 });
 *   },
 * };
 * ```
 */
export function createTokenRefreshFetchHandler(
  manager: TokenSyncManager,
  options: {
    authHeader?: string; // e.g., "Bearer secret-token"
  } = {}
) {
  return async function handleFetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check authorization if configured
    if (options.authHeader) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== options.authHeader) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    try {
      // Parse request body if present
      let payload: any = {};
      if (request.method === "POST") {
        const contentType = request.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          payload = await request.json();
        }
      }

      // Refresh specific connection
      if (payload.connectionId && payload.provider) {
        const result = await manager.refreshConnection(
          payload.connectionId,
          payload.provider
        );
        return new Response(JSON.stringify({ success: true, result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Refresh team tokens
      if (payload.teamId) {
        const results = await manager.refreshTeamTokens(payload.teamId);
        return new Response(
          JSON.stringify({
            success: true,
            results,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Refresh all expiring tokens
      const results = await manager.refreshExpiringTokens();
      return new Response(
        JSON.stringify({
          success: true,
          results,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Token refresh failed", { error: errorMessage });

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
