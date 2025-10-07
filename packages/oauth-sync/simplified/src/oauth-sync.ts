/**
 * OAuthSync v3 - Stripe-like API
 *
 * Simple, powerful OAuth token management
 *
 * @example
 * ```typescript
 * const oauth = new OAuthSync({ storage: 'supabase', autoRefresh: true });
 * const tokens = await oauth.getTokens({ orgId: 'org_123' });
 * const xeroToken = tokens.xero;
 * ```
 */

import { z } from "zod";
import {
  TokenSyncManager,
  type ConnectionRecord,
  type IStorageAdapter,
  type OAuthProvider,
  type ProviderConfig,
  QuickBooksProvider,
  XeroProvider,
  SupabaseStorageAdapter,
  KVStorageAdapter,
  PostgresStorageAdapter,
} from "@midday/oauth-sync-core";
import { OAuthEventEmitter, createEventEmitter, type OAuthEventMap } from "@midday/oauth-sync-core/utils/events";
import { AutoRefreshService, type AutoRefreshConfig } from "./auto-refresh";
import { retryWithBackoff, smartRetry } from "@midday/oauth-sync-core/utils/retry";
import type { AuthContextExtractor } from "./auth-context";
import { createAutoExtractor, mergeContext } from "./auth-context";

// ============================================================================
// Configuration Types
// ============================================================================

export interface OAuthSyncConfig {
  /**
   * Storage backend
   * Can be a string shorthand or custom adapter instance
   * Auto-detects from environment variables if not provided:
   * - SUPABASE_URL → 'supabase'
   * - CLOUDFLARE_KV_BINDING → 'cloudflare'
   * - DATABASE_URL → 'postgres'
   * @default Auto-detected from environment
   */
  storage?: 'supabase' | 'cloudflare' | 'postgres' | IStorageAdapter;

  /**
   * Storage configuration (for string shorthands)
   */
  storageConfig?: {
    url?: string;
    key?: string;
    tableName?: string;
    kv?: any;
    keyPrefix?: string;
    connectionString?: string;
  };

  /**
   * OAuth providers
   * Auto-detected from env vars if not provided
   */
  providers?: Record<string, ProviderConfig>;

  /**
   * Auto-refresh configuration
   */
  autoRefresh?: boolean | AutoRefreshConfig;

  /**
   * Auth context extractor
   * Auto-detects user context from JWT/auth session
   * @default 'auto' (auto-detects NextAuth, Clerk, Supabase Auth)
   */
  authExtractor?: 'auto' | 'nextauth' | 'clerk' | 'supabase' | AuthContextExtractor | false;

  /**
   * Maximum number of retries for failed requests
   * @default 2
   */
  maxRetries?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;
}

export interface TokenContext {
  userId?: string;
  teamId?: string;
  orgId?: string;
  /**
   * Filter by specific providers
   * @example ['xero', 'quickbooks']
   */
  providers?: OAuthProvider[];
}

export interface ConnectOptions extends TokenContext {
  redirectUri?: string;
}

/**
 * Rich token information including scopes and permissions
 */
export interface TokenInfo {
  token: string;
  scopes: string[];
  expiresAt: string;
  provider: OAuthProvider;
  connectionId: string;
  metadata?: {
    isPrimary?: boolean;
    permissions?: 'read' | 'readWrite' | 'admin';
    [key: string]: any;
  };
}

export type TokenResponse = Record<string, string>;
export type RichTokenResponse = Record<string, TokenInfo>;

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const tokenContextSchema = z.object({
  userId: z.string().optional(),
  teamId: z.string().optional(),
  orgId: z.string().optional(),
  providers: z.array(z.enum(["quickbooks", "xero", "gmail", "outlook"])).optional(),
});

export const connectOptionsSchema = tokenContextSchema.extend({
  redirectUri: z.string().url().optional(),
});

export const tokenInfoSchema = z.object({
  token: z.string().min(1),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime(),
  provider: z.enum(["quickbooks", "xero", "gmail", "outlook"]),
  connectionId: z.string().min(1),
  metadata: z.object({
    isPrimary: z.boolean().optional(),
    permissions: z.enum(["read", "readWrite", "admin"]).optional(),
  }).passthrough().optional(),
});

export const autoRefreshConfigSchema = z.object({
  enabled: z.boolean().optional(),
  intervalMinutes: z.number().min(1).optional(),
  thresholdMinutes: z.number().min(1).optional(),
  perProviderConfig: z.object({
    thresholds: z.record(z.number().min(1)).optional(),
    intervals: z.record(z.number().min(1)).optional(),
  }).optional(),
  runImmediately: z.boolean().optional(),
  platform: z.enum(["node", "vercel", "cloudflare", "aws", "deno", "auto"]).optional(),
  cronSecret: z.string().optional(),
}).optional();

export const oauthSyncConfigSchema = z.object({
  storage: z.union([
    z.literal("supabase"),
    z.literal("cloudflare"),
    z.literal("postgres"),
    z.any(), // Custom IStorageAdapter
  ]).optional(),
  storageConfig: z.object({
    url: z.string().url().optional(),
    key: z.string().optional(),
    tableName: z.string().optional(),
    kv: z.any().optional(),
    keyPrefix: z.string().optional(),
    connectionString: z.string().optional(),
  }).optional(),
  providers: z.record(z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    environment: z.enum(["production", "sandbox"]).optional(),
  })).optional(),
  autoRefresh: z.union([
    z.boolean(),
    autoRefreshConfigSchema,
  ]).optional(),
  authExtractor: z.union([
    z.literal("auto"),
    z.literal("nextauth"),
    z.literal("clerk"),
    z.literal("supabase"),
    z.literal(false),
    z.any(), // Custom AuthContextExtractor
  ]).optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

export const syncEntityConfigSchema = z.object({
  schema: z.custom<z.ZodType<any>>((val) => val !== undefined && val !== null, {
    message: "Schema is required",
  }),
  table: z.string().min(1),
  strategy: z.enum(["upsert", "replace", "append", "incremental"]).optional(),
});

export const syncResultSchema = z.object({
  entity: z.string(),
  provider: z.string(),
  recordsProcessed: z.number().int().min(0),
  recordsCreated: z.number().int().min(0),
  recordsUpdated: z.number().int().min(0),
  errors: z.array(z.object({
    message: z.string(),
    record: z.any().optional(),
  })),
  startedAt: z.date(),
  completedAt: z.date(),
});

// Helper functions to validate and parse
export function validateTokenContext(context: unknown): TokenContext {
  return tokenContextSchema.parse(context);
}

export function validateConnectOptions(options: unknown): ConnectOptions {
  return connectOptionsSchema.parse(options);
}

export function validateOAuthSyncConfig(config: unknown): OAuthSyncConfig {
  return oauthSyncConfigSchema.parse(config);
}

export function validateTokenInfo(info: unknown): TokenInfo {
  return tokenInfoSchema.parse(info);
}

export function validateSyncEntityConfig(config: unknown): SyncEntityConfig {
  return syncEntityConfigSchema.parse(config);
}

export function validateSyncResult(result: unknown): SyncResult {
  return syncResultSchema.parse(result);
}

// ============================================================================
// Provider auto-detection
// ============================================================================

function detectOAuthProviders(): Record<string, ProviderConfig> {
  const providers: Record<string, ProviderConfig> = {};

  if (process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID) {
    providers.xero = {
      clientId: process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID || "",
      clientSecret: process.env.OAUTH_XERO_CLIENT_SECRET || process.env.XERO_CLIENT_SECRET || "",
      environment: (process.env.OAUTH_XERO_ENVIRONMENT || process.env.XERO_ENVIRONMENT || 'production') as "production" | "sandbox",
    };
  }

  if (process.env.OAUTH_QB_CLIENT_ID || process.env.QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID) {
    providers.quickbooks = {
      clientId: process.env.OAUTH_QB_CLIENT_ID || process.env.QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID || "",
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET || process.env.QB_CLIENT_SECRET || process.env.QUICKBOOKS_CLIENT_SECRET || "",
      environment: (process.env.OAUTH_QB_ENVIRONMENT || process.env.QB_ENVIRONMENT || 'production') as "production" | "sandbox",
    };
  }

  return providers;
}

/**
 * Auto-detect storage type from environment variables
 */
function detectStorageType(): 'supabase' | 'postgres' | 'cloudflare' {
  // Check for Supabase
  if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'supabase';
  }

  // Check for Cloudflare KV (usually set in wrangler.toml, not env)
  // This is harder to detect, so we check for Cloudflare-specific env vars
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.warn('[OAuthSync] Cloudflare detected but KV binding must be passed explicitly via storageConfig.kv');
  }

  // Fallback to Postgres if DATABASE_URL exists
  if (process.env.DATABASE_URL) {
    return 'postgres';
  }

  // Default to Supabase (most common)
  console.warn('[OAuthSync] No storage detected, defaulting to Supabase. Set SUPABASE_URL env var.');
  return 'supabase';
}

function createStorageAdapter(
  storage: string | IStorageAdapter | undefined,
  config?: any
): IStorageAdapter {
  // If storage is an adapter instance, return it
  if (storage && typeof storage !== "string") {
    return storage;
  }

  // Auto-detect storage type if not provided
  const storageType = storage || detectStorageType();

  switch (storageType) {
    case "supabase":
      return new SupabaseStorageAdapter({
        url: config?.url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        key: config?.key || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        tableName: config?.tableName || "oauth_connections",
      });
    case "cloudflare":
      if (!config?.kv) {
        throw new Error("Cloudflare KV binding required for cloudflare storage. Pass via storageConfig.kv");
      }
      return new KVStorageAdapter({
        kv: config.kv,
        keyPrefix: config?.keyPrefix || "oauth:",
      });
    case "postgres":
      return new PostgresStorageAdapter({
        connectionString: config?.connectionString || process.env.DATABASE_URL || "",
        tableName: config?.tableName || "oauth_connections",
      });
    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }
}

// ============================================================================
// Main OAuthSync Class (Stripe-like)
// ============================================================================

/**
 * OAuthSync - Stripe-like OAuth token management
 *
 * @example
 * ```typescript
 * // Initialize
 * const oauth = new OAuthSync({
 *   storage: 'supabase',
 *   autoRefresh: true
 * });
 *
 * // Get all tokens
 * const tokens = await oauth.getTokens({ orgId: 'org_123' });
 *
 * // Get specific provider token
 * const xeroToken = await oauth.xero.getToken({ orgId: 'org_123' });
 *
 * // Event handling
 * oauth.on('token.refreshed', (event) => {
 *   console.log('Token refreshed:', event.provider);
 * });
 * ```
 */
export class OAuthSync {
  private storage: IStorageAdapter;
  private manager: TokenSyncManager;
  private providers: Record<OAuthProvider, ProviderConfig>;
  private eventEmitter: OAuthEventEmitter;
  private autoRefresh: AutoRefreshService | null = null;
  private authExtractor: AuthContextExtractor | null = null;
  private config: Required<Omit<OAuthSyncConfig, 'providers' | 'autoRefresh' | 'storageConfig' | 'authExtractor'>>;

  // Provider namespaces
  public xero: ProviderNamespace;
  public quickbooks: ProviderNamespace;
  public gmail: ProviderNamespace;
  public outlook: ProviderNamespace;

  constructor(config: OAuthSyncConfig = {}) {
    // Auto-detect providers if not provided
    const providers = config.providers || detectOAuthProviders();

    // Create storage adapter (auto-detects if not provided)
    this.storage = createStorageAdapter(config.storage, config.storageConfig);

    // Convert providers to core format
    this.providers = {} as Record<OAuthProvider, ProviderConfig>;
    for (const [key, value] of Object.entries(providers)) {
      if (key === 'quickbooks' || key === 'xero' || key === 'gmail' || key === 'outlook') {
        this.providers[key as OAuthProvider] = value;
      }
    }

    // Create event emitter
    this.eventEmitter = createEventEmitter();

    // Create token manager
    this.manager = new TokenSyncManager({
      storage: this.storage,
      providers: this.providers,
      scheduler: {
        thresholdMinutes: 60,
        batchSize: 10,
        retryAttempts: config.maxRetries || 2,
        retryDelayMs: 5000,
      },
    });

    // Store config
    this.config = {
      storage: config.storage || detectStorageType(),
      maxRetries: config.maxRetries || 2,
      timeout: config.timeout || 30000,
    };

    // Setup auth context extractor (defaults to 'auto')
    const authExtractorConfig = config.authExtractor !== undefined ? config.authExtractor : 'auto';

    if (authExtractorConfig !== false) {
      if (authExtractorConfig === 'auto') {
        this.authExtractor = createAutoExtractor();
      } else if (typeof authExtractorConfig === 'string') {
        // Import specific extractor
        const { NextAuthExtractor, ClerkExtractor, SupabaseAuthExtractor } = require('./auth-context');
        switch (authExtractorConfig) {
          case 'nextauth':
            this.authExtractor = new NextAuthExtractor();
            break;
          case 'clerk':
            this.authExtractor = new ClerkExtractor();
            break;
          case 'supabase':
            this.authExtractor = new SupabaseAuthExtractor();
            break;
        }
      } else {
        // Custom extractor
        this.authExtractor = authExtractorConfig;
      }
    }

    // Setup auto-refresh (defaults to enabled with auto platform detection)
    const autoRefreshConfig = config.autoRefresh !== undefined ? config.autoRefresh : true;

    if (autoRefreshConfig !== false) {
      const finalAutoRefreshConfig = typeof autoRefreshConfig === 'object'
        ? autoRefreshConfig
        : { enabled: true, platform: 'auto' as const };

      this.autoRefresh = new AutoRefreshService(
        this.manager,
        this.eventEmitter,
        finalAutoRefreshConfig
      );

      // Start auto-refresh
      this.autoRefresh.start().catch((error) => {
        this.eventEmitter.emit('error', {
          message: 'Failed to start auto-refresh',
          code: 'AUTO_REFRESH_START_ERROR',
          stack: error instanceof Error ? error.stack : undefined,
        });
      });
    }

    // Create provider namespaces
    this.xero = this.createProviderNamespace('xero');
    this.quickbooks = this.createProviderNamespace('quickbooks');
    this.gmail = this.createProviderNamespace('gmail');
    this.outlook = this.createProviderNamespace('outlook');
  }

  /**
   * Get all available tokens for the user/team/org
   *
   * Returns a simple object with provider names as keys and access tokens as values
   *
   * @example
   * ```typescript
   * // Auto-detect user from auth (NextAuth, Clerk, Supabase, etc.)
   * const tokens = await oauth.getTokens();
   * // Returns: { xero: 'token_xxx', quickbooks: 'token_yyy' }
   *
   * // Get all tokens with explicit context
   * const tokens = await oauth.getTokens({ orgId: 'org_123' });
   *
   * // Get specific providers
   * const tokens = await oauth.getTokens({
   *   userId: 'user_123',
   *   providers: ['xero', 'quickbooks']
   * });
   *
   * // Just userId (no org or team)
   * const tokens = await oauth.getTokens({ userId: 'user_123' });
   * ```
   */
  async getTokens(context: TokenContext = {}): Promise<TokenResponse> {
    // Auto-extract auth context if enabled and context is empty/partial
    let finalContext = context;
    if (this.authExtractor && Object.keys(context).length === 0) {
      const autoContext = await this.authExtractor.extract();
      finalContext = mergeContext(context, autoContext);
    }

    const connections = await this.getConnections(finalContext);
    const tokens: TokenResponse = {};

    // Filter by providers if specified
    const filteredConns = finalContext.providers
      ? connections.filter(c => finalContext.providers!.includes(c.provider))
      : connections;

    for (const conn of filteredConns) {
      tokens[conn.provider] = conn.credentials.accessToken;
    }

    return tokens;
  }

  /**
   * Get rich token information including scopes, permissions, and expiry
   *
   * @example
   * ```typescript
   * // Auto-detect user from auth
   * const tokens = await oauth.getRichTokens();
   *
   * // Explicit context
   * const tokens = await oauth.getRichTokens({ orgId: 'org_123' });
   * // Returns:
   * // {
   * //   xero: {
   * //     token: 'token_xxx',
   * //     scopes: ['accounting.transactions', 'accounting.contacts.read'],
   * //     expiresAt: '2025-01-01T00:00:00Z',
   * //     provider: 'xero',
   * //     connectionId: 'conn_123',
   * //     metadata: { isPrimary: true, permissions: 'readWrite' }
   * //   },
   * //   quickbooks: { ... }
   * // }
   * ```
   */
  async getRichTokens(context: TokenContext = {}): Promise<RichTokenResponse> {
    // Auto-extract auth context if enabled and context is empty/partial
    let finalContext = context;
    if (this.authExtractor && Object.keys(context).length === 0) {
      const autoContext = await this.authExtractor.extract();
      finalContext = mergeContext(context, autoContext);
    }

    const connections = await this.getConnections(finalContext);
    const richTokens: RichTokenResponse = {};

    // Filter by providers if specified
    const filteredConns = finalContext.providers
      ? connections.filter(c => finalContext.providers!.includes(c.provider))
      : connections;

    for (const conn of filteredConns) {
      richTokens[conn.provider] = {
        token: conn.credentials.accessToken,
        scopes: conn.credentials.scopes || [],
        expiresAt: conn.expiresAt || '',
        provider: conn.provider,
        connectionId: conn.id,
        metadata: conn.metadata,
      };
    }

    return richTokens;
  }

  /**
   * Get token for a specific provider
   *
   * @example
   * ```typescript
   * const xeroToken = await oauth.getToken('xero', { orgId: 'org_123' });
   * ```
   */
  async getToken(
    provider: OAuthProvider,
    context: TokenContext
  ): Promise<string | null> {
    const connections = await this.getConnections(context);
    const conn = connections.find((c) => c.provider === provider);
    return conn?.credentials.accessToken || null;
  }

  /**
   * Get full connection records (for advanced use cases)
   * Uses hierarchical fallback: org → team → user
   */
  async getConnections(context: TokenContext): Promise<ConnectionRecord[]> {
    // Try org-level first
    if (context.orgId) {
      const connections = await this.storage.getConnectionsByOrgId(context.orgId);
      if (connections.length > 0) return connections;
    }

    // Fallback to team-level
    if (context.teamId) {
      const connections = await this.storage.getConnectionsByTeam(context.teamId);
      if (connections.length > 0) return connections;
    }

    // Fallback to user-level
    if (context.userId) {
      const connections = await this.storage.getConnectionsByUserId(context.userId);
      if (connections.length > 0) return connections;
    }

    return [];
  }

  /**
   * Connect a new OAuth provider
   * Returns the authorization URL to redirect the user to
   *
   * @example
   * ```typescript
   * const authUrl = await oauth.connect('xero', {
   *   orgId: 'org_123',
   *   userId: 'user_456',
   *   redirectUri: '/api/oauth/callback'
   * });
   *
   * // Redirect user to authUrl
   * ```
   */
  async connect(
    provider: OAuthProvider,
    options: ConnectOptions
  ): Promise<string> {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const providerInstance =
      provider === 'quickbooks'
        ? new QuickBooksProvider()
        : provider === 'xero'
        ? new XeroProvider()
        : null;

    if (!providerInstance) {
      throw new Error(`Provider ${provider} not supported`);
    }

    const redirectUri = options.redirectUri || providerConfig.redirectUri || `/api/oauth/${provider}/callback`;
    const state = crypto.randomUUID();

    const authUrl = providerInstance.getAuthorizationUrl(providerConfig, redirectUri, state);

    // Add context to URL
    const url = new URL(authUrl);
    if (options.orgId) url.searchParams.set('orgId', options.orgId);
    if (options.teamId) url.searchParams.set('teamId', options.teamId);
    if (options.userId) url.searchParams.set('userId', options.userId);

    return url.toString();
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * Automatically extracts auth context and stores connection
   *
   * @example
   * ```typescript
   * // In your /api/oauth/[provider]/callback route:
   * await oauth.callback('quickbooks', request);
   * ```
   */
  async callback(
    provider: OAuthProvider,
    request: Request
  ): Promise<void> {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const providerInstance =
      provider === 'quickbooks'
        ? new QuickBooksProvider()
        : provider === 'xero'
        ? new XeroProvider()
        : null;

    if (!providerInstance) {
      throw new Error(`Provider ${provider} not supported`);
    }

    // Extract code and context from callback URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const realmId = url.searchParams.get('realmId'); // QuickBooks company ID
    const state = url.searchParams.get('state');

    // Extract auth context from URL params
    let orgId = url.searchParams.get('orgId') || undefined;
    let teamId = url.searchParams.get('teamId') || undefined;
    let userId = url.searchParams.get('userId') || undefined;

    if (!code) {
      throw new Error('Authorization code missing from callback');
    }

    // Try to extract auth context from request if not in URL
    if (this.authExtractor && (!orgId && !teamId && !userId)) {
      const extractedContext = await this.authExtractor.extract();
      orgId = orgId || extractedContext.orgId;
      teamId = teamId || extractedContext.teamId;
      userId = userId || extractedContext.userId;
    }

    // Construct the redirect URI (must match what was sent in authorization)
    const redirectUri = `${url.origin}${url.pathname}`;

    // Exchange code for tokens
    const tokenResponse = await providerInstance.exchangeCodeForTokens(
      code,
      providerConfig,
      redirectUri
    );

    // Ensure teamId and userId are set (required fields)
    if (!teamId || !userId) {
      throw new Error('teamId and userId are required for OAuth connection');
    }

    // Calculate expiry timestamp
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expiresIn);

    // Store connection
    const connectionId = crypto.randomUUID();
    await this.storage.saveConnection({
      id: connectionId,
      provider,
      teamId,
      userId,
      orgId,
      credentials: {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresIn: tokenResponse.expiresIn,
        connectedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        scope: tokenResponse.scope,
        tokenType: tokenResponse.tokenType,
      },
      expiresAt: expiresAt.toISOString(),
      realmId: realmId || tokenResponse.realmId || undefined,
      tenantId: tokenResponse.tenantId || undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Emit connection.created event
    await this.eventEmitter.emit('connection.created', {
      connectionId,
      provider,
      orgId,
      teamId,
      userId,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Disconnect (remove) an OAuth connection
   *
   * @example
   * ```typescript
   * await oauth.disconnect(connectionId);
   * ```
   */
  async disconnect(connectionId: string): Promise<void> {
    const connection = await this.storage.getConnection(connectionId);

    if (connection) {
      await this.storage.deleteConnection(connectionId);

      await this.eventEmitter.emit('connection.removed', {
        connectionId,
        provider: connection.provider,
        orgId: connection.orgId,
        teamId: connection.teamId,
        userId: connection.userId,
        removedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Event handling (Stripe-style)
   *
   * @example
   * ```typescript
   * oauth.on('token.refreshed', (event) => {
   *   console.log('Refreshed:', event.provider);
   * });
   * ```
   */
  on<K extends keyof OAuthEventMap>(
    event: K,
    handler: (data: OAuthEventMap[K]) => void | Promise<void>
  ): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof OAuthEventMap>(
    event: K,
    handler: (data: OAuthEventMap[K]) => void | Promise<void>
  ): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Subscribe to event once
   */
  once<K extends keyof OAuthEventMap>(
    event: K,
    handler: (data: OAuthEventMap[K]) => void | Promise<void>
  ): void {
    this.eventEmitter.once(event, handler);
  }

  /**
   * Get OAuth handlers for API routes
   * Use in Next.js: export const { GET, POST } = oauth.handlers;
   */
  get handlers() {
    return {
      GET: this.handleGet.bind(this),
      POST: this.handlePost.bind(this),
    };
  }

  /**
   * Cleanup resources (stop auto-refresh, etc.)
   */
  destroy(): void {
    if (this.autoRefresh) {
      this.autoRefresh.stop();
    }
    this.eventEmitter.removeAllListeners();
  }

  // Private helper methods

  private createProviderNamespace(provider: OAuthProvider): ProviderNamespace {
    return {
      getToken: (context: TokenContext) => this.getToken(provider, context),
      connect: (options: ConnectOptions) => this.connect(provider, options),
      disconnect: (connectionId: string) => this.disconnect(connectionId),
    };
  }

  private async handleGet(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // GET /api/oauth/connections?orgId=...&teamId=...&userId=...
      if (pathname.includes('/connections')) {
        const orgId = url.searchParams.get('orgId') || undefined;
        const teamId = url.searchParams.get('teamId') || undefined;
        const userId = url.searchParams.get('userId') || undefined;

        const connections = await this.getConnections({ orgId, teamId, userId });
        return Response.json({ connections });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Response.json({ error: message }, { status: 500 });
    }
  }

  private async handlePost(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // POST /api/oauth/disconnect
      if (pathname.includes('/disconnect')) {
        const body = await request.json();
        const { connectionId } = body;

        if (!connectionId) {
          return Response.json({ error: 'connectionId required' }, { status: 400 });
        }

        await this.disconnect(connectionId);
        return Response.json({ success: true });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Response.json({ error: message }, { status: 500 });
    }
  }
}

/**
 * Provider namespace for cleaner API
 */
export interface ProviderNamespace {
  getToken(context: TokenContext): Promise<string | null>;
  connect(options: ConnectOptions): Promise<string>;
  disconnect(connectionId: string): Promise<void>;
}

// ============================================================================
// Re-exports for hooks and other consumers
// ============================================================================

/**
 * Re-export core types
 */
export type { ConnectionRecord, OAuthProvider, ProviderConfig as ProviderCredentials } from "@midday/oauth-sync-core";

/**
 * Data sync configuration for entities (customers, invoices, etc.)
 */
export interface SyncEntityConfig {
  schema: z.ZodType<any>;
  table: string;
  strategy?: "upsert" | "replace" | "append" | "incremental";
}

/**
 * Result of a data sync operation
 */
export interface SyncResult {
  entity: string;
  provider: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: Array<{ message: string; record?: any }>;
  startedAt: Date;
  completedAt: Date;
}

/**
 * Runtime interface for background job scheduling
 */
export interface IRuntime {
  scheduleJob(name: string, schedule: string, handler: () => Promise<void>): Promise<void>;
  cancelJob(name: string): Promise<void>;
  getScheduledJobs(): Map<string, string>;
}
