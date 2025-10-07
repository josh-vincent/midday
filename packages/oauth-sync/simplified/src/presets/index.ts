/**
 * Configuration Presets for OAuth Sync
 *
 * Pre-configured setups for common deployment scenarios.
 */

import type { OAuthSyncConfig } from "../oauth-sync";

// ============================================================================
// Supabase + Trigger.dev Preset
// ============================================================================

export interface SupabasePresetConfig {
  supabaseUrl: string;
  supabaseKey: string;
  triggerApiKey: string;
  autoRefreshInterval?: string;
  autoRefreshThreshold?: number;
}

/**
 * Preset for Supabase storage with Trigger.dev background jobs
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   ...SupabasePreset({
 *     supabaseUrl: process.env.SUPABASE_URL!,
 *     supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
 *     triggerApiKey: process.env.TRIGGER_API_KEY!,
 *   }),
 *   providers: { xero: {...} },
 *   sync: { customers: {...} },
 * });
 * ```
 */
export function SupabasePreset(
  config: SupabasePresetConfig
): Partial<OAuthSyncConfig> {
  return {
    storage: "supabase",
    autoRefresh: {
      enabled: true,
      intervalMinutes: 15,
      thresholdMinutes: config.autoRefreshThreshold || 30,
    },
    // Runtime will be added when Trigger.dev runtime is imported
  };
}

// ============================================================================
// Cloudflare Workers Preset
// ============================================================================

export interface CloudflarePresetConfig {
  kvNamespace: any; // KVNamespace from @cloudflare/workers-types
  d1Database?: any; // D1Database from @cloudflare/workers-types
  queue?: any; // Queue from @cloudflare/workers-types
  autoRefreshInterval?: string;
  autoRefreshThreshold?: number;
}

/**
 * Preset for Cloudflare Workers with KV storage
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   ...CloudflarePreset({
 *     kvNamespace: env.KV,
 *     d1Database: env.DB,
 *     queue: env.SYNC_QUEUE,
 *   }),
 *   providers: { xero: {...} },
 *   sync: { customers: {...} },
 * });
 * ```
 */
export function CloudflarePreset(
  config: CloudflarePresetConfig
): Partial<OAuthSyncConfig> {
  return {
    storage: "cloudflare",
    autoRefresh: {
      enabled: true,
      intervalMinutes: 15,
      thresholdMinutes: config.autoRefreshThreshold || 30,
    },
    // Runtime will be added when Cloudflare runtime is imported
  };
}

// ============================================================================
// PostgreSQL Preset
// ============================================================================

export interface PostgresPresetConfig {
  connectionString: string;
  autoRefreshInterval?: string;
  autoRefreshThreshold?: number;
}

/**
 * Preset for PostgreSQL storage
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   ...PostgresPreset({
 *     connectionString: process.env.DATABASE_URL!,
 *   }),
 *   providers: { xero: {...} },
 *   sync: { customers: {...} },
 * });
 * ```
 */
export function PostgresPreset(
  config: PostgresPresetConfig
): Partial<OAuthSyncConfig> {
  return {
    storage: "postgres",
    autoRefresh: {
      enabled: true,
      intervalMinutes: 15,
      thresholdMinutes: config.autoRefreshThreshold || 30,
    },
  };
}

// ============================================================================
// Development Preset
// ============================================================================

export interface DevelopmentPresetConfig {
  autoRefreshInterval?: string;
  autoRefreshThreshold?: number;
}

/**
 * Preset for local development with localStorage
 *
 * WARNING: This is for development only! Never use in production.
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   ...DevelopmentPreset(),
 *   providers: { xero: {...} },
 * });
 * ```
 */
export function DevelopmentPreset(
  config: DevelopmentPresetConfig = {}
): Partial<OAuthSyncConfig> {
  // Import LocalStorageAdapter dynamically
  // This will be implemented when we have the adapter
  return {
    // storage: new LocalStorageAdapter(), // TODO: Implement
    autoRefresh: {
      enabled: true,
      intervalMinutes: 15,
      thresholdMinutes: config.autoRefreshThreshold || 30,
    },
  };
}
