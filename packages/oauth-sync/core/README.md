# @midday/oauth-sync-core

Runtime-agnostic OAuth token synchronization library.

## Installation

```bash
bun add @midday/oauth-sync-core
```

## Features

- ✅ **Provider Adapters**: QuickBooks, Xero (easily extensible)
- ✅ **Storage Adapters**: Supabase, PostgreSQL (Drizzle), Redis/KV
- ✅ **Runtime Agnostic**: Works in Node.js, Deno, Cloudflare Workers, Bun
- ✅ **Type Safe**: Full TypeScript support with Zod schemas
- ✅ **Distributed Locking**: Prevents concurrent token refreshes
- ✅ **Retry Logic**: Exponential backoff for failed refreshes
- ✅ **Logging**: Pluggable logger interface

## Usage

### Basic Example (Supabase + QuickBooks)

```typescript
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
  },
  scheduler: {
    thresholdMinutes: 60, // Refresh 60 minutes before expiry
    retryAttempts: 3,
    retryDelayMs: 5000,
  },
});

// Refresh all expiring tokens
const results = await manager.refreshExpiringTokens();
console.log(`Refreshed ${results.length} tokens`);
```

### Using PostgreSQL (Drizzle)

```typescript
import { PostgresStorageAdapter } from "@midday/oauth-sync-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accountingConnections } from "@midday/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const manager = new TokenSyncManager({
  storage: new PostgresStorageAdapter(db, accountingConnections),
  providers: {
    quickbooks: { /* ... */ },
    xero: { /* ... */ },
  },
});
```

### Using Redis/KV Store

```typescript
import { KVStorageAdapter } from "@midday/oauth-sync-core";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const manager = new TokenSyncManager({
  storage: new KVStorageAdapter({
    get: (key) => redis.get(key),
    set: (key, value, opts) => redis.set(key, value, opts),
    del: (key) => redis.del(key),
    keys: (pattern) => redis.keys(pattern),
  }),
  providers: {
    quickbooks: { /* ... */ },
  },
});
```

## Advanced Usage

### Refresh Specific Connection

```typescript
const result = await manager.refreshConnection(
  "connection-id",
  "quickbooks"
);

if (result.success) {
  console.log("Token refreshed:", result.expiresAt);
} else {
  console.error("Refresh failed:", result.error);
}
```

### Refresh Team Tokens

```typescript
const results = await manager.refreshTeamTokens("team-id");
console.log(`Refreshed ${results.length} connections for team`);
```

### Check Token Status

```typescript
const status = await manager.checkTokenStatus("connection-id");
console.log({
  needsRefresh: status.needsRefresh,
  minutesUntilExpiry: status.minutesUntilExpiry,
  expiresAt: status.expiresAt,
});
```

### Custom Logger

```typescript
const manager = new TokenSyncManager({
  storage: /* ... */,
  providers: /* ... */,
  logger: {
    info: (msg, data) => console.log(msg, data),
    warn: (msg, data) => console.warn(msg, data),
    error: (msg, data) => console.error(msg, data),
    debug: (msg, data) => console.debug(msg, data),
  },
});
```

## Provider Adapters

### QuickBooks

```typescript
import { QuickBooksProvider } from "@midday/oauth-sync-core";

const provider = new QuickBooksProvider();

// Check if token is expiring
const isExpiring = provider.isTokenExpiring(tokens, 60);

// Refresh token
const newTokens = await provider.refreshToken(tokens, {
  clientId: process.env.QB_CLIENT_ID!,
  clientSecret: process.env.QB_SECRET!,
});
```

### Xero

```typescript
import { XeroProvider } from "@midday/oauth-sync-core";

const provider = new XeroProvider();

// Check if token is expiring (Xero: 30 minutes)
const isExpiring = provider.isTokenExpiring(tokens, 30);

// Refresh token
const newTokens = await provider.refreshToken(tokens, {
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_SECRET!,
});
```

## Storage Adapters

### Supabase

Uses the `accounting_connections` table:

```sql
CREATE TABLE accounting_connections (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### PostgreSQL (Drizzle)

Works with any Drizzle schema:

```typescript
import { PostgresStorageAdapter } from "@midday/oauth-sync-core";

const adapter = new PostgresStorageAdapter(
  db,
  accountingConnectionsTable,
  oauthLocksTable // Optional for distributed locking
);
```

### Redis/KV

Requires a KV store with basic operations:

```typescript
interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys?(pattern: string): Promise<string[]>;
}
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## License

MIT
