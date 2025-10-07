import { logger } from "@trigger.dev/sdk";
import { createClient } from "@midday/supabase/job";

export type TokenConfig = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  connected_at: string;
  realm_id?: string;
  tenant_id?: string;
  [key: string]: unknown;
};

export type RefreshedTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AppRecord = {
  id: string;
  app_id: string;
  tenant_id: string;
  config: TokenConfig;
};

export type Provider = "quickbooks" | "xero";

/**
 * Check if a token is expiring within the provider-specific time window
 */
export function isTokenExpiring(
  config: TokenConfig,
  provider: Provider,
): boolean {
  try {
    // Safety check for missing or invalid data
    if (!config.connected_at || !config.expires_in) {
      logger.warn(
        "Missing token expiry data, treating as expiring for safety",
        {
          hasConnectedAt: !!config.connected_at,
          hasExpiresIn: !!config.expires_in,
        },
      );
      return true;
    }

    const connectedAt = new Date(config.connected_at).getTime();

    // Check if the date is valid
    if (Number.isNaN(connectedAt)) {
      logger.warn(
        "Invalid connected_at date, treating as expiring for safety",
        {
          connected_at: config.connected_at,
        },
      );
      return true;
    }

    const expiresInMs = config.expires_in * 1000; // Convert seconds to milliseconds
    const tokenExpiresAt = connectedAt + expiresInMs;
    const now = Date.now();

    // Provider-specific time windows
    const timeWindows = {
      quickbooks: 60 * 60 * 1000, // 1 hour in milliseconds
      xero: 30 * 60 * 1000, // 30 minutes in milliseconds
    };

    const buffer = timeWindows[provider];
    const shouldRefresh = now + buffer > tokenExpiresAt;

    logger.debug("Token expiry check", {
      provider,
      connectedAt: config.connected_at,
      expiresIn: config.expires_in,
      tokenExpiresAt: new Date(tokenExpiresAt).toISOString(),
      buffer: buffer / 1000 / 60, // in minutes
      shouldRefresh,
    });

    return shouldRefresh;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error checking token expiry, treating as expiring for safety",
      {
        error: errorMessage,
        provider,
      },
    );
    return true;
  }
}

/**
 * Get all apps with QuickBooks or Xero integrations
 */
export async function getExpiringTokens(): Promise<AppRecord[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("apps")
      .select("id, app_id, tenant_id, config")
      .in("app_id", ["quickbooks", "xero"]);

    if (error) {
      throw new Error(`Failed to fetch apps: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to fetch apps from database", {
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Refresh tokens for a specific provider with retry logic
 */
export async function refreshProviderTokens(
  config: TokenConfig,
  provider: Provider,
  maxRetries = 3,
): Promise<RefreshedTokens> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug("Attempting token refresh", {
        provider,
        attempt,
        maxRetries,
      });

      let refreshedTokens: RefreshedTokens;

      switch (provider) {
        case "quickbooks": {
          const { QuickBooksProvider } = await import(
            "@midday/accounting-providers"
          );
          const qbProvider = new QuickBooksProvider({
            clientId: process.env.QUICKBOOKS_CLIENT_ID || "",
            clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
            refreshToken: config.refresh_token,
            accessToken: config.access_token,
            realmId: config.realm_id || "",
            expiryDate: new Date(config.connected_at).getTime() + config.expires_in * 1000,
          });
          await qbProvider.refreshAccessToken();
          const credentials = qbProvider.getCredentials();
          refreshedTokens = {
            access_token: credentials.accessToken || "",
            refresh_token: credentials.refreshToken || "",
            expires_in: credentials.expiryDate
              ? Math.floor((credentials.expiryDate - Date.now()) / 1000)
              : 3600,
          };
          await qbProvider.disconnect();
          break;
        }

        case "xero": {
          const { XeroProvider } = await import("@midday/accounting-providers");
          const xeroProvider = new XeroProvider({
            clientId: process.env.XERO_CLIENT_ID || "",
            clientSecret: process.env.XERO_CLIENT_SECRET || "",
            refreshToken: config.refresh_token,
            accessToken: config.access_token,
            tenantId: config.tenant_id || "",
            expiryDate: new Date(config.connected_at).getTime() + config.expires_in * 1000,
          });
          await xeroProvider.refreshAccessToken();
          const credentials = xeroProvider.getCredentials();
          refreshedTokens = {
            access_token: credentials.accessToken || "",
            refresh_token: credentials.refreshToken || "",
            expires_in: credentials.expiryDate
              ? Math.floor((credentials.expiryDate - Date.now()) / 1000)
              : 1800,
          };
          await xeroProvider.disconnect();
          break;
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Validate the refreshed tokens
      if (!refreshedTokens.access_token || !refreshedTokens.refresh_token) {
        throw new Error(
          "Invalid response: missing access_token or refresh_token",
        );
      }

      logger.debug("Tokens refreshed successfully", {
        provider,
        attempt,
        hasAccessToken: !!refreshedTokens.access_token,
        hasRefreshToken: !!refreshedTokens.refresh_token,
        expiresIn: refreshedTokens.expires_in,
      });

      return refreshedTokens;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn("Token refresh attempt failed", {
        provider,
        attempt,
        maxRetries,
        error: lastError.message,
      });

      // Check if this is a non-retryable error
      if (isNonRetryableError(lastError)) {
        logger.error(
          "Non-retryable error encountered, aborting retry attempts",
          {
            provider,
            error: lastError.message,
          },
        );
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10000);
        logger.debug("Waiting before retry", {
          provider,
          attempt,
          delayMs,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || "Unknown error";
  logger.error("All token refresh attempts failed", {
    provider,
    maxRetries,
    error: errorMessage,
  });

  throw new Error(
    `Failed to refresh ${provider} tokens after ${maxRetries} attempts: ${errorMessage}`,
  );
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Common non-retryable errors
  const nonRetryablePatterns = [
    "invalid_grant", // OAuth refresh token is invalid/expired
    "unauthorized_client", // Client credentials are invalid
    "invalid_client", // Client ID is invalid
    "access_denied", // User has revoked access
    "invalid_refresh_token", // Refresh token is invalid
    "token_expired", // Token has expired and cannot be refreshed
    "revoked_token", // Token has been revoked
  ];

  return nonRetryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Update app config with refreshed tokens in the database with retry logic
 */
export async function updateAppTokens(
  appId: string,
  config: TokenConfig,
  refreshedTokens: RefreshedTokens,
  maxRetries = 3,
): Promise<void> {
  const supabase = createClient();
  let lastError: Error | null = null;

  const updatedConfig = {
    ...config,
    access_token: refreshedTokens.access_token,
    refresh_token: refreshedTokens.refresh_token,
    expires_in: refreshedTokens.expires_in,
    connected_at: new Date().toISOString(),
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug("Attempting database update", {
        appId,
        attempt,
        maxRetries,
      });

      const { error } = await supabase
        .from("apps")
        .update({ config: updatedConfig })
        .eq("id", appId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      logger.debug("App tokens updated in database", {
        appId,
        attempt,
        connectedAt: updatedConfig.connected_at,
        expiresIn: updatedConfig.expires_in,
      });

      return; // Success - exit function
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn("Database update attempt failed", {
        appId,
        attempt,
        maxRetries,
        error: lastError.message,
      });

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 5000);
        logger.debug("Waiting before database retry", {
          appId,
          attempt,
          delayMs,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || "Unknown error";
  logger.error("All database update attempts failed", {
    appId,
    maxRetries,
    error: errorMessage,
  });

  throw new Error(
    `Failed to update database after ${maxRetries} attempts: ${errorMessage}`,
  );
}
