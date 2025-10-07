import type { IScheduler, SchedulerConfig, SchedulerSetupInstructions } from './interface';

/**
 * Vercel scheduler using Vercel Cron Jobs
 * Requires manual setup in vercel.json
 */
export class VercelScheduler implements IScheduler {
  private config: SchedulerConfig;
  private isScheduled = false;
  private setupInstructions: SchedulerSetupInstructions | null = null;

  constructor(config: SchedulerConfig = {}) {
    this.config = config;
  }

  async schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void> {
    // Vercel cron jobs need to be configured in vercel.json
    // This scheduler just provides setup instructions

    const cronExpression = this.intervalToCron(intervalMinutes);

    this.setupInstructions = {
      platform: 'Vercel',
      message: `
⚠️ Vercel Cron Setup Required

Add this to your vercel.json:

{
  "crons": [{
    "path": "/api/cron/oauth-refresh",
    "schedule": "${cronExpression}"
  }]
}

Then create this API route:

File: app/api/cron/oauth-refresh/route.ts
      `.trim(),
      code: `
import { oauth } from '@/lib/oauth';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger manual refresh
  await oauth.refreshExpiringTokens();

  return Response.json({ success: true });
}
      `.trim(),
      configFile: 'vercel.json'
    };

    if (this.config.onSetupRequired) {
      this.config.onSetupRequired(this.setupInstructions);
    } else {
      console.warn(this.setupInstructions.message);
      console.warn('\nAPI Route Code:');
      console.warn(this.setupInstructions.code);
    }

    this.isScheduled = true;
  }

  async cancel(): Promise<void> {
    this.isScheduled = false;
    console.log('[VercelScheduler] Scheduler cancelled (remove vercel.json cron config)');
  }

  isActive(): boolean {
    return this.isScheduled;
  }

  private intervalToCron(minutes: number): string {
    // Convert minutes to cron expression
    if (minutes < 60) {
      return `*/${minutes} * * * *`; // Every N minutes
    } else {
      const hours = Math.floor(minutes / 60);
      return `0 */${hours} * * *`; // Every N hours
    }
  }

  getSetupInstructions(): SchedulerSetupInstructions | null {
    return this.setupInstructions;
  }
}
