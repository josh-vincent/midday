/**
 * OAuth Client for Supabase Edge Functions
 *
 * This client communicates with the OAuth API Gateway deployed on Supabase
 * Edge Functions for secure token management and provider integrations.
 */

const OAUTH_API_URL = process.env.OAUTH_API_URL || 'https://ulncfblvuijlgniydjju.supabase.co/functions/v1/api';
const OAUTH_API_KEY = process.env.SUPABASE_ANON_KEY || '';

export type OAuthProvider = 'xero' | 'quickbooks' | 'sage' | 'fortnox' | 'gmail' | 'google-calendar' | 'outlook' | 'outlook-calendar';

export interface OAuthConnection {
  id: string;
  provider: OAuthProvider;
  tenantId: string;
  isActive: boolean;
  expiresAt?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizeUrlResponse {
  authUrl: string;
}

export interface CallbackResponse {
  success: boolean;
  expiresAt: string;
}

class OAuthClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = OAUTH_API_URL, apiKey: string = OAUTH_API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('[OAuthClient] Making request:', { url, method: options.method || 'GET' });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('[OAuthClient] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[OAuthClient] Request failed:', { status: response.status, error });
      throw new Error(`OAuth API error: ${error}`);
    }

    const data = await response.json();
    console.log('[OAuthClient] Response data:', data);
    return data;
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  async getAuthorizeUrl(
    provider: OAuthProvider,
    tenantId: string
  ): Promise<AuthorizeUrlResponse> {
    const endpoint = `/oauth/${provider}/authorize?tenantId=${encodeURIComponent(tenantId)}`;
    console.log('[OAuthClient] getAuthorizeUrl called:', { provider, tenantId, endpoint, baseUrl: this.baseUrl });

    try {
      const result = await this.request<AuthorizeUrlResponse>(endpoint);
      console.log('[OAuthClient] getAuthorizeUrl success:', result);
      return result;
    } catch (error) {
      console.error('[OAuthClient] getAuthorizeUrl error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<CallbackResponse> {
    return this.request<CallbackResponse>(
      `/oauth/${provider}/callback`,
      {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      }
    );
  }

  /**
   * Get customers from connected provider
   */
  async getCustomers(
    provider: OAuthProvider,
    tenantId: string
  ): Promise<any[]> {
    const response = await this.request<{ data: any[] }>(
      `/customers?provider=${provider}&tenantId=${encodeURIComponent(tenantId)}`
    );
    return response.data;
  }

  /**
   * Get all connections for a tenant
   */
  async getConnections(tenantId: string): Promise<OAuthConnection[]> {
    const response = await this.request<{ connections: OAuthConnection[] }>(
      `/connections?tenantId=${encodeURIComponent(tenantId)}`
    );
    return response.connections;
  }

  /**
   * Check connection health
   */
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    platform: string;
  }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const oauthClient = new OAuthClient();

// Export class for custom instances
export { OAuthClient };
