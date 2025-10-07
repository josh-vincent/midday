import type { IScheduler, SchedulerConfig, SchedulerSetupInstructions } from './interface';

/**
 * Cloudflare scheduler using Cloudflare Workers Scheduled Events
 * Requires manual setup in wrangler.toml
 */
export class CloudflareScheduler implements IScheduler {
  private config: SchedulerConfig;
  private isScheduled = false;
  private setupInstructions: SchedulerSetupInstructions | null = null;

  constructor(config: SchedulerConfig = {}) {
    this.config = config;
  }

  async schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void> {
    const cronExpression = this.intervalToCron(intervalMinutes);

    this.setupInstructions = {
      platform: 'Cloudflare Workers',
      message: `
⚠️ Cloudflare Workers Scheduled Events Setup Required

Add this to your wrangler.toml:

[triggers]
crons = ["${cronExpression}"]

Then add this to your worker:

File: src/index.ts
      `.trim(),
      code: `
import { oauth } from './oauth';

export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Trigger token refresh
    await oauth.refreshExpiringTokens();
  },

  async fetch(request: Request, env: Env) {
    // Your existing fetch handler
  }
}
      `.trim(),
      configFile: 'wrangler.toml'
    };

    if (this.config.onSetupRequired) {
      this.config.onSetupRequired(this.setupInstructions);
    } else {
      console.warn(this.setupInstructions.message);
      console.warn('\nWorker Code:');
      console.warn(this.setupInstructions.code);
    }

    this.isScheduled = true;
  }

  async cancel(): Promise<void> {
    this.isScheduled = false;
    console.log('[CloudflareScheduler] Scheduler cancelled (remove wrangler.toml cron config)');
  }

  isActive(): boolean {
    return this.isScheduled;
  }

  private intervalToCron(minutes: number): string {
    if (minutes < 60) {
      return `*/${minutes} * * * *`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `0 */${hours} * * *`;
    }
  }

  getSetupInstructions(): SchedulerSetupInstructions | null {
    return this.setupInstructions;
  }
}
