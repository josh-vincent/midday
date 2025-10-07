import { logger } from "@trigger.dev/sdk";
import {
  type Provider,
  type TokenConfig,
  isTokenExpiring,
  refreshProviderTokens,
  updateAppTokens,
} from "./token-refresh";

/**
 * Shared token refresh logic that can be used by existing sync tasks
 * This replaces the duplicate logic in QuickBooks and Xero sync tasks
 */
export async function refreshTokenIfNeeded(
  config: TokenConfig,
  provider: Provider,
  integrationId: string,
): Promise<TokenConfig> {
  // Check if token needs refresh
  if (!isTokenExpiring(config, provider)) {
    logger.debug("Token is still valid, no refresh needed", {
      provider,
      integrationId,
      expiresIn: config.expires_in,
      connectedAt: config.connected_at,
    });
    return config;
  }

  logger.info("Token expires soon, refreshing...", {
    provider,
    integrationId,
    connectedAt: config.connected_at,
    expiresIn: config.expires_in,
    currentTime: new Date().toISOString(),
  });

  try {
    // Refresh the tokens
    const refreshedTokens = await refreshProviderTokens(config, provider);

    // Update the database with new tokens
    await updateAppTokens(integrationId, config, refreshedTokens);

    // Return updated config
    const updatedConfig: TokenConfig = {
      ...config,
      access_token: refreshedTokens.access_token,
      refresh_token: refreshedTokens.refresh_token,
      expires_in: refreshedTokens.expires_in,
      connected_at: new Date().toISOString(),
    };

    logger.info("Tokens refreshed successfully", {
      provider,
      integrationId,
      newExpiresIn: updatedConfig.expires_in,
      newConnectedAt: updatedConfig.connected_at,
    });

    return updatedConfig;
  } catch (refreshError) {
    const errorMessage =
      refreshError instanceof Error
        ? refreshError.message
        : String(refreshError);

    logger.error("Failed to refresh tokens", {
      provider,
      integrationId,
      error: errorMessage,
    });

    // Re-throw the error so calling code can handle it
    throw new Error(`Token refresh failed for ${provider}: ${errorMessage}`);
  }
}

/**
 * Legacy wrapper for backward compatibility with existing QuickBooks sync code
 * @deprecated Use refreshTokenIfNeeded instead
 */
export async function refreshQuickBooksTokenIfNeeded(
  tokens: any,
  config: any,
  integrationId: string,
): Promise<void> {
  const tokenConfig: TokenConfig = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    connected_at: tokens.connected_at,
    ...tokens, // Preserve any additional fields like realm_id
  };

  const updatedConfig = await refreshTokenIfNeeded(
    tokenConfig,
    "quickbooks",
    integrationId,
  );

  // Update the tokens object in place (for backward compatibility)
  tokens.access_token = updatedConfig.access_token;
  tokens.refresh_token = updatedConfig.refresh_token;
  tokens.expires_in = updatedConfig.expires_in;
  tokens.connected_at = updatedConfig.connected_at;
}

/**
 * Legacy wrapper for backward compatibility with existing Xero sync code
 * @deprecated Use refreshTokenIfNeeded instead
 */
export async function refreshXeroTokenIfNeeded(
  tokens: any,
  config: any,
  integrationId: string,
): Promise<void> {
  const tokenConfig: TokenConfig = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    connected_at: tokens.connected_at,
    ...tokens, // Preserve any additional fields like tenant_id
  };

  const updatedConfig = await refreshTokenIfNeeded(
    tokenConfig,
    "xero",
    integrationId,
  );

  // Update the tokens object in place (for backward compatibility)
  tokens.access_token = updatedConfig.access_token;
  tokens.refresh_token = updatedConfig.refresh_token;
  tokens.expires_in = updatedConfig.expires_in;
  tokens.connected_at = updatedConfig.connected_at;
}

/**
 * Check if token refresh is needed without actually refreshing
 * Useful for monitoring and alerting purposes
 */
export function shouldRefreshToken(
  config: TokenConfig,
  provider: Provider,
): boolean {
  return isTokenExpiring(config, provider);
}

/**
 * Get time until token expires in minutes
 * Useful for monitoring and logging
 */
export function getTokenExpiryMinutes(config: TokenConfig): number {
  try {
    if (!config.connected_at || !config.expires_in) {
      return 0;
    }

    const connectedAt = new Date(config.connected_at).getTime();
    if (Number.isNaN(connectedAt)) {
      return 0;
    }

    const expiresInMs = config.expires_in * 1000;
    const tokenExpiresAt = connectedAt + expiresInMs;
    const now = Date.now();
    const remainingMs = tokenExpiresAt - now;

    return Math.max(0, Math.floor(remainingMs / (1000 * 60)));
  } catch {
    return 0;
  }
}
