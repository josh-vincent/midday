/**
 * Platform-agnostic scheduler interface
 * Allows auto-refresh to work across Node.js, serverless, and edge runtimes
 */

export interface IScheduler {
  /**
   * Schedule a recurring task
   * @param intervalMinutes How often to run the task (in minutes)
   * @param handler The function to execute
   */
  schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void>;

  /**
   * Cancel the scheduled task
   */
  cancel(): Promise<void>;

  /**
   * Check if scheduler is currently active
   */
  isActive(): boolean;
}

export interface SchedulerConfig {
  /**
   * Platform-specific configuration
   * For Node.js: none needed
   * For Vercel: cron secret
   * For Cloudflare: none needed (uses wrangler.toml)
   * For AWS: EventBridge rule ARN
   */
  platform?: 'node' | 'vercel' | 'cloudflare' | 'aws' | 'deno' | 'auto';

  /**
   * Optional cron secret for serverless platforms
   */
  cronSecret?: string;

  /**
   * Optional callback to get notified when scheduler needs external setup
   */
  onSetupRequired?: (instructions: SchedulerSetupInstructions) => void;
}

export interface SchedulerSetupInstructions {
  platform: string;
  message: string;
  code?: string;
  configFile?: string;
}
