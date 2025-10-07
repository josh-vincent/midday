# @midday/oauth-sync-trigger

Trigger.dev integration for OAuth token synchronization.

## Installation

```bash
bun add @midday/oauth-sync-trigger @midday/oauth-sync-core
```

## Features

- ✅ **Scheduled Task**: Cron-based automatic token refresh
- ✅ **On-Demand Task**: Manual or webhook-triggered refresh
- ✅ **Built-in Logging**: Uses Trigger.dev's logger
- ✅ **Error Handling**: Callbacks for success/error events

## Usage

### Scheduled Token Refresh

Create a scheduled task that runs every 30 minutes:

```typescript
// packages/jobs/src/tasks/oauth-refresh.ts
import { createTokenRefreshScheduler } from "@midday/oauth-sync-trigger";
import {
  TokenSyncManager,
  SupabaseStorageAdapter,
} from "@midday/oauth-sync-core";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const manager = new TokenSyncManager({
  storage: new SupabaseStorageAdapter(supabase),
  providers: {
    quickbooks: {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
    },
  },
});

export const oauthTokenRefresh = createTokenRefreshScheduler(manager, {
  id: "oauth-token-refresh",
  cron: "*/30 * * * *", // Every 30 minutes
  maxDuration: 300, // 5 minutes max
  onSuccess: async (results) => {
    console.log(`✅ Refreshed ${results.length} tokens`);
  },
  onError: async (error) => {
    console.error("❌ Token refresh failed:", error.message);
    // Send alert to monitoring service
  },
});
```

### On-Demand Refresh

Create a task for manual or webhook-triggered refreshes:

```typescript
// packages/jobs/src/tasks/oauth-on-demand.ts
import { createOnDemandRefreshTask } from "@midday/oauth-sync-trigger";

export const refreshTokenOnDemand = createOnDemandRefreshTask(manager, {
  id: "oauth-refresh-on-demand",
  maxDuration: 60, // 1 minute
});

// Trigger from your API
import { refreshTokenOnDemand } from "@/jobs/tasks/oauth-on-demand";

// Refresh specific connection
await refreshTokenOnDemand.trigger({
  connectionId: "conn_123",
  provider: "quickbooks",
});

// Refresh all connections for a team
await refreshTokenOnDemand.trigger({
  teamId: "team_456",
});

// Refresh all expiring tokens
await refreshTokenOnDemand.trigger({});
```

### Webhook Integration

Use on-demand tasks with webhooks:

```typescript
// app/api/webhooks/quickbooks/route.ts
import { refreshTokenOnDemand } from "@/jobs/tasks/oauth-on-demand";

export async function POST(request: Request) {
  const webhook = await request.json();

  // Trigger token refresh for this connection
  await refreshTokenOnDemand.trigger({
    connectionId: webhook.realmId,
    provider: "quickbooks",
  });

  return Response.json({ success: true });
}
```

## API

### createTokenRefreshScheduler

Create a scheduled Trigger.dev task for automatic token refresh.

```typescript
function createTokenRefreshScheduler(
  manager: TokenSyncManager,
  options?: {
    id?: string;
    cron?: string;
    maxDuration?: number;
    onSuccess?: (results: TokenRefreshResult[]) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  }
);
```

**Options:**
- `id`: Task ID (default: `"oauth-token-refresh-scheduler"`)
- `cron`: Cron expression (default: `"*/30 * * * *"` - every 30 minutes)
- `maxDuration`: Max task duration in seconds (default: `300`)
- `onSuccess`: Callback when refresh succeeds
- `onError`: Callback when refresh fails

### createOnDemandRefreshTask

Create an on-demand Trigger.dev task for manual token refresh.

```typescript
function createOnDemandRefreshTask(
  manager: TokenSyncManager,
  options?: {
    id?: string;
    maxDuration?: number;
  }
);
```

**Payload:**
```typescript
interface OnDemandRefreshPayload {
  connectionId?: string;  // Refresh specific connection
  teamId?: string;        // Refresh all team connections
  provider?: OAuthProvider; // Provider type (required with connectionId)
}
```

## Examples

### Production Setup

```typescript
import { createTokenRefreshScheduler } from "@midday/oauth-sync-trigger";
import {
  TokenSyncManager,
  SupabaseStorageAdapter,
} from "@midday/oauth-sync-core";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for backend
);

// Create manager
const manager = new TokenSyncManager({
  storage: new SupabaseStorageAdapter(supabase),
  providers: {
    quickbooks: {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      environment: "production",
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
    },
  },
  scheduler: {
    thresholdMinutes: 60,
    retryAttempts: 3,
    retryDelayMs: 5000,
  },
});

// Create scheduled task
export const oauthTokenRefresh = createTokenRefreshScheduler(manager, {
  cron: "*/30 * * * *",
  onSuccess: async (results) => {
    // Send metrics to monitoring
    await sendMetrics({
      metric: "oauth.token.refresh",
      value: results.length,
      tags: { status: "success" },
    });
  },
  onError: async (error) => {
    // Alert team
    await sendAlert({
      title: "OAuth Token Refresh Failed",
      message: error.message,
      severity: "high",
    });
  },
});
```

## License

MIT
