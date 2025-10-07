import { BaseOAuthProvider, type TokenExchangeResponse } from "./base";
import type {
  OAuthProvider,
  TokenConfig,
  RefreshedTokens,
  ProviderConfig,
} from "../core/types";

/**
 * Microsoft Outlook/Exchange OAuth provider implementation
 * Handles Microsoft OAuth 2.0 token refresh and authorization
 *
 * Supports both production and sandbox environments.
 * Token endpoint is the same for both environments.
 */
export class OutlookProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = "outlook";

  /**
   * Generate Microsoft OAuth authorization URL
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string {
    const baseUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "offline_access Mail.Read Mail.Send",
      state,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Microsoft tokens
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
          scope: "https://graph.microsoft.com/.default",
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
        `Outlook token exchange failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get environment-specific token URL
   * Microsoft uses the same token endpoint for both sandbox and production
   */
  protected getTokenUrl(environment: "production" | "sandbox" = "production"): string {
    return "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  }

  /**
   * Get environment-specific headers
   * Microsoft uses the same headers for both environments
   */
  protected getEnvironmentHeaders(
    environment: "production" | "sandbox" = "production"
  ): Record<string, string> {
    // Microsoft doesn't require different headers for sandbox vs production
    // The difference is in the client credentials and tenant IDs used
    return {};
  }

  /**
   * Refresh Microsoft Outlook access token
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
          scope: tokens.scope || "https://graph.microsoft.com/.default",
        },
        this.getEnvironmentHeaders(environment)
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || tokens.refreshToken, // Microsoft may not return new refresh token
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
      };
    } catch (error) {
      throw new Error(
        `Outlook token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Outlook-specific token expiration check
   * Microsoft tokens expire in 1 hour (3600 seconds)
   * We should refresh when less than 1 hour remaining
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number = 60): boolean {
    return super.isTokenExpiring(tokens, thresholdMinutes);
  }
}
