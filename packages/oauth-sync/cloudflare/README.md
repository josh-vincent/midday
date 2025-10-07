# @midday/oauth-sync-cloudflare

Cloudflare Workers integration for OAuth token synchronization.

## Installation

```bash
bun add @midday/oauth-sync-cloudflare @midday/oauth-sync-core
```

## Features

- ✅ **Scheduled Events**: Cron triggers for automatic refresh
- ✅ **Fetch Handler**: HTTP endpoint for manual refresh
- ✅ **KV Storage**: Works with Cloudflare KV
- ✅ **Edge Computing**: Fast token refresh at the edge

## Usage

### Scheduled Token Refresh

Use Cloudflare's cron triggers to refresh tokens automatically:

```typescript
// src/index.ts
import { createTokenRefreshHandler } from "@midday/oauth-sync-cloudflare";
import {
  TokenSyncManager,
  KVStorageAdapter,
} from "@midday/oauth-sync-core";

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const manager = new TokenSyncManager({
      storage: new KVStorageAdapter({
        get: (key) => env.OAUTH_KV.get(key),
        set: (key, value, opts) => env.OAUTH_KV.put(key, value, opts),
        del: (key) => env.OAUTH_KV.delete(key),
      }),
      providers: {
        quickbooks: {
          clientId: env.QB_CLIENT_ID,
          clientSecret: env.QB_SECRET,
        },
        xero: {
          clientId: env.XERO_CLIENT_ID,
          clientSecret: env.XERO_SECRET,
        },
      },
    });

    const handler = createTokenRefreshHandler(manager, {
      onSuccess: async (results) => {
        console.log(`✅ Refreshed ${results.length} tokens`);
      },
      onError: async (error) => {
        console.error("❌ Refresh failed:", error.message);
      },
    });

    await handler(event, env, ctx);
  },
};
```

**wrangler.toml:**
```toml
name = "oauth-sync-worker"
main = "src/index.ts"

[triggers]
crons = ["*/30 * * * *"] # Every 30 minutes

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "your-kv-namespace-id"

[vars]
QB_CLIENT_ID = "your-quickbooks-client-id"
XERO_CLIENT_ID = "your-xero-client-id"

# Secrets (use wrangler secret put)
# QB_SECRET
# XERO_SECRET
```

### HTTP Endpoint for Manual Refresh

Create an HTTP endpoint to trigger refreshes manually:

```typescript
// src/index.ts
import {
  createTokenRefreshHandler,
  createTokenRefreshFetchHandler,
} from "@midday/oauth-sync-cloudflare";
import {
  TokenSyncManager,
  KVStorageAdapter,
} from "@midday/oauth-sync-core";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Manual refresh endpoint
    if (url.pathname === "/oauth/refresh" && request.method === "POST") {
      const manager = new TokenSyncManager({
        storage: new KVStorageAdapter({
          get: (key) => env.OAUTH_KV.get(key),
          set: (key, value, opts) => env.OAUTH_KV.put(key, value, opts),
          del: (key) => env.OAUTH_KV.delete(key),
        }),
        providers: {
          quickbooks: {
            clientId: env.QB_CLIENT_ID,
            clientSecret: env.QB_SECRET,
          },
        },
      });

      const handler = createTokenRefreshFetchHandler(manager, {
        authHeader: `Bearer ${env.OAUTH_REFRESH_SECRET}`,
      });

      return handler(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Scheduled refresh (same as above)
  },
};
```

**Usage:**
```bash
# Refresh all expiring tokens
curl -X POST https://your-worker.workers.dev/oauth/refresh \
  -H "Authorization: Bearer your-secret"

# Refresh specific connection
curl -X POST https://your-worker.workers.dev/oauth/refresh \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "conn_123", "provider": "quickbooks"}'

# Refresh team tokens
curl -X POST https://your-worker.workers.dev/oauth/refresh \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"teamId": "team_456"}'
```

## API

### createTokenRefreshHandler

Create a Cloudflare scheduled event handler.

```typescript
function createTokenRefreshHandler(
  manager: TokenSyncManager,
  options?: {
    onSuccess?: (results: TokenRefreshResult[]) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  }
): (event: ScheduledEvent, env: any, ctx: ExecutionContext) => Promise<any>;
```

### createTokenRefreshFetchHandler

Create an HTTP fetch handler for manual refreshes.

```typescript
function createTokenRefreshFetchHandler(
  manager: TokenSyncManager,
  options?: {
    authHeader?: string; // e.g., "Bearer secret-token"
  }
): (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>;
```

## Examples

### Production Setup

```typescript
// src/index.ts
import {
  createTokenRefreshHandler,
  createTokenRefreshFetchHandler,
} from "@midday/oauth-sync-cloudflare";
import {
  TokenSyncManager,
  KVStorageAdapter,
} from "@midday/oauth-sync-core";

interface Env {
  OAUTH_KV: KVNamespace;
  QB_CLIENT_ID: string;
  QB_SECRET: string;
  XERO_CLIENT_ID: string;
  XERO_SECRET: string;
  OAUTH_REFRESH_SECRET: string;
}

function createManager(env: Env): TokenSyncManager {
  return new TokenSyncManager({
    storage: new KVStorageAdapter({
      get: (key) => env.OAUTH_KV.get(key),
      set: (key, value, opts) => {
        const expiration = opts?.ex
          ? Math.floor(Date.now() / 1000) + opts.ex
          : undefined;
        return env.OAUTH_KV.put(key, value, { expiration });
      },
      del: (key) => env.OAUTH_KV.delete(key),
    }),
    providers: {
      quickbooks: {
        clientId: env.QB_CLIENT_ID,
        clientSecret: env.QB_SECRET,
        environment: "production",
      },
      xero: {
        clientId: env.XERO_CLIENT_ID,
        clientSecret: env.XERO_SECRET,
      },
    },
    scheduler: {
      thresholdMinutes: 60,
      retryAttempts: 3,
    },
  });
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const manager = createManager(env);
    const handler = createTokenRefreshHandler(manager);
    await handler(event, env, ctx);
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/refresh") {
      const manager = createManager(env);
      const handler = createTokenRefreshFetchHandler(manager, {
        authHeader: `Bearer ${env.OAUTH_REFRESH_SECRET}`,
      });
      return handler(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
```

## Deployment

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Set secrets
wrangler secret put QB_SECRET
wrangler secret put XERO_SECRET
wrangler secret put OAUTH_REFRESH_SECRET

# Test scheduled event
wrangler dev --test-scheduled

# View logs
wrangler tail
```

## License

MIT
