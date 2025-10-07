import type { IScheduler, SchedulerConfig } from './interface';

/**
 * Node.js scheduler using setInterval
 * Works in long-running Node.js processes
 */
export class NodeScheduler implements IScheduler {
  private interval: ReturnType<typeof setInterval> | null = null;
  private config: SchedulerConfig;
  private handler: (() => Promise<void>) | null = null;

  constructor(config: SchedulerConfig = {}) {
    this.config = config;
  }

  async schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void> {
    if (this.interval) {
      await this.cancel();
    }

    this.handler = handler;

    // Run immediately if configured
    if (this.config.cronSecret) {
      await handler();
    }

    // Schedule recurring execution
    this.interval = setInterval(async () => {
      try {
        await handler();
      } catch (error) {
        console.error('[NodeScheduler] Task execution failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`[NodeScheduler] Scheduled task to run every ${intervalMinutes} minutes`);
  }

  async cancel(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.handler = null;
      console.log('[NodeScheduler] Task cancelled');
    }
  }

  isActive(): boolean {
    return this.interval !== null;
  }
}
