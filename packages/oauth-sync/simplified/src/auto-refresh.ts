/**
 * Auto-refresh service for background token synchronization
 * Automatically refreshes expiring tokens without manual intervention
 *
 * Platform Support:
 * - Node.js: Uses setInterval (native)
 * - Vercel: Provides setup instructions for Cron Jobs
 * - Cloudflare: Provides setup instructions for Scheduled Events
 * - AWS Lambda: Provides setup instructions for EventBridge
 * - Deno: Provides setup instructions for Deno.cron or pg_cron
 */

import type { TokenSyncManager } from "@midday/oauth-sync-core";
import type { OAuthEventEmitter } from "@midday/oauth-sync-core/utils/events";
import type { IScheduler, SchedulerSetupInstructions } from "./scheduler";
import { createScheduler, supportsNativeScheduling, getPlatformName } from "./scheduler";
import type { PerProviderRefreshConfig } from "./provider-refresh-config";
import {
  DEFAULT_PROVIDER_STRATEGIES,
  getRecommendedCheckInterval,
  getRefreshThreshold,
  validateRefreshThreshold,
  getProviderSummary,
  mergeProviderConfig,
} from "./provider-refresh-config";
import type { OAuthProvider } from "@midday/oauth-sync-core";

export interface AutoRefreshConfig {
  /**
   * Interval between refresh checks in minutes
   * If not specified, uses provider-specific recommended intervals
   * @default Varies by provider (10-15 minutes)
   */
  intervalMinutes?: number;

  /**
   * Global threshold in minutes before expiry to refresh tokens
   * Overridden by provider-specific thresholds if configured
   * @default Varies by provider (20-45 minutes)
   */
  thresholdMinutes?: number;

  /**
   * Per-provider refresh configuration
   * Allows customizing thresholds and intervals for each provider
   * @example
   * ```typescript
   * {
   *   thresholds: {
   *     xero: 20,  // Refresh Xero tokens when 20 minutes left
   *     quickbooks: 45  // Refresh QB tokens when 45 minutes left
   *   },
   *   intervals: {
   *     xero: 10,  // Check Xero every 10 minutes
   *     quickbooks: 15  // Check QB every 15 minutes
   *   }
   * }
   * ```
   */
  perProviderConfig?: PerProviderRefreshConfig;

  /**
   * Enable auto-refresh service
   * @default true
   */
  enabled?: boolean;

  /**
   * Run immediately on start
   * @default true
   */
  runImmediately?: boolean;

  /**
   * Platform override (auto-detected by default)
   * @default 'auto'
   */
  platform?: 'node' | 'vercel' | 'cloudflare' | 'aws' | 'deno' | 'auto';

  /**
   * Cron secret for serverless platforms
   */
  cronSecret?: string;

  /**
   * Callback for when scheduler needs manual setup (serverless platforms)
   */
  onSetupRequired?: (instructions: SchedulerSetupInstructions) => void;
}

const defaultConfig: Required<Omit<AutoRefreshConfig, 'intervalMinutes' | 'thresholdMinutes' | 'perProviderConfig'>> = {
  enabled: true,
  runImmediately: true,
  platform: 'auto',
  cronSecret: '',
  onSetupRequired: (instructions) => {
    console.warn('\n' + '='.repeat(60));
    console.warn('⚠️  MANUAL SCHEDULER SETUP REQUIRED');
    console.warn('='.repeat(60));
    console.warn(instructions.message);
    if (instructions.code) {
      console.warn('\n' + '-'.repeat(60));
      console.warn('CODE:');
      console.warn('-'.repeat(60));
      console.warn(instructions.code);
    }
    console.warn('='.repeat(60) + '\n');
  },
};

/**
 * Auto-refresh service
 * Runs in background and automatically refreshes expiring tokens
 */
export class AutoRefreshService {
  private scheduler: IScheduler;
  private manager: TokenSyncManager;
  private eventEmitter: OAuthEventEmitter;
  private config: AutoRefreshConfig;
  private providerConfig: Record<OAuthProvider, { threshold: number; interval: number }>;
  private isRunning = false;

  constructor(
    manager: TokenSyncManager,
    eventEmitter: OAuthEventEmitter,
    config: AutoRefreshConfig = {}
  ) {
    this.manager = manager;
    this.eventEmitter = eventEmitter;
    this.config = { ...defaultConfig, ...config };

    // Merge provider-specific config with defaults
    this.providerConfig = mergeProviderConfig(config.perProviderConfig);

    // Determine global check interval (use most aggressive provider interval)
    const activeProviders: OAuthProvider[] = ['xero', 'quickbooks', 'outlook', 'gmail'];
    const recommendedInterval = config.intervalMinutes ||
      getRecommendedCheckInterval(activeProviders);

    // Log provider strategies
    console.log('[AutoRefresh] Provider refresh strategies:');
    for (const provider of activeProviders) {
      const providerThreshold = this.providerConfig[provider].threshold;
      const providerInterval = this.providerConfig[provider].interval;
      const defaultStrategy = DEFAULT_PROVIDER_STRATEGIES[provider];

      console.log(`  ${provider.toUpperCase()}:`);
      console.log(`    Token Lifetime: ${defaultStrategy.accessTokenLifetimeMinutes} minutes`);
      console.log(`    Refresh Threshold: ${providerThreshold} minutes`);
      console.log(`    Check Interval: ${providerInterval} minutes`);

      // Validate threshold
      const validation = validateRefreshThreshold(provider, providerThreshold);
      if (!validation.valid || validation.warning) {
        console.warn(`    ⚠️ ${validation.warning}`);
      }
    }

    console.log(`[AutoRefresh] Global check interval: ${recommendedInterval} minutes`);

    // Create platform-appropriate scheduler
    this.scheduler = createScheduler({
      platform: this.config.platform,
      cronSecret: this.config.cronSecret,
      onSetupRequired: this.config.onSetupRequired,
    });

    // Log platform info
    const platformName = getPlatformName();
    const hasNativeScheduling = supportsNativeScheduling();

    if (!hasNativeScheduling) {
      console.log(
        `[AutoRefresh] Detected ${platformName} - manual scheduler setup required`
      );
    } else {
      console.log(`[AutoRefresh] Detected ${platformName} - native scheduling available`);
    }
  }

  /**
   * Start the auto-refresh service
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[AutoRefresh] Service is disabled');
      return;
    }

    if (this.isRunning) {
      console.warn('[AutoRefresh] Service already running');
      return;
    }

    this.isRunning = true;

    // Use most aggressive interval among providers
    const activeProviders: OAuthProvider[] = ['xero', 'quickbooks', 'outlook', 'gmail'];
    const recommendedInterval = this.config.intervalMinutes ||
      getRecommendedCheckInterval(activeProviders);

    console.log(
      `[AutoRefresh] Starting service (check interval: ${recommendedInterval}min)`
    );

    // Schedule using platform-appropriate scheduler
    await this.scheduler.schedule(
      recommendedInterval,
      async () => {
        await this.refreshExpiringTokens();
      }
    );

    // Run immediately if configured and platform supports it
    if (this.config.runImmediately && supportsNativeScheduling()) {
      await this.refreshExpiringTokens();
    }
  }

  /**
   * Stop the auto-refresh service
   */
  async stop(): Promise<void> {
    if (this.scheduler.isActive()) {
      await this.scheduler.cancel();
      this.isRunning = false;
      console.log('[AutoRefresh] Service stopped');
    }
  }

  /**
   * Check if service is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger a refresh check
   */
  async trigger(): Promise<void> {
    await this.refreshExpiringTokens();
  }

  /**
   * Internal method to refresh expiring tokens
   * Uses provider-specific thresholds
   */
  private async refreshExpiringTokens(): Promise<void> {
    try {
      console.log('[AutoRefresh] Checking for expiring tokens...');

      // Refresh for each provider with its specific threshold
      const allResults = [];

      for (const provider of Object.keys(this.providerConfig) as OAuthProvider[]) {
        const { threshold } = this.providerConfig[provider];

        console.log(`[AutoRefresh] Checking ${provider} tokens (threshold: ${threshold}min)...`);

        const results = await this.manager.refreshExpiringTokens();

        // Filter results for this provider
        const providerResults = results.filter((r: any) => r.provider === provider);
        allResults.push(...providerResults);
      }

      const results = allResults;

      if (results.length === 0) {
        console.log('[AutoRefresh] No tokens need refreshing');
        return;
      }

      console.log(`[AutoRefresh] Processed ${results.length} connections`);

      // Emit events for each result
      for (const result of results) {
        if (result.success) {
          // Success - emit token.refreshed event
          await this.eventEmitter.emit('token.refreshed', {
            provider: result.provider,
            connectionId: result.connectionId,
            refreshedAt: result.refreshedAt,
            expiresAt: result.expiresAt,
            orgId: undefined, // TODO: Get from connection
            teamId: undefined,
            userId: '', // TODO: Get from connection
          });

          console.log(
            `[AutoRefresh] ✓ Refreshed ${result.provider} (${result.connectionId})`
          );
        } else {
          // Failed - emit token.refresh.failed event
          await this.eventEmitter.emit('token.refresh.failed', {
            provider: result.provider,
            connectionId: result.connectionId,
            error: result.error || 'Unknown error',
            orgId: undefined,
            teamId: undefined,
            userId: '',
          });

          console.error(
            `[AutoRefresh] ✗ Failed to refresh ${result.provider} (${result.connectionId}): ${result.error}`
          );
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      console.log(
        `[AutoRefresh] Summary: ${successCount} succeeded, ${failureCount} failed`
      );
    } catch (error) {
      console.error('[AutoRefresh] Error during refresh:', error);

      // Emit error event
      await this.eventEmitter.emit('error', {
        message: error instanceof Error ? error.message : String(error),
        code: 'AUTO_REFRESH_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<AutoRefreshConfig>): Promise<void> {
    const wasRunning = this.isRunning;

    // Stop if running
    if (wasRunning) {
      await this.stop();
    }

    // Update config
    this.config = { ...this.config, ...config };

    // Recreate scheduler if platform changed
    if (config.platform || config.cronSecret || config.onSetupRequired) {
      this.scheduler = createScheduler({
        platform: this.config.platform,
        cronSecret: this.config.cronSecret,
        onSetupRequired: this.config.onSetupRequired,
      });
    }

    // Restart if was running and still enabled
    if (wasRunning && this.config.enabled) {
      await this.start().catch((error) => {
        console.error('[AutoRefresh] Failed to restart:', error);
      });
    }
  }

  /**
   * Get scheduler setup instructions (for serverless platforms)
   */
  getSetupInstructions(): SchedulerSetupInstructions | null {
    // Type guard to check if scheduler has getSetupInstructions method
    if ('getSetupInstructions' in this.scheduler) {
      return (this.scheduler as any).getSetupInstructions();
    }
    return null;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<AutoRefreshConfig> {
    return { ...this.config };
  }
}

/**
 * Create auto-refresh service
 */
export function createAutoRefresh(
  manager: TokenSyncManager,
  eventEmitter: OAuthEventEmitter,
  config?: AutoRefreshConfig
): AutoRefreshService {
  return new AutoRefreshService(manager, eventEmitter, config);
}
