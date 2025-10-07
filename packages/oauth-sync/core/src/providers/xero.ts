import { BaseOAuthProvider, type TokenExchangeResponse } from "./base";
import type {
  OAuthProvider,
  TokenConfig,
  RefreshedTokens,
  ProviderConfig,
} from "../core/types";

/**
 * Xero OAuth provider implementation
 * Handles Xero OAuth 2.0 token refresh and authorization
 *
 * Supports both production and sandbox environments.
 * Token endpoint is the same for both environments.
 */
export class XeroProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider = "xero";

  /**
   * Generate Xero OAuth authorization URL
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string {
    const baseUrl = "https://login.xero.com/identity/connect/authorize";
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "offline_access accounting.transactions accounting.contacts",
      state,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Xero tokens
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
        `Xero token exchange failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get environment-specific token URL
   * Xero uses the same token endpoint for both sandbox and production
   */
  protected getTokenUrl(environment: "production" | "sandbox" = "production"): string {
    return "https://identity.xero.com/connect/token";
  }

  /**
   * Get environment-specific headers
   * Xero uses the same headers for both environments
   */
  protected getEnvironmentHeaders(
    environment: "production" | "sandbox" = "production"
  ): Record<string, string> {
    // Xero doesn't require different headers for sandbox vs production
    // The difference is in the client credentials and organization IDs used
    return {};
  }

  /**
   * Refresh Xero access token
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
        `Xero token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Xero-specific token expiration check
   * Xero tokens expire in 30 minutes (1800 seconds)
   * We should refresh when less than 30 minutes remaining
   */
  isTokenExpiring(tokens: TokenConfig, thresholdMinutes: number = 30): boolean {
    return super.isTokenExpiring(tokens, thresholdMinutes);
  }
}
