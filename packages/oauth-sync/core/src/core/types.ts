import { z } from "zod";

/**
 * Supported OAuth providers
 */
export type OAuthProvider = "quickbooks" | "xero" | "gmail" | "outlook";

/**
 * OAuth token configuration stored in database
 */
export interface TokenConfig {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  expiresAt?: string; // ISO 8601 timestamp
  connectedAt: string; // ISO 8601 timestamp
  scope?: string;
  tokenType?: string;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  environment?: "production" | "sandbox";
}

/**
 * Custom provider configuration
 * Extends ProviderConfig with additional fields for custom OAuth providers
 */
export interface CustomProviderConfig extends ProviderConfig {
  /**
   * Provider name (for identification)
   */
  providerName: string;

  /**
   * OAuth token endpoint URL
   */
  tokenUrl: string;

  /**
   * Default token expiration time in seconds
   * @default 3600 (1 hour)
   */
  defaultExpiresIn?: number;

  /**
   * Default threshold in minutes for token refresh
   * @default 60
   */
  defaultThresholdMinutes?: number;

  /**
   * Authentication method for token refresh
   * - "basic": Use HTTP Basic Auth with client credentials
   * - "body": Include client credentials in request body
   * @default "body"
   */
  authMethod?: "basic" | "body";

  /**
   * Additional scopes to request
   */
  scopes?: string[];

  /**
   * Additional headers to include in token refresh request
   */
  additionalHeaders?: Record<string, string>;

  /**
   * Additional parameters to include in token refresh request body
   */
  additionalParams?: Record<string, string>;
}

/**
 * Connection record from database
 */
export interface ConnectionRecord {
  id: string;
  teamId: string;
  userId: string;
  orgId?: string; // B2B SaaS: Organization-level connection
  provider: OAuthProvider;
  credentials: TokenConfig & Record<string, any>;
  expiresAt?: string;
  realmId?: string; // QuickBooks
  tenantId?: string; // Xero
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Refreshed token response
 */
export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  connectionId: string;
  provider: OAuthProvider;
  success: boolean;
  refreshedAt: string;
  expiresAt: string;
  error?: string;
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  thresholdMinutes: number; // How many minutes before expiry to refresh
  batchSize?: number; // How many connections to process at once
  retryAttempts?: number; // Number of retry attempts
  retryDelayMs?: number; // Delay between retries
}

/**
 * Lock configuration for preventing concurrent refreshes
 */
export interface LockConfig {
  ttl: number; // Lock time-to-live in milliseconds
  retryCount?: number;
  retryDelay?: number;
}

// Zod schemas for validation
export const tokenConfigSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  expiresAt: z.string().optional(),
  connectedAt: z.string(),
  scope: z.string().optional(),
  tokenType: z.string().optional(),
});

export const providerConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().optional(),
  environment: z.enum(["production", "sandbox"]).optional(),
});

export const refreshedTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  scope: z.string().optional(),
  tokenType: z.string().optional(),
});

export const customProviderConfigSchema = z.object({
  providerName: z.string(),
  tokenUrl: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().optional(),
  environment: z.enum(["production", "sandbox"]).optional(),
  defaultExpiresIn: z.number().optional(),
  defaultThresholdMinutes: z.number().optional(),
  authMethod: z.enum(["basic", "body"]).optional(),
  scopes: z.array(z.string()).optional(),
  additionalHeaders: z.record(z.string()).optional(),
  additionalParams: z.record(z.string()).optional(),
});
