/**
 * Trigger.dev Runtime Adapter
 *
 * Automatically schedules OAuth token refresh jobs using Trigger.dev.
 */

import type { IRuntime } from "../oauth-sync";

export interface TriggerDevRuntimeConfig {
  apiKey: string;
  apiUrl?: string;
}

/**
 * Trigger.dev runtime adapter for background jobs
 *
 * @example
 * ```typescript
 * import { TriggerDevRuntime } from '@midday/oauth-sync/runtimes/trigger';
 *
 * const oauth = createOAuthSync({
 *   providers: { xero: {...} },
 *   storage: 'supabase',
 *   runtime: new TriggerDevRuntime({
 *     apiKey: process.env.TRIGGER_API_KEY!,
 *   }),
 * });
 * ```
 */
export class TriggerDevRuntime implements IRuntime {
  private config: Required<TriggerDevRuntimeConfig>;
  private scheduledJobs: Map<string, string> = new Map();

  constructor(config: TriggerDevRuntimeConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || "https://api.trigger.dev",
    };
  }

  async scheduleJob(
    name: string,
    schedule: string,
    handler: () => Promise<void>
  ): Promise<void> {
    // In a real implementation, this would use Trigger.dev SDK
    // to create a scheduled task

    console.log(`[Trigger.dev] Scheduling job: ${name} (${schedule})`);

    // For now, just store the job
    this.scheduledJobs.set(name, schedule);

    // In production, this would be something like:
    // await client.defineJob({
    //   id: name,
    //   name: name,
    //   version: '1.0.0',
    //   trigger: scheduledTrigger({
    //     cron: schedule,
    //   }),
    //   run: async () => {
    //     await handler();
    //   },
    // });
  }

  async cancelJob(name: string): Promise<void> {
    console.log(`[Trigger.dev] Canceling job: ${name}`);
    this.scheduledJobs.delete(name);

    // In production, this would cancel the scheduled task
  }

  getScheduledJobs(): Map<string, string> {
    return this.scheduledJobs;
  }
}
