import { BaseOAuthProvider, type TokenExchangeResponse } from "./base";
import type {
  OAuthProvider,
  TokenConfig,
  RefreshedTokens,
  ProviderConfig,
} from "../core/types";

/**
 * QuickBooks OAuth provider implementation
 * Handles QuickBooks OAuth 2.0 token refresh and authorization
 *
 * Supports both production and sandbox environments.
 * Token endpoint is the same for both environments.
 */
export class QuickBooksProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = "quickbooks";

  /**
   * Generate QuickBooks OAuth authorization URL
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string {
    const baseUrl = "https://appcenter.intuit.com/connect/oauth2";
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      state,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for QuickBooks tokens
   */
  async exchangeCodeForTokens(
    code: string,
    config: ProviderConfig,
    redirectUri: string
  ): Promise<TokenExchangeResponse> {
    const environment = config.environment || "production";

    // Encode client credentials for Basic Auth
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");

    try {
      const response = await this.makeTokenRequest(
        this.getTokenUrl(environment),
        {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        },
        {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        }
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
        realmId: response.realmId, // QuickBooks company ID
      };
    } catch (error) {
      throw new Error(
        `QuickBooks token exchange failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get environment-specific token URL
   * QuickBooks uses the same token endpoint for both sandbox and production
   */
  protected getTokenUrl(environment: "production" | "sandbox" = "production"): string {
    return "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
  }

  /**
   * Get environment-specific headers
   * QuickBooks uses the same headers for both environments
   */
  protected getEnvironmentHeaders(
    environment: "production" | "sandbox" = "production"
  ): Record<string, string> {
    // QuickBooks doesn't require different headers for sandbox vs production
    // The difference is in the client credentials and realm IDs used
    return {
      Accept: "application/json",
    };
  }

  /**
   * Refresh QuickBooks access token
   */
  async refreshToken(
    tokens: TokenConfig,
    config: ProviderConfig
  ): Promise<RefreshedTokens> {
    const environment = config.environment || "production";

    // Encode client credentials for Basic Auth
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");

    try {
      const response = await this.makeTokenRequest(
        this.getTokenUrl(environment),
        {
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken,
        },
        {
          Authorization: `Basic ${credentials}`,
          ...this.getEnvironmentHeaders(environment),
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
        `QuickBooks token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * QuickBooks-specific token expiration check
   * QuickBooks tokens expire in 1 hour (3600 seconds)
   * We should refresh when less than 1 hour remaining
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number = 60): boolean {
    return super.isTokenExpiring(tokens, thresholdMinutes);
  }
}
