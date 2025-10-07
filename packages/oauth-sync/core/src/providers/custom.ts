import { BaseOAuthProvider, type TokenExchangeResponse } from "./base";
import type {
  OAuthProvider,
  TokenConfig,
  RefreshedTokens,
  CustomProviderConfig,
  ProviderConfig,
} from "../core/types";
import { customProviderConfigSchema } from "../core/types";

/**
 * Custom OAuth provider implementation
 * Allows users to define their own OAuth 2.0 providers with custom configuration
 *
 * @example
 * ```typescript
 * const customProvider = createCustomProvider({
 *   providerName: "my-service",
 *   tokenUrl: "https://api.myservice.com/oauth/token",
 *   clientId: "client_id",
 *   clientSecret: "client_secret",
 *   authMethod: "body",
 *   defaultExpiresIn: 3600,
 * });
 * ```
 */
export class CustomProvider extends BaseOAuthProvider {
  readonly provider: OAuthProvider;
  private readonly config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    super();

    // Validate configuration
    const validated = customProviderConfigSchema.parse(config);
    this.config = {
      ...validated,
      defaultExpiresIn: validated.defaultExpiresIn ?? 3600,
      defaultThresholdMinutes: validated.defaultThresholdMinutes ?? 60,
      authMethod: validated.authMethod ?? "body",
    };

    // Use provider name as the provider type
    // This is a workaround since OAuthProvider is a union type
    this.provider = this.config.providerName as OAuthProvider;
  }

  /**
   * Get authorization URL for custom provider
   * Note: Custom providers should configure authUrl in the config
   */
  getAuthorizationUrl(
    config: ProviderConfig,
    redirectUri: string,
    state: string
  ): string {
    throw new Error(
      `getAuthorizationUrl not implemented for custom provider "${this.config.providerName}". ` +
      `Please use built-in providers (QuickBooks, Xero, Gmail, Outlook) or implement authorization flow manually.`
    );
  }

  /**
   * Exchange authorization code for tokens (custom providers)
   * Note: Custom providers should implement this based on their OAuth spec
   */
  async exchangeCodeForTokens(
    code: string,
    config: ProviderConfig,
    redirectUri: string
  ): Promise<TokenExchangeResponse> {
    throw new Error(
      `exchangeCodeForTokens not implemented for custom provider "${this.config.providerName}". ` +
      `Please use built-in providers (QuickBooks, Xero, Gmail, Outlook) or implement token exchange manually.`
    );
  }

  /**
   * Refresh access token using custom provider configuration
   */
  async refreshToken(
    tokens: TokenConfig
  ): Promise<RefreshedTokens> {
    try {
      const body: Record<string, string> = {
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        ...this.config.additionalParams,
      };

      const headers: Record<string, string> = {
        ...this.config.additionalHeaders,
      };

      // Handle authentication method
      if (this.config.authMethod === "basic") {
        // Use HTTP Basic Auth
        const credentials = Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`
        ).toString("base64");
        headers.Authorization = `Basic ${credentials}`;
      } else {
        // Include credentials in request body
        body.client_id = this.config.clientId;
        body.client_secret = this.config.clientSecret;
      }

      // Add scopes if provided
      if (this.config.scopes && this.config.scopes.length > 0) {
        body.scope = this.config.scopes.join(" ");
      } else if (tokens.scope) {
        body.scope = tokens.scope;
      }

      const response = await this.makeTokenRequest(
        this.config.tokenUrl,
        body,
        headers
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || tokens.refreshToken,
        expiresIn: response.expires_in || this.config.defaultExpiresIn || 3600,
        scope: response.scope,
        tokenType: response.token_type,
      };
    } catch (error) {
      throw new Error(
        `Custom provider (${this.config.providerName}) token refresh failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if token is expiring using custom threshold
   */
  isTokenExpiring(
    tokens: TokenConfig,
    thresholdMinutes?: number
  ): boolean {
    const threshold = thresholdMinutes ?? this.config.defaultThresholdMinutes ?? 60;
    return super.isTokenExpiring(tokens, threshold);
  }

  /**
   * Get the provider configuration
   */
  getConfig(): CustomProviderConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a custom provider
 * @param config - Custom provider configuration
 * @returns CustomProvider instance
 */
export function createCustomProvider(
  config: CustomProviderConfig
): CustomProvider {
  return new CustomProvider(config);
}
