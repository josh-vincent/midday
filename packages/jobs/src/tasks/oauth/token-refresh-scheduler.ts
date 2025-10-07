import { logger, schedules } from "@trigger.dev/sdk";
import {
  type Provider,
  getExpiringTokens,
  isTokenExpiring,
  refreshProviderTokens,
  updateAppTokens,
} from "./token-refresh";

export const tokenRefreshScheduler = schedules.task({
  id: "token-refresh-scheduler",
  cron: "*/30 * * * *", // Every 30 minutes
  run: async () => {
    logger.info("Starting proactive token refresh");

    const startTime = Date.now();
    let totalApps = 0;
    let refreshedApps = 0;
    let errors = 0;

    try {
      // Get all apps with OAuth integrations
      const apps = await getExpiringTokens();
      totalApps = apps.length;

      logger.info("Found OAuth apps to check", { count: totalApps });

      if (totalApps === 0) {
        logger.info("No OAuth apps found, skipping token refresh");
        return;
      }

      // Process each app
      for (const app of apps) {
        try {
          const provider = app.app_id as Provider;
          const config = app.config;

          // Check if the token is expiring
          if (!isTokenExpiring(config, provider)) {
            logger.debug("Token not expiring, skipping refresh", {
              appId: app.id,
              provider,
              tenantId: app.tenant_id,
            });
            continue;
          }

          logger.info("Token expires soon, refreshing", {
            appId: app.id,
            provider,
            tenantId: app.tenant_id,
            connectedAt: config.connected_at,
            expiresIn: config.expires_in,
          });

          // Refresh the tokens
          const refreshedTokens = await refreshProviderTokens(config, provider);

          // Update the database with new tokens
          await updateAppTokens(app.id, config, refreshedTokens);

          refreshedApps++;

          logger.info("Token refreshed successfully for app", {
            appId: app.id,
            provider,
            tenantId: app.tenant_id,
          });
        } catch (error) {
          errors++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          logger.error("Failed to refresh token for app", {
            appId: app.id,
            provider: app.app_id,
            tenantId: app.tenant_id,
            error: errorMessage,
          });
        }
      }
    } catch (error) {
      errors++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to fetch apps for token refresh", {
        error: errorMessage,
      });
    }

    const duration = Date.now() - startTime;

    logger.info("Proactive token refresh completed", {
      duration,
      totalApps,
      refreshedApps,
      errors,
    });

    // If there were any errors, log a summary warning
    if (errors > 0) {
      logger.warn("Some token refresh operations failed", {
        totalErrors: errors,
        successfulRefreshes: refreshedApps,
      });
    }
  },
});
