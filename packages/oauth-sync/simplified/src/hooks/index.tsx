/**
 * React Hooks for OAuth Sync
 *
 * Simple hooks for OAuth connection management and data synchronization.
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type {
  ConnectionRecord,
  OAuthProvider,
  ProviderCredentials,
  SyncEntityConfig,
  SyncResult,
} from "../oauth-sync";

// ============================================================================
// Context
// ============================================================================

interface OAuthContextValue {
  connections: ConnectionRecord[];
  isLoading: boolean;
  error: Error | null;
  config: OAuthProviderConfig;

  // Actions
  connect: (provider: OAuthProvider) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  refresh: (connectionId: string) => Promise<void>;
  sync: (entity: string, options?: SyncOptions) => Promise<SyncResult[]>;
  reload: () => Promise<void>;
}

const OAuthContext = createContext<OAuthContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface OAuthProviderConfig {
  config: Record<string, ProviderCredentials>;
  storage: "supabase" | "cloudflare" | "postgres";
  apiUrl?: string;
  sync?: Record<string, SyncEntityConfig>;
  onConnect?: (connection: ConnectionRecord) => void | Promise<void>;
  onSync?: (result: SyncResult) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface OAuthProviderProps extends OAuthProviderConfig {
  children: React.ReactNode;
}

export function OAuthProvider({
  children,
  config,
  storage,
  apiUrl = "/api/oauth",
  sync,
  onConnect,
  onSync,
  onError,
}: OAuthProviderProps) {
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const providerConfig: OAuthProviderConfig = {
    config,
    storage,
    apiUrl,
    sync,
    onConnect,
    onSync,
    onError,
  };

  // Load connections on mount
  const loadConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/connections`);
      if (!response.ok) {
        throw new Error(`Failed to load connections: ${response.statusText}`);
      }
      const data = await response.json();
      setConnections(data.connections || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        await onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, onError]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Connect to provider
  const connect = useCallback(
    async (provider: OAuthProvider) => {
      try {
        // Redirect to authorization URL
        window.location.href = `${apiUrl}/${provider}/authorize`;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          await onError(error);
        }
      }
    },
    [apiUrl, onError]
  );

  // Disconnect provider
  const disconnect = useCallback(
    async (connectionId: string) => {
      try {
        const response = await fetch(`${apiUrl}/disconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to disconnect: ${response.statusText}`);
        }

        await loadConnections();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          await onError(error);
        }
      }
    },
    [apiUrl, loadConnections, onError]
  );

  // Refresh token
  const refresh = useCallback(
    async (connectionId: string) => {
      try {
        const response = await fetch(`${apiUrl}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh: ${response.statusText}`);
        }

        await loadConnections();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          await onError(error);
        }
      }
    },
    [apiUrl, loadConnections, onError]
  );

  // Sync data
  const syncData = useCallback(
    async (entity: string, options?: SyncOptions): Promise<SyncResult[]> => {
      try {
        const response = await fetch(`${apiUrl}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity, ...options }),
        });

        if (!response.ok) {
          throw new Error(`Failed to sync: ${response.statusText}`);
        }

        const data = await response.json();

        if (onSync && data.results) {
          for (const result of data.results) {
            await onSync(result);
          }
        }

        return data.results || [];
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          await onError(error);
        }
        throw error;
      }
    },
    [apiUrl, onSync, onError]
  );

  const value: OAuthContextValue = {
    connections,
    isLoading,
    error,
    config: providerConfig,
    connect,
    disconnect,
    refresh,
    sync: syncData,
    reload: loadConnections,
  };

  return <OAuthContext.Provider value={value}>{children}</OAuthContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

function useOAuthContext() {
  const context = useContext(OAuthContext);
  if (!context) {
    throw new Error("useOAuth* hooks must be used within OAuthProvider");
  }
  return context;
}

/**
 * Core OAuth connection management hook
 *
 * @example
 * ```typescript
 * const { connect, disconnect, connections, isConnected } = useOAuthConnection();
 *
 * await connect('xero');
 * const connected = isConnected('xero');
 * await disconnect('conn_123');
 * ```
 */
export function useOAuthConnection(provider?: OAuthProvider) {
  const context = useOAuthContext();

  const filteredConnections = provider
    ? context.connections.filter((c) => c.provider === provider)
    : context.connections;

  const isConnected = useCallback(
    (checkProvider: OAuthProvider) => {
      return context.connections.some((c) => c.provider === checkProvider);
    },
    [context.connections]
  );

  return {
    connections: filteredConnections,
    isConnected,
    isConnecting: context.isLoading,
    error: context.error,
    connect: context.connect,
    disconnect: context.disconnect,
    refresh: context.refresh,
  };
}

/**
 * Automatic data synchronization hook
 *
 * @example
 * ```typescript
 * const { sync, syncing, lastSync, data } = useOAuthSync('customers', {
 *   provider: 'xero',
 *   interval: '6h',
 *   autoSync: true,
 * });
 * ```
 */
export interface SyncOptions {
  provider?: OAuthProvider;
  interval?: string;
  autoSync?: boolean;
  force?: boolean;
  onSuccess?: (data: SyncResult[]) => void;
  onError?: (error: Error) => void;
}

export function useOAuthSync(entity: string, options: SyncOptions = {}) {
  const context = useOAuthContext();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);

      const results = await context.sync(entity, {
        force: options.force,
      });

      setData(results);
      setLastSync(new Date());

      if (options.onSuccess) {
        options.onSuccess(results);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setSyncing(false);
    }
  }, [context, entity, options]);

  // Auto-sync on mount
  useEffect(() => {
    if (options.autoSync) {
      sync();
    }
  }, [options.autoSync, sync]);

  // Setup interval sync
  useEffect(() => {
    if (options.interval) {
      const ms = parseInterval(options.interval);
      intervalRef.current = setInterval(sync, ms);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    return undefined;
  }, [options.interval, sync]);

  return {
    sync,
    syncing,
    lastSync,
    data,
    error,
  };
}

/**
 * Connection status and health hook
 *
 * @example
 * ```typescript
 * const { status, expiresAt, needsRefresh } = useOAuthStatus('xero');
 * ```
 */
export function useOAuthStatus(provider: OAuthProvider) {
  const context = useOAuthContext();

  const connection = context.connections.find((c) => c.provider === provider);

  if (!connection || !connection.expiresAt) {
    return {
      status: "disconnected" as const,
      expiresAt: null,
      expiresIn: null,
      needsRefresh: false,
    };
  }

  const now = Date.now();
  const expiresAt = new Date(connection.expiresAt);
  const expiresIn = Math.floor((expiresAt.getTime() - now) / 1000 / 60);

  let status: "active" | "expiring" | "expired" | "disconnected";
  if (expiresIn > 30) {
    status = "active";
  } else if (expiresIn > 0) {
    status = "expiring";
  } else {
    status = "expired";
  }

  return {
    status,
    expiresAt,
    expiresIn,
    needsRefresh: expiresIn <= 30,
  };
}

/**
 * Get all connections for current team
 *
 * @example
 * ```typescript
 * const connections = useOAuthConnections();
 * ```
 */
export function useOAuthConnections() {
  const context = useOAuthContext();
  return context.connections;
}

/**
 * All actions in one object
 *
 * @example
 * ```typescript
 * const actions = useOAuthActions();
 * await actions.connect('xero');
 * await actions.sync('customers');
 * ```
 */
export function useOAuthActions() {
  const context = useOAuthContext();

  return {
    connect: context.connect,
    disconnect: context.disconnect,
    refresh: context.refresh,
    sync: context.sync,
    reload: context.reload,
  };
}

// ============================================================================
// Utilities
// ============================================================================

function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid interval format: ${interval}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
