/**
 * Platform-agnostic scheduler system for OAuth token auto-refresh
 *
 * Supports:
 * - Node.js (setInterval)
 * - Vercel (Cron Jobs)
 * - Cloudflare Workers (Scheduled Events)
 * - AWS Lambda (EventBridge)
 * - Deno / Supabase Edge Functions (Deno.cron / pg_cron)
 */

export type { IScheduler, SchedulerConfig, SchedulerSetupInstructions } from './interface';
export { NodeScheduler } from './node';
export { VercelScheduler } from './vercel';
export { CloudflareScheduler } from './cloudflare';
export { AWSScheduler } from './aws';
export { DenoScheduler } from './deno';
export {
  createScheduler,
  getPlatformName,
  supportsNativeScheduling,
} from './factory';
