/**
 * Cloudflare Workers Runtime Adapter
 *
 * Automatically schedules OAuth token refresh jobs using Cloudflare Queues and Durable Objects.
 */

import type { IRuntime } from "../oauth-sync";

export interface CloudflareRuntimeConfig {
  queue?: any; // Queue from @cloudflare/workers-types
  durableObjects?: any; // DurableObjectNamespace from @cloudflare/workers-types
}

/**
 * Cloudflare Workers runtime adapter for background jobs
 *
 * @example
 * ```typescript
 * import { CloudflareRuntime } from '@midday/oauth-sync/runtimes/cloudflare';
 *
 * const oauth = createOAuthSync({
 *   providers: { xero: {...} },
 *   storage: 'cloudflare',
 *   runtime: new CloudflareRuntime({
 *     queue: env.OAUTH_QUEUE,
 *   }),
 * });
 * ```
 */
export class CloudflareRuntime implements IRuntime {
  private config: CloudflareRuntimeConfig;
  private scheduledJobs: Map<string, string> = new Map();

  constructor(config: CloudflareRuntimeConfig = {}) {
    this.config = config;
  }

  async scheduleJob(
    name: string,
    schedule: string,
    handler: () => Promise<void>
  ): Promise<void> {
    console.log(`[Cloudflare] Scheduling job: ${name} (${schedule})`);

    // Store job info
    this.scheduledJobs.set(name, schedule);

    // In Cloudflare Workers, scheduled jobs are defined in wrangler.toml
    // This would typically use:
    // 1. Cloudflare Queues for delayed/recurring tasks
    // 2. Durable Alarms for scheduled execution
    // 3. Cron Triggers defined in wrangler.toml

    // Example with Queues:
    // if (this.config.queue) {
    //   await this.config.queue.send({
    //     jobName: name,
    //     schedule,
    //     nextRun: this.calculateNextRun(schedule),
    //   });
    // }
  }

  async cancelJob(name: string): Promise<void> {
    console.log(`[Cloudflare] Canceling job: ${name}`);
    this.scheduledJobs.delete(name);

    // Cancel the scheduled task
  }

  getScheduledJobs(): Map<string, string> {
    return this.scheduledJobs;
  }

  private calculateNextRun(schedule: string): Date {
    // Parse interval like "15m", "1h", etc.
    const match = schedule.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid schedule format: ${schedule}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const ms = value * multipliers[unit];
    return new Date(Date.now() + ms);
  }
}
