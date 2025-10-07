// Core manager
export { TokenSyncManager } from "./core/token-manager";
export type { TokenSyncManagerConfig } from "./core/token-manager";

// Types
export type {
  OAuthProvider,
  TokenConfig,
  ProviderConfig,
  ConnectionRecord,
  RefreshedTokens,
  TokenRefreshResult,
  SchedulerConfig,
  LockConfig,
} from "./core/types";

export {
  tokenConfigSchema,
  providerConfigSchema,
  refreshedTokensSchema,
} from "./core/types";

// Providers
export { BaseOAuthProvider, getProvider } from "./providers";
export type { IOAuthProvider, TokenExchangeResponse } from "./providers";
export { QuickBooksProvider } from "./providers/quickbooks";
export { XeroProvider } from "./providers/xero";
export { GoogleProvider } from "./providers/google";
export { OutlookProvider } from "./providers/outlook";

// Storage
export { BaseStorageAdapter } from "./storage";
export type { IStorageAdapter } from "./storage";
export { SupabaseStorageAdapter } from "./storage/supabase";
export { KVStorageAdapter } from "./storage/kv";
export { PostgresStorageAdapter } from "./storage/postgres";

// Event system
export { OAuthEventEmitter, createEventEmitter } from "./utils/events";
export type {
  OAuthEventMap,
  TokenRefreshedEvent,
  TokenExpiredEvent,
  TokenRefreshFailedEvent,
  ConnectionCreatedEvent,
  ConnectionRemovedEvent,
  ErrorEvent,
} from "./utils/events";

// Retry utilities
export { retryWithBackoff, smartRetry, retryUntil, isRetryableError } from "./utils/retry";
export type { RetryOptions } from "./utils/retry";
