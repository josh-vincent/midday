import { BaseOAuthProvider, type TokenExchangeResponse } from "./base";
import type {
  OAuthProvider,
  TokenConfig,
  RefreshedTokens,
  ProviderConfig,
} from "../core/types";

/**
 * Google OAuth provider implementation (Gmail, Drive, etc.)
 * Handles Google OAuth 2.0 token refresh and authorization
 *
 * Supports both production and sandbox environments.
 * Token endpoint is the same for both environments.
 */
export class GoogleProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = "gmail";

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string {
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline", // Required for refresh token
      prompt: "consent", // Force consent screen to always get refresh token
      state,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Google tokens
   */
  async exchangeCodeForTokens(
    code: string,
    config: ProviderConfig,
    redirectUri: string
  ): Promise<TokenExchangeResponse> {
    const environment = config.environment || "production";

    try {
      const response = await this.makeTokenRequest(
        this.getTokenUrl(environment),
        {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
      };
    } catch (error) {
      throw new Error(
        `Google token exchange failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get environment-specific token URL
   * Google uses the same token endpoint for both sandbox and production
   */
  protected getTokenUrl(environment: "production" | "sandbox" = "production"): string {
    return "https://oauth2.googleapis.com/token";
  }

  /**
   * Get environment-specific headers
   * Google uses the same headers for both environments
   */
  protected getEnvironmentHeaders(
    environment: "production" | "sandbox" = "production"
  ): Record<string, string> {
    // Google doesn't require different headers for sandbox vs production
    // The difference is in the client credentials and project IDs used
    return {};
  }

  /**
   * Refresh Google access token
   */
  async refreshToken(
    tokens: TokenConfig,
    config: ProviderConfig
  ): Promise<RefreshedTokens> {
    const environment = config.environment || "production";

    try {
      const response = await this.makeTokenRequest(
        this.getTokenUrl(environment),
        {
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        },
        this.getEnvironmentHeaders(environment)
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || tokens.refreshToken, // Google may not return new refresh token
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
      };
    } catch (error) {
      throw new Error(
        `Google token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Google-specific token expiration check
   * Google tokens expire in 1 hour (3600 seconds)
   * We should refresh when less than 1 hour remaining
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number = 60): boolean {
    return super.isTokenExpiring(tokens, thresholdMinutes);
  }
}
