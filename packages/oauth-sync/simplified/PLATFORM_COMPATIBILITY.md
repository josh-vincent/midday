# Platform Compatibility Analysis

## Current Status: ⚠️ Partially Compatible

OAuth Sync v3 works on **some** platforms but has **critical issues** preventing deployment to serverless/edge runtimes.

## Platform Compatibility Matrix

| Feature | Node.js | Vercel | Cloudflare Workers | Deno | AWS Lambda | Supabase Edge |
|---------|---------|--------|-------------------|------|------------|---------------|
| **Core OAuth (getTokens, connect)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Storage - Supabase** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Storage - KV** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Storage - Postgres** | ✅ | ✅ | ❌ | ⚠️ | ✅ | ⚠️ |
| **Auto-Refresh** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Direct DB Sync** | ✅ | ✅ | ❌ | ⚠️ | ✅ | ⚠️ |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Transforms** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Event System** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Zod Validation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend:
- ✅ Works
- ⚠️ Works with limitations/modifications
- ❌ Does not work

## Critical Issues

### 1. Auto-Refresh Service ❌ BLOCKING

**File**: `src/auto-refresh.ts:88`

**Problem**:
```typescript
// Uses setInterval() - only works in long-running processes
this.interval = setInterval(async () => {
  await this.refreshExpiringTokens();
}, this.config.intervalMinutes * 60 * 1000);
```

**Impact**:
- ❌ **Vercel/Netlify**: Serverless functions are stateless, no persistent intervals
- ❌ **Cloudflare Workers**: No setInterval in Workers runtime
- ❌ **AWS Lambda**: Stateless, terminates after response
- ❌ **Deno Deploy**: Limited to request lifecycle
- ❌ **Supabase Edge Functions**: Stateless, Deno-based

**Why It's Critical**:
- Auto-refresh is a **core v3 feature** ("Built-in auto-refresh")
- Advertised as automatic, but only works in Node.js long-running processes
- Most modern deployments are serverless

**Solution Required**:
Replace with platform-specific schedulers:
- Vercel: Vercel Cron Jobs
- Cloudflare: Durable Objects or Scheduled Events
- AWS: EventBridge
- Supabase: pg_cron or external scheduler

### 2. Direct DB Sync - Postgres Client ❌ BLOCKING

**File**: `src/data-sync.ts:96`

**Problem**:
```typescript
// Uses 'pg' package - Node.js specific
const { Pool } = await import('pg');
this.client = new Pool({...});
```

**Impact**:
- ❌ **Cloudflare Workers**: No access to Node.js `pg` package
- ⚠️ **Deno**: Can use Postgres driver but different API
- ⚠️ **Supabase Edge Functions**: Deno-based, needs different driver

**Solution Required**:
- Use platform-agnostic HTTP-based Postgres (e.g., Supabase REST API)
- Or detect runtime and use appropriate driver
- Or recommend webhooks/custom transforms for edge runtimes

### 3. NodeJS.Timer Type ⚠️ MINOR

**File**: `src/auto-refresh.ts:47`

**Problem**:
```typescript
private interval: NodeJS.Timer | null = null;
```

**Impact**:
- Type error in non-Node.js runtimes
- Doesn't prevent runtime but shows wrong types

**Solution Required**:
```typescript
private interval: ReturnType<typeof setInterval> | null = null;
```

## What Works Cross-Platform

### ✅ Core OAuth Operations
```typescript
const oauth = new OAuthSync({
  storage: 'supabase', // ✅ Works everywhere via HTTP
  autoRefresh: false,  // ❌ Must disable for serverless!
});

// ✅ All platforms
const tokens = await oauth.getTokens({ userId: 'user_123' });
const richTokens = await oauth.getRichTokens({ orgId: 'org_123' });
```

### ✅ Webhooks (Recommended for Serverless)
```typescript
const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: false, // Disable for serverless
  webhook: {
    url: 'https://your-app.com/api/webhooks',
    secret: process.env.WEBHOOK_SECRET,
  },
});

// ✅ Works on all platforms
await oauth.sync('customers', { orgId: 'org_123' });
```

### ✅ Custom Transforms
```typescript
import { DataSyncManager } from '@midday/oauth-sync';

const syncManager = new DataSyncManager();

syncManager.registerTransform('customers', async (rawData, context) => {
  // ✅ Works on all platforms
  const customers = rawData.Contacts.map(c => ({
    id: c.ContactID,
    name: c.Name,
  }));

  // Use platform-appropriate DB client
  await fetch('https://your-db-api.com/customers', {
    method: 'POST',
    body: JSON.stringify(customers),
  });

  return customers;
});
```

## Platform-Specific Recommendations

### Vercel (Recommended ✅)

**What Works**:
- Core OAuth via Supabase storage
- Webhooks for data sync
- Manual token refresh on-demand

**Auto-Refresh Solution**:
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/refresh-tokens",
    "schedule": "*/15 * * * *"  // Every 15 minutes
  }]
}

// app/api/cron/refresh-tokens/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Manual refresh
  const manager = new TokenSyncManager({...});
  await manager.refreshExpiringConnections(60);

  return Response.json({ success: true });
}
```

### Cloudflare Workers (⚠️ Limited)

**What Works**:
- Core OAuth via KV storage
- Webhooks for data sync

**What Doesn't Work**:
- Auto-refresh (use Scheduled Events)
- Direct DB sync with `pg` package

**Auto-Refresh Solution**:
```typescript
// wrangler.toml
[triggers]
crons = ["*/15 * * * *"]

// src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Manual refresh using KV storage
    const storage = new KVStorageAdapter({ kv: env.KV });
    const manager = new TokenSyncManager({ storage, providers: {...} });
    await manager.refreshExpiringConnections(60);
  }
}
```

### AWS Lambda (✅ Works)

**What Works**:
- Core OAuth via Postgres/Supabase
- Webhooks for data sync
- Direct DB sync

**Auto-Refresh Solution**:
```typescript
// Use EventBridge scheduled rule
// CloudFormation/Terraform:
resource "aws_cloudwatch_event_rule" "token_refresh" {
  name                = "oauth-token-refresh"
  schedule_expression = "rate(15 minutes)"
}

// Lambda handler
export async function handler(event: any) {
  const manager = new TokenSyncManager({...});
  await manager.refreshExpiringConnections(60);
}
```

### Deno / Supabase Edge Functions (⚠️ Limited)

**What Works**:
- Core OAuth via Supabase storage (HTTP)
- Webhooks for data sync

**What Doesn't Work**:
- Auto-refresh with setInterval
- Direct DB sync with `pg` (use `deno-postgres` instead)

**Auto-Refresh Solution**:
```typescript
// Use pg_cron in Supabase database
-- SQL
SELECT cron.schedule(
  'refresh-oauth-tokens',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-edge-function.supabase.co/refresh-tokens',
      headers := '{"Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    );
  $$
);
```

## Recommended Cross-Platform Setup

### For Maximum Compatibility (All Platforms)

```typescript
// lib/oauth.ts
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  storage: 'supabase', // ✅ Works everywhere
  autoRefresh: false,  // ❌ Disable - use platform scheduler

  // ✅ Webhooks work everywhere
  webhook: {
    url: process.env.APP_URL + '/api/webhooks/oauth-sync',
    secret: process.env.WEBHOOK_SECRET,
  },
});

// Setup platform-specific auto-refresh separately
// Vercel: vercel.json cron
// Cloudflare: wrangler.toml cron
// AWS: EventBridge
// Deno: pg_cron
```

## Required Fixes for Full Compatibility

### Priority 1: Auto-Refresh Abstraction

Create platform-agnostic scheduler interface:

```typescript
// src/scheduler/interface.ts
export interface IScheduler {
  schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void>;
  cancel(): Promise<void>;
}

// src/scheduler/vercel.ts
export class VercelScheduler implements IScheduler {
  // Uses Vercel Cron
}

// src/scheduler/cloudflare.ts
export class CloudflareScheduler implements IScheduler {
  // Uses Durable Alarms or Scheduled Events
}

// src/scheduler/node.ts
export class NodeScheduler implements IScheduler {
  // Uses setInterval
}

// Auto-detect platform
export function createScheduler(): IScheduler {
  if (process.env.VERCEL) return new VercelScheduler();
  if (process.env.CLOUDFLARE_WORKERS) return new CloudflareScheduler();
  return new NodeScheduler();
}
```

### Priority 2: Database Adapter Abstraction

Make Direct DB Sync platform-agnostic:

```typescript
// Use HTTP-based Postgres
export class SupabasePostgresAdapter implements IDatabaseAdapter {
  async upsert(table: string, data: any[]) {
    // Use Supabase REST API instead of pg driver
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/${table}`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(data),
      }
    );
    return response.ok;
  }
}
```

### Priority 3: Type Fixes

```typescript
// Change from:
private interval: NodeJS.Timer | null = null;

// To:
private interval: ReturnType<typeof setInterval> | null = null;
```

## Current Recommendation

**For Production Use Today**:

1. ✅ **Use Webhooks** for data sync (works everywhere)
2. ❌ **Disable auto-refresh** (`autoRefresh: false`)
3. ✅ **Use Supabase storage** (HTTP-based, works everywhere)
4. ✅ **Set up platform-specific cron** for token refresh
5. ✅ **Use custom transforms** for complex processing

**Example**:
```typescript
const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: false, // Critical: Disable for serverless!
  webhook: {
    url: process.env.WEBHOOK_URL,
    secret: process.env.WEBHOOK_SECRET,
  },
});
```

## Conclusion

**Current State**:
- ✅ Core OAuth features work cross-platform
- ❌ Auto-refresh only works in Node.js long-running processes
- ⚠️ Direct DB sync only works in Node.js/Lambda

**Needed for Full Cross-Platform Support**:
1. Abstract scheduler interface (Priority 1)
2. HTTP-based database adapters (Priority 2)
3. Runtime detection and appropriate fallbacks (Priority 3)

**Workaround Until Fixed**:
- Disable `autoRefresh`
- Use platform-specific cron jobs
- Use Supabase storage
- Use webhooks for data sync

This allows the package to work on all platforms with manual scheduler setup.
