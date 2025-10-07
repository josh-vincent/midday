import type { IScheduler, SchedulerConfig, SchedulerSetupInstructions } from './interface';

/**
 * Deno scheduler using Deno.cron (Deno Deploy)
 * Can use either Deno.cron or pg_cron for Supabase Edge Functions
 */
export class DenoScheduler implements IScheduler {
  private config: SchedulerConfig;
  private isScheduled = false;
  private setupInstructions: SchedulerSetupInstructions | null = null;

  constructor(config: SchedulerConfig = {}) {
    this.config = config;
  }

  async schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void> {
    const cronExpression = this.intervalToCron(intervalMinutes);

    this.setupInstructions = {
      platform: 'Deno / Supabase Edge Functions',
      message: `
⚠️ Deno Cron Setup Required

Option 1: Deno.cron (Deno Deploy)
Add this to your main file:

File: main.ts
      `.trim(),
      code: `
import { oauth } from './oauth.ts';

// Schedule using Deno.cron
Deno.cron("oauth-token-refresh", "${cronExpression}", async () => {
  await oauth.refreshExpiringTokens();
});

// Your existing server code
Deno.serve((req) => {
  // ... your handlers
});

---

Option 2: pg_cron (Supabase Edge Functions)
Run this SQL in your Supabase database:

SELECT cron.schedule(
  'oauth-token-refresh',
  '${cronExpression}',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/oauth-refresh',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      )
    );
  $$
);

Then create the Edge Function:

File: supabase/functions/oauth-refresh/index.ts

import { oauth } from '../_shared/oauth.ts';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== \`Bearer \${Deno.env.get('CRON_SECRET')}\`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await oauth.refreshExpiringTokens();
  return new Response(JSON.stringify({ success: true }));
});
      `.trim(),
      configFile: 'main.ts or supabase/functions/oauth-refresh/index.ts'
    };

    if (this.config.onSetupRequired) {
      this.config.onSetupRequired(this.setupInstructions);
    } else {
      console.warn(this.setupInstructions.message);
      console.warn('\nCode:');
      console.warn(this.setupInstructions.code);
    }

    this.isScheduled = true;
  }

  async cancel(): Promise<void> {
    this.isScheduled = false;
    console.log('[DenoScheduler] Scheduler cancelled (remove cron configuration)');
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
