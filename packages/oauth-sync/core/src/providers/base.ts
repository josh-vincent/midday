import type {
  OAuthProvider,
  ProviderConfig,
  TokenConfig,
  RefreshedTokens,
} from "../core/types";

/**
 * OAuth token exchange response
 */
export interface TokenExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope?: string;
  tokenType?: string;
  realmId?: string; // QuickBooks-specific
  tenantId?: string; // Xero-specific
}

/**
 * Base interface for OAuth provider implementations
 * Each provider (QuickBooks, Xero, etc.) must implement this interface
 */
export interface IOAuthProvider {
  /**
   * Provider name
   */
  readonly provider: OAuthProvider;

  /**
   * Check if token is expiring and needs refresh
   * @param tokens - Current token configuration
   * @param thresholdMinutes - Minutes before expiry to consider as "expiring"
   * @returns true if token should be refreshed
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number): boolean;

  /**
   * Refresh the access token using the refresh token
   * @param tokens - Current token configuration
   * @param config - Provider configuration (client ID, secret, etc.)
   * @returns New tokens
   */
  refreshToken(
    tokens: TokenConfig,
    config: ProviderConfig
  ): Promise<RefreshedTokens>;

  /**
   * Calculate the expiration timestamp for tokens
   * @param expiresIn - Seconds until expiration
   * @returns ISO 8601 timestamp
   */
  calculateExpiresAt(expiresIn: number): string;

  /**
   * Generate OAuth authorization URL for initial connection
   * @param config - Provider configuration (client ID, etc.)
   * @param redirectUri - OAuth callback URL
   * @param state - CSRF protection state parameter
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string;

  /**
   * Exchange authorization code for access and refresh tokens
   * @param code - Authorization code from OAuth callback
   * @param config - Provider configuration (client ID, secret, etc.)
   * @param redirectUri - OAuth callback URL (must match authorization request)
   * @returns Token response including access token, refresh token, and metadata
   */
  exchangeCodeForTokens(
    code: string,
    config: ProviderConfig,
    redirectUri: string
  ): Promise<TokenExchangeResponse>;
}

/**
 * Base abstract class for OAuth providers
 * Provides common functionality that all providers can use
 */
export abstract class BaseOAuthProvider implements IOAuthProvider {
  abstract readonly provider: OAuthProvider;

  /**
   * Abstract methods that must be implemented by each provider
   */
  abstract getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string;

  abstract exchangeCodeForTokens(
    code: string,
    config: ProviderConfig,
    redirectUri: string
  ): Promise<TokenExchangeResponse>;

  abstract refreshToken(
    tokens: TokenConfig,
    config: ProviderConfig
  ): Promise<RefreshedTokens>;

  /**
   * Default implementation of token expiration check
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number): boolean {
    try {
      // If we have expiresAt, use it
      if (tokens.expiresAt) {
        const expiresAt = new Date(tokens.expiresAt).getTime();
        const now = Date.now();
        const thresholdMs = thresholdMinutes * 60 * 1000;
        return expiresAt - now <= thresholdMs;
      }

      // Otherwise calculate from connectedAt + expiresIn
      if (tokens.connectedAt && tokens.expiresIn) {
        const connectedAt = new Date(tokens.connectedAt).getTime();
        const expiresInMs = tokens.expiresIn * 1000;
        const expiresAt = connectedAt + expiresInMs;
        const now = Date.now();
        const thresholdMs = thresholdMinutes * 60 * 1000;
        return expiresAt - now <= thresholdMs;
      }

      // If we can't determine, assume it's expiring
      return true;
    } catch (error) {
      // On error, assume token is expiring to be safe
      return true;
    }
  }

  /**
   * Calculate expiration timestamp
   */
  calculateExpiresAt(expiresIn: number): string {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    return expiresAt.toISOString();
  }

  /**
   * Helper method to make HTTP requests
   * Useful for providers that need to call OAuth token endpoints
   */
  protected async makeTokenRequest(
    url: string,
    body: Record<string, string>,
    headers: Record<string, string> = {}
  ): Promise<any> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Get environment-specific token URL
   * Override this method to support different URLs for sandbox/production
   */
  protected getTokenUrl(environment?: "production" | "sandbox"): string {
    // Default implementation - derived classes should override if needed
    throw new Error("getTokenUrl must be implemented by provider");
  }

  /**
   * Get environment-specific headers
   * Override this method to add environment-specific headers
   */
  protected getEnvironmentHeaders(
    environment?: "production" | "sandbox"
  ): Record<string, string> {
    // Default: no additional environment-specific headers
    return {};
  }
}
