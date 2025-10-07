/**
 * Provider-specific token refresh configuration
 *
 * Different OAuth providers have different token expiry times:
 * - QuickBooks: 1 hour (3600s) access token, 101 day refresh token
 * - Xero: 30 minutes (1800s) access token, 60 day refresh token
 * - Microsoft: 1 hour (3600s) access token, 90 day refresh token
 * - Google: 1 hour (3600s) access token, refresh token doesn't expire
 */

import type { OAuthProvider } from "@midday/oauth-sync-core";

export interface ProviderRefreshStrategy {
  /**
   * Access token lifetime in minutes
   */
  accessTokenLifetimeMinutes: number;

  /**
   * Refresh token lifetime in days (null = doesn't expire)
   */
  refreshTokenLifetimeDays: number | null;

  /**
   * When to refresh before expiry (in minutes)
   * Should be significant portion of token lifetime for short-lived tokens
   */
  refreshThresholdMinutes: number;

  /**
   * How often to check for expiring tokens (in minutes)
   */
  checkIntervalMinutes: number;

  /**
   * Description
   */
  description: string;
}

/**
 * Default refresh strategies for each provider
 * Based on official OAuth documentation
 */
export const DEFAULT_PROVIDER_STRATEGIES: Record<OAuthProvider, ProviderRefreshStrategy> = {
  xero: {
    accessTokenLifetimeMinutes: 30,
    refreshTokenLifetimeDays: 60,
    refreshThresholdMinutes: 20, // Refresh when 20 minutes left (with 10 min buffer)
    checkIntervalMinutes: 10, // Check every 10 minutes (frequent due to short lifetime)
    description: 'Xero tokens expire in 30 minutes - very short lifetime requires frequent checks',
  },

  quickbooks: {
    accessTokenLifetimeMinutes: 60,
    refreshTokenLifetimeDays: 101,
    refreshThresholdMinutes: 45, // Refresh when 45 minutes left (15 min buffer)
    checkIntervalMinutes: 15, // Check every 15 minutes
    description: 'QuickBooks tokens expire in 1 hour',
  },

  outlook: {
    accessTokenLifetimeMinutes: 60,
    refreshTokenLifetimeDays: 90,
    refreshThresholdMinutes: 45, // Refresh when 45 minutes left (15 min buffer)
    checkIntervalMinutes: 15, // Check every 15 minutes
    description: 'Microsoft/Azure tokens expire in 1 hour',
  },

  gmail: {
    accessTokenLifetimeMinutes: 60,
    refreshTokenLifetimeDays: null, // Doesn't expire (unless revoked)
    refreshThresholdMinutes: 45, // Refresh when 45 minutes left (15 min buffer)
    checkIntervalMinutes: 15, // Check every 15 minutes
    description: 'Google tokens expire in 1 hour, refresh token never expires',
  },
};

/**
 * Get recommended check interval for multiple providers
 * Uses the most aggressive (shortest) interval among active providers
 */
export function getRecommendedCheckInterval(providers: OAuthProvider[]): number {
  if (providers.length === 0) {
    return 15; // Default to 15 minutes
  }

  const intervals = providers.map(p => DEFAULT_PROVIDER_STRATEGIES[p].checkIntervalMinutes);
  return Math.min(...intervals);
}

/**
 * Get provider-specific refresh threshold
 * Returns custom threshold if provided, otherwise uses provider default
 */
export function getRefreshThreshold(
  provider: OAuthProvider,
  customThreshold?: number
): number {
  if (customThreshold !== undefined) {
    return customThreshold;
  }
  return DEFAULT_PROVIDER_STRATEGIES[provider].refreshThresholdMinutes;
}

/**
 * Validate if refresh threshold is safe for provider
 * Returns warning if threshold might cause token expiry
 */
export function validateRefreshThreshold(
  provider: OAuthProvider,
  thresholdMinutes: number
): { valid: boolean; warning?: string } {
  const strategy = DEFAULT_PROVIDER_STRATEGIES[provider];

  // Threshold should be less than token lifetime
  if (thresholdMinutes >= strategy.accessTokenLifetimeMinutes) {
    return {
      valid: false,
      warning: `Threshold ${thresholdMinutes}min is >= token lifetime ${strategy.accessTokenLifetimeMinutes}min for ${provider}. Tokens may expire before refresh!`
    };
  }

  // Warn if buffer is too small (less than 5 minutes)
  const buffer = strategy.accessTokenLifetimeMinutes - thresholdMinutes;
  if (buffer < 5) {
    return {
      valid: true,
      warning: `Small buffer (${buffer}min) for ${provider}. Consider increasing threshold for safety.`
    };
  }

  // Warn if threshold is too conservative (wasting refresh calls)
  if (thresholdMinutes < strategy.accessTokenLifetimeMinutes * 0.5) {
    return {
      valid: true,
      warning: `Threshold ${thresholdMinutes}min is very conservative for ${provider} (${strategy.accessTokenLifetimeMinutes}min lifetime). May cause unnecessary refreshes.`
    };
  }

  return { valid: true };
}

/**
 * Get provider refresh strategy summary
 */
export function getProviderSummary(provider: OAuthProvider): string {
  const strategy = DEFAULT_PROVIDER_STRATEGIES[provider];
  const refreshLifetime = strategy.refreshTokenLifetimeDays
    ? `${strategy.refreshTokenLifetimeDays} days`
    : 'never expires';

  return `
Provider: ${provider.toUpperCase()}
Access Token: ${strategy.accessTokenLifetimeMinutes} minutes
Refresh Token: ${refreshLifetime}
Recommended Threshold: ${strategy.refreshThresholdMinutes} minutes
Recommended Check Interval: ${strategy.checkIntervalMinutes} minutes
Notes: ${strategy.description}
  `.trim();
}

/**
 * Custom per-provider configuration
 */
export interface PerProviderRefreshConfig {
  /**
   * Provider-specific thresholds
   * @example
   * ```typescript
   * {
   *   xero: 20,  // Refresh Xero tokens when 20 minutes left
   *   quickbooks: 45  // Refresh QB tokens when 45 minutes left
   * }
   * ```
   */
  thresholds?: Partial<Record<OAuthProvider, number>>;

  /**
   * Provider-specific check intervals
   * @example
   * ```typescript
   * {
   *   xero: 10,  // Check Xero tokens every 10 minutes
   *   quickbooks: 15  // Check QB tokens every 15 minutes
   * }
   * ```
   */
  intervals?: Partial<Record<OAuthProvider, number>>;
}

/**
 * Merge custom config with defaults
 */
export function mergeProviderConfig(
  custom?: PerProviderRefreshConfig
): Record<OAuthProvider, { threshold: number; interval: number }> {
  const providers: OAuthProvider[] = ['xero', 'quickbooks', 'outlook', 'gmail'];
  const result = {} as Record<OAuthProvider, { threshold: number; interval: number }>;

  for (const provider of providers) {
    const defaults = DEFAULT_PROVIDER_STRATEGIES[provider];
    result[provider] = {
      threshold: custom?.thresholds?.[provider] ?? defaults.refreshThresholdMinutes,
      interval: custom?.intervals?.[provider] ?? defaults.checkIntervalMinutes,
    };
  }

  return result;
}
