import { getConnectionsNeedingRefresh, updateAccountingConnection } from "@midday/db/queries";
import { createClient as createDbClient } from "@midday/db/client";
import { QuickBooksProvider } from "@midday/accounting-providers/providers/quickbooks";
import { XeroProvider } from "@midday/accounting-providers/providers/xero";
import type { QuickBooksCredentials, XeroCredentials } from "@midday/accounting-providers/types";
import { logger, schedules } from "@trigger.dev/sdk";

/**
 * Scheduled task to refresh OAuth tokens for accounting integrations
 * Runs every hour to check for tokens expiring within the next 2 hours
 */
export const refreshAccountingTokens = schedules.task({
  id: "refresh-accounting-tokens",
  cron: "0 * * * *", // Run every hour
  maxDuration: 300, // 5 minutes
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = createDbClient();

    try {
      // Get connections that need token refresh (expiring within 120 minutes)
      const connectionsNeedingRefresh = await getConnectionsNeedingRefresh(db, 120);

      if (!connectionsNeedingRefresh || connectionsNeedingRefresh.length === 0) {
        logger.info("No accounting tokens need refreshing");
        return;
      }

      logger.info(`Found ${connectionsNeedingRefresh.length} connections needing token refresh`);

      // Process each connection
      for (const connection of connectionsNeedingRefresh) {
        try {
          logger.info(`Refreshing token for ${connection.provider} connection ${connection.id}`);

          let provider;
          let newCredentials;

          // Create provider and refresh token based on provider type
          if (connection.provider === "quickbooks") {
            provider = new QuickBooksProvider(connection.credentials as QuickBooksCredentials);
            await provider.refreshAccessToken();
            // Get updated credentials from provider
            newCredentials = provider.getCredentials();
          } else if (connection.provider === "xero") {
            provider = new XeroProvider(connection.credentials as XeroCredentials);
            await provider.refreshAccessToken();
            // Get updated credentials from provider
            newCredentials = provider.getCredentials();
          } else {
            logger.warn(`Unsupported provider: ${connection.provider}`);
            continue;
          }

          // Update the connection with new credentials and expiry
          await updateAccountingConnection(db, {
            id: connection.id,
            teamId: connection.teamId,
            credentials: newCredentials,
            expiresAt: newCredentials.expiresAt
              ? new Date(newCredentials.expiresAt).toISOString()
              : undefined,
          });

          logger.info(`Successfully refreshed token for ${connection.provider} connection ${connection.id}`);

          // Cleanup
          if (provider) {
            await provider.disconnect();
          }
        } catch (error) {
          logger.error(`Failed to refresh token for connection ${connection.id}`, {
            error,
            connectionId: connection.id,
            provider: connection.provider,
          });

          // Continue with other connections even if one fails
          continue;
        }
      }

      logger.info(`Token refresh completed for ${connectionsNeedingRefresh.length} connections`);
    } catch (error) {
      logger.error("Failed to refresh accounting tokens", { error });
      throw error;
    }
  },
});
