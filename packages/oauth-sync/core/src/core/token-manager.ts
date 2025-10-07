import type { IStorageAdapter } from "../storage/base";
import type { IOAuthProvider } from "../providers/base";
import { getProvider } from "../providers";
import type {
  ProviderConfig,
  SchedulerConfig,
  TokenRefreshResult,
  OAuthProvider,
} from "./types";

/**
 * Configuration for TokenSyncManager
 */
export interface TokenSyncManagerConfig {
  storage: IStorageAdapter;
  providers: Record<OAuthProvider, ProviderConfig>;
  scheduler?: Partial<SchedulerConfig>;
  logger?: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
  };
}

/**
 * Core token synchronization manager
 * Runtime-agnostic - works in Node.js, Deno, Cloudflare Workers, etc.
 */
export class TokenSyncManager {
  private storage: IStorageAdapter;
  private providers: Record<OAuthProvider, ProviderConfig>;
  private schedulerConfig: SchedulerConfig;
  private logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
  };

  constructor(config: TokenSyncManagerConfig) {
    this.storage = config.storage;
    this.providers = config.providers;
    this.schedulerConfig = {
      thresholdMinutes: config.scheduler?.thresholdMinutes || 60,
      batchSize: config.scheduler?.batchSize || 10,
      retryAttempts: config.scheduler?.retryAttempts || 3,
      retryDelayMs: config.scheduler?.retryDelayMs || 5000,
    };
    this.logger = config.logger || {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  /**
   * Refresh all expiring tokens
   * Main method for scheduled tasks
   */
  async refreshExpiringTokens(): Promise<TokenRefreshResult[]> {
    this.logger.info("Starting token refresh process", {
      thresholdMinutes: this.schedulerConfig.thresholdMinutes,
    });

    const startTime = Date.now();
    const results: TokenRefreshResult[] = [];

    try {
      // Get connections that are expiring
      const connections = await this.storage.getExpiringConnections(
        this.schedulerConfig.thresholdMinutes
      );

      this.logger.info(`Found ${connections.length} connections to refresh`);

      if (connections.length === 0) {
        return results;
      }

      // Process connections in batches
      const batchSize = this.schedulerConfig.batchSize || 10;
      for (let i = 0; i < connections.length; i += batchSize) {
        const batch = connections.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map((connection) =>
            this.refreshConnection(connection.id, connection.provider)
          )
        );

        for (const result of batchResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
          } else {
            this.logger.error("Batch refresh failed", {
              error: result.reason,
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.logger.info("Token refresh completed", {
        duration,
        total: results.length,
        successful,
        failed,
      });

      return results;
    } catch (error) {
      this.logger.error("Token refresh process failed", { error });
      throw error;
    }
  }

  /**
   * Refresh a specific connection's tokens
   */
  async refreshConnection(
    connectionId: string,
    provider: OAuthProvider
  ): Promise<TokenRefreshResult> {
    const startTime = Date.now();

    try {
      // Acquire lock to prevent concurrent refreshes
      const lockAcquired = await this.storage.acquireLock(
        connectionId,
        60000 // 60 second lock
      );

      if (!lockAcquired) {
        this.logger.debug("Lock already held for connection", { connectionId });
        return {
          connectionId,
          provider,
          success: false,
          refreshedAt: new Date().toISOString(),
          expiresAt: "",
          error: "Lock already held",
        };
      }

      try {
        // Get connection details
        const connection = await this.storage.getConnection(connectionId);
        if (!connection) {
          throw new Error(`Connection ${connectionId} not found`);
        }

        // Get provider instance
        const providerInstance = getProvider(provider);

        // Check if token actually needs refresh
        if (
          !providerInstance.isTokenExpiring(
            connection.credentials,
            this.schedulerConfig.thresholdMinutes
          )
        ) {
          this.logger.debug("Token not yet expiring", {
            connectionId,
            provider,
          });
          return {
            connectionId,
            provider,
            success: true,
            refreshedAt: new Date().toISOString(),
            expiresAt: connection.expiresAt || "",
            error: "Token not yet expiring",
          };
        }

        // Get provider config
        const providerConfig = this.providers[provider];
        if (!providerConfig) {
          throw new Error(`Provider config not found for ${provider}`);
        }

        // Refresh the token with retry logic
        const refreshedTokens = await this.retryOperation(
          () =>
            providerInstance.refreshToken(
              connection.credentials,
              providerConfig
            ),
          this.schedulerConfig.retryAttempts || 3,
          this.schedulerConfig.retryDelayMs || 5000
        );

        // Calculate new expiration
        const expiresAt = providerInstance.calculateExpiresAt(
          refreshedTokens.expiresIn
        );

        // Update storage
        await this.storage.updateTokens(connectionId, {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          expiresIn: refreshedTokens.expiresIn,
          expiresAt,
        });

        const duration = Date.now() - startTime;
        this.logger.info("Token refreshed successfully", {
          connectionId,
          provider,
          duration,
          expiresAt,
        });

        return {
          connectionId,
          provider,
          success: true,
          refreshedAt: new Date().toISOString(),
          expiresAt,
        };
      } finally {
        // Always release lock
        await this.storage.releaseLock(connectionId);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error("Token refresh failed", {
        connectionId,
        provider,
        error: errorMessage,
      });

      return {
        connectionId,
        provider,
        success: false,
        refreshedAt: new Date().toISOString(),
        expiresAt: "",
        error: errorMessage,
      };
    }
  }

  /**
   * Refresh tokens for a specific team
   */
  async refreshTeamTokens(teamId: string): Promise<TokenRefreshResult[]> {
    this.logger.info("Refreshing tokens for team", { teamId });

    const connections = await this.storage.getConnectionsByTeam(teamId);
    const results: TokenRefreshResult[] = [];

    for (const connection of connections) {
      const result = await this.refreshConnection(
        connection.id,
        connection.provider
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Check token status without refreshing
   */
  async checkTokenStatus(connectionId: string): Promise<{
    needsRefresh: boolean;
    expiresAt: string | null;
    minutesUntilExpiry: number | null;
  }> {
    const connection = await this.storage.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const provider = getProvider(connection.provider);
    const needsRefresh = provider.isTokenExpiring(
      connection.credentials,
      this.schedulerConfig.thresholdMinutes
    );

    let minutesUntilExpiry: number | null = null;
    if (connection.expiresAt) {
      const expiresAt = new Date(connection.expiresAt).getTime();
      const now = Date.now();
      minutesUntilExpiry = Math.max(0, Math.floor((expiresAt - now) / 60000));
    }

    return {
      needsRefresh,
      expiresAt: connection.expiresAt || null,
      minutesUntilExpiry,
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    delayMs: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts) {
          const delay = delayMs * Math.pow(2, attempt - 1);
          this.logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
            error: lastError.message,
            nextDelay: delay,
          });

          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
