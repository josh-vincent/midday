# OAuth Schema for Drizzle ORM

This schema is compatible with the `@midday/oauth-sync` package and provides comprehensive OAuth connection management.

## Quick Start

### 1. Import the Schema

Add to your main schema file (`schema.ts`):

```typescript
// Export OAuth tables
export * from "./oauth-schema";
```

### 2. Generate Migration

```bash
cd packages/db
bun run db:generate
```

This will create a SQL migration file in `migrations/`.

### 3. Apply Migration

```bash
bun run db:migrate
```

### 4. Use with OAuth Sync Package

The schema is already compatible with `@midday/oauth-sync`:

```typescript
import { createOAuthSync } from "@midday/oauth-sync";
import { DrizzleStorageAdapter } from "@midday/oauth-sync-core/storage";
import { db } from "@midday/db";
import { oauthConnections } from "@midday/db/schema";

const oauth = createOAuthSync({
  providers: {
    quickbooks: {
      clientId: process.env.OAUTH_QB_CLIENT_ID!,
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET!,
      environment: "sandbox",
    },
  },
  storage: new DrizzleStorageAdapter({
    db,
    table: oauthConnections,
  }),
});
```

## Tables Included

### 1. `oauth_connections` (Main Table)

Stores OAuth connection credentials and metadata.

**Key Fields:**
- `id` - Unique connection ID
- `user_id` - User who created the connection (required)
- `team_id` - Team-level connection (optional)
- `org_id` - Organization-level connection (optional)
- `provider` - OAuth provider (quickbooks, xero, gmail, outlook)
- `credentials` - JSONB with tokens `{ accessToken, refreshToken, ... }`
- `realm_id` - QuickBooks Company ID
- `tenant_id` - Xero Tenant ID
- `expires_at` - Token expiration timestamp
- `is_primary` - Primary connection flag
- `is_active` - Soft delete flag

**Example Query:**
```typescript
// Get all active QuickBooks connections for a team
const connections = await db
  .select()
  .from(oauthConnections)
  .where(
    and(
      eq(oauthConnections.teamId, teamId),
      eq(oauthConnections.provider, "quickbooks"),
      eq(oauthConnections.isActive, true)
    )
  );
```

### 2. `oauth_locks`

Prevents concurrent token refreshes using distributed locks.

**Usage:** Automatically used by `TokenSyncManager` for safe concurrent token refreshes.

### 3. `oauth_audit_logs`

Tracks all OAuth actions for compliance and security.

**Actions Tracked:**
- `connect` - New connection created
- `disconnect` - Connection deleted
- `refresh` - Token refreshed
- `transfer` - Connection transferred
- `view` - Connection viewed
- `sync` - Data synced

**Example Query:**
```typescript
// Get audit trail for an organization
const logs = await db
  .select()
  .from(oauthAuditLogs)
  .where(eq(oauthAuditLogs.orgId, orgId))
  .orderBy(desc(oauthAuditLogs.timestamp))
  .limit(100);
```

### 4. `oauth_admins`

Delegate OAuth admin permissions to users.

**Example:**
```typescript
// Grant user OAuth admin permissions
await db.insert(oauthAdmins).values({
  userId: "user_123",
  orgId: "org_456",
  providers: ["quickbooks", "xero"],
  delegatedBy: "owner_789",
  expiresAt: null, // No expiration
});
```

### 5. `oauth_usage_metrics`

Track API usage for billing and analytics.

**Operations Tracked:**
- `api_call` - API requests
- `sync` - Data sync operations
- `data_transfer` - Bytes transferred

**Example Query:**
```typescript
// Get usage for current month
const usage = await db
  .select({
    provider: oauthUsageMetrics.provider,
    operation: oauthUsageMetrics.operation,
    count: count(),
    totalBytes: sum(oauthUsageMetrics.bytes),
  })
  .from(oauthUsageMetrics)
  .where(
    and(
      eq(oauthUsageMetrics.orgId, orgId),
      gte(oauthUsageMetrics.timestamp, startOfMonth())
    )
  )
  .groupBy(oauthUsageMetrics.provider, oauthUsageMetrics.operation);
```

## Indexes

All tables include optimized indexes for common queries:

- **User lookups:** `user_id`
- **Team lookups:** `team_id`, `(team_id, provider)`
- **Org lookups:** `org_id`, `(org_id, provider)`
- **Expiration:** `expires_at` (for background refresh jobs)
- **Provider IDs:** `realm_id`, `tenant_id`
- **Primary connections:** Unique index ensures one primary per org/provider

## Constraints

- **One primary per org/provider:** Enforced via unique partial index
- **One primary per team/provider:** Enforced via unique partial index
- **Auto-update timestamps:** `updated_at` automatically updated on change

## Integration with Existing Schema

### Option 1: Merge into Main Schema

Copy the table definitions from `oauth-schema.ts` into your main `schema.ts`:

```typescript
// In schema.ts
export const oauthConnections = pgTable(
  "oauth_connections",
  { /* ... */ }
);
// ... other oauth tables
```

### Option 2: Keep Separate

Keep `oauth-schema.ts` separate and export from main schema:

```typescript
// In schema.ts
export * from "./oauth-schema";
```

## Example Usage with Drizzle

```typescript
import { db } from "@midday/db";
import { oauthConnections } from "@midday/db/schema";
import { eq, and, gte } from "drizzle-orm";

// 1. Get connection by ID
const connection = await db
  .select()
  .from(oauthConnections)
  .where(eq(oauthConnections.id, connectionId))
  .limit(1);

// 2. Get primary QuickBooks connection
const primary = await db
  .select()
  .from(oauthConnections)
  .where(
    and(
      eq(oauthConnections.teamId, teamId),
      eq(oauthConnections.provider, "quickbooks"),
      eq(oauthConnections.isPrimary, true)
    )
  )
  .limit(1);

// 3. Get expiring connections (for refresh job)
const expiring = await db
  .select()
  .from(oauthConnections)
  .where(
    and(
      eq(oauthConnections.isActive, true),
      gte(oauthConnections.expiresAt, new Date()),
      // expires in next hour
    )
  );

// 4. Update connection tokens
await db
  .update(oauthConnections)
  .set({
    credentials: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
      // ... other fields
    },
    expiresAt: new Date(Date.now() + 3600 * 1000),
    updatedAt: new Date(),
  })
  .where(eq(oauthConnections.id, connectionId));

// 5. Soft delete connection
await db
  .update(oauthConnections)
  .set({ isActive: false })
  .where(eq(oauthConnections.id, connectionId));
```

## Row Level Security (RLS)

If you're using Supabase, you can add RLS policies:

```sql
-- Enable RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY oauth_connections_select_own
ON oauth_connections FOR SELECT
USING (user_id = auth.uid()::TEXT);

-- Users can view team connections
CREATE POLICY oauth_connections_select_team
ON oauth_connections FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()::TEXT
  )
);
```

## Maintenance

### Clean Up Expired Locks

Run periodically (e.g., via cron):

```typescript
import { db } from "@midday/db";
import { oauthLocks } from "@midday/db/schema";
import { lt } from "drizzle-orm";

// Delete locks expired more than 1 hour ago
await db
  .delete(oauthLocks)
  .where(lt(oauthLocks.expiresAt, new Date()));
```

### Archive Old Audit Logs

Keep logs for compliance period (e.g., 90 days):

```typescript
import { db } from "@midday/db";
import { oauthAuditLogs } from "@midday/db/schema";
import { lt } from "drizzle-orm";

const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

await db
  .delete(oauthAuditLogs)
  .where(lt(oauthAuditLogs.timestamp, ninetyDaysAgo));
```

## Next Steps

1. Generate and apply migration
2. Update your OAuth routes to use the new schema
3. Set up background jobs for token refresh
4. Implement audit logging in your OAuth flows
5. Add usage tracking for billing

For more details, see:
- `/packages/oauth-sync/QUICKSTART.md` - OAuth implementation guide
- `/packages/oauth-sync/simplified/examples/schema/supabase.sql` - Original SQL schema
