# @midday/jobs

Background job processing for Midday using [Trigger.dev](https://trigger.dev).

## Overview

This package contains all background tasks and scheduled jobs for the Midday platform, including:

- **OAuth Token Refresh** - Automatic token refresh for accounting integrations
- **QuickBooks Integration** - Sync customers, invoices, payments, and more
- **Xero Integration** - Sync accounting data from Xero
- **Webhook Processing** - Handle real-time updates from accounting platforms

## Available Tasks

### OAuth & Authentication

#### `token-refresh-scheduler`
Scheduled task that runs every 30 minutes to proactively refresh expiring OAuth tokens.

**Schedule:** `*/30 * * * *` (every 30 minutes)
**Providers:** QuickBooks (1 hour window), Xero (30 minute window)

### QuickBooks

#### `initial-quickbooks-setup`
Runs the initial data sync after QuickBooks OAuth connection is established.

**Payload:**
```typescript
{
  integrationId: string; // UUID of apps table record
  tenantId: string;      // Team ID
  realmId: string;       // QuickBooks company ID
}
```

**Syncs:** customers, vendors, accounts, invoices, items, payments

#### `sync-quickbooks-entity`
Syncs a specific entity from QuickBooks (webhook-driven or manual).

**Payload:**
```typescript
{
  integrationId: string;
  tenantId: string;
  entityType: "invoice" | "customer" | "payment" | "item" | "vendor" | "account";
  entityId: string;      // Entity ID or "all" for bulk sync
  operation: "create" | "update" | "delete" | "sync_all";
  realmId: string;
  lastUpdated: string;   // ISO timestamp
}
```

### Xero

#### `initial-xero-setup`
Runs the initial data sync after Xero OAuth connection.

**Payload:**
```typescript
{
  integrationId: string;
  tenantId: string;
  xeroTenantId: string;  // Xero organization ID
}
```

#### `sync-xero-entity`
Syncs a specific entity from Xero.

**Payload:**
```typescript
{
  integrationId: string;
  tenantId: string;
  entityType: "invoice" | "contact" | "payment" | "banktransaction" | "item";
  entityId: string;
  operation: "create" | "update" | "delete" | "sync_all";
  xeroTenantId: string;
  resourceUrl: string;
  eventDateUtc: string;
}
```

## Development

### Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set environment variables:
   ```bash
   # .env
   TRIGGER_API_KEY=tr_dev_...
   TRIGGER_PROJECT_ID=proj_...
   QUICKBOOKS_CLIENT_ID=...
   QUICKBOOKS_CLIENT_SECRET=...
   QUICKBOOKS_SANDBOX=true
   XERO_CLIENT_ID=...
   XERO_CLIENT_SECRET=...
   ```

### Start Dev Server

```bash
bun run dev
```

This starts the Trigger.dev development server at `http://localhost:3030` where you can:
- View all registered tasks
- Manually trigger tasks
- View execution logs
- Debug errors

### Testing

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Type checking
bun run typecheck
```

See [TESTING.md](./TESTING.md) for detailed testing guide.

### Deployment

```bash
# Deploy to production
bun run deploy
```

## Project Structure

```
src/
├── tasks/
│   ├── oauth/
│   │   ├── token-refresh.ts           # Core token refresh logic
│   │   ├── shared-token-refresh.ts    # Shared utilities
│   │   └── token-refresh-scheduler.ts # Scheduled task
│   ├── quickbooks/
│   │   ├── setup/
│   │   │   └── initial.ts             # Initial setup task
│   │   └── sync/
│   │       └── sync-entity.ts         # Entity sync task
│   └── xero/
│       ├── setup/
│       │   └── initial.ts
│       └── sync/
│           └── sync-entity.ts
├── schema.ts                          # Zod schemas for payloads
└── init.ts                            # Trigger.dev initialization
```

## Database Schema

### apps table
Stores OAuth integrations and tokens:
```sql
- id (uuid)
- team_id (uuid)
- app_id (text)           # "quickbooks" or "xero"
- config (jsonb)          # OAuth tokens and metadata
- settings (jsonb)
- created_at (timestamp)
```

### synced_accounting_entities table
Caches synced data from accounting platforms:
```sql
- id (uuid)
- connection_id (uuid)    # References apps.id
- team_id (uuid)
- entity_type (text)      # "customers", "invoices", etc.
- external_id (text)      # Provider's entity ID
- entity_data (jsonb)     # Cached entity data
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

## Usage Examples

### Trigger Initial Sync

```typescript
import { initialQuickBooksSetup } from "@midday/jobs";

// After user completes OAuth flow
const result = await initialQuickBooksSetup.trigger({
  integrationId: app.id,
  tenantId: team.id,
  realmId: oauthTokens.realm_id,
});
```

### Handle Webhook

```typescript
import { syncQuickBooksEntity } from "@midday/jobs";

export async function POST(request: Request) {
  const webhook = await request.json();

  await syncQuickBooksEntity.trigger({
    integrationId: app.id,
    tenantId: team.id,
    entityType: "invoice",
    entityId: webhook.realmId,
    operation: "update",
    realmId: app.config.realm_id,
    lastUpdated: new Date().toISOString(),
  });

  return Response.json({ success: true });
}
```

### Manual Entity Sync

```typescript
// Sync all customers
await syncQuickBooksEntity.trigger({
  integrationId: app.id,
  tenantId: team.id,
  entityType: "customer",
  entityId: "all",
  operation: "sync_all",
  realmId: app.config.realm_id,
  lastUpdated: new Date().toISOString(),
});
```

## Architecture

```
┌─────────────────┐
│  User OAuth     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  apps table     │────▶│ Token Refresh    │
│  (OAuth tokens) │     │ Scheduler        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │              ┌────────▼──────────┐
         │              │ QuickBooks/Xero   │
         │              │ Provider API      │
         │              └────────┬──────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│ Webhook Events  │────▶│ Sync Entity      │
└─────────────────┘     │ Tasks            │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ synced_entities  │
                        │ table            │
                        └──────────────────┘
```

## Key Features

- ✅ **Automatic Token Refresh** - Tokens refreshed before expiry
- ✅ **Retry Logic** - Exponential backoff for failed requests
- ✅ **Error Handling** - Comprehensive error logging and status tracking
- ✅ **Webhook Support** - Real-time sync via provider webhooks
- ✅ **Type Safety** - Full TypeScript support with Zod validation
- ✅ **Local Development** - Easy testing with Trigger.dev dev server
- ✅ **Production Ready** - Scalable background processing

## Related Packages

- `@midday/accounting-providers` - Provider implementations (QuickBooks, Xero)
- `@midday/db` - Database schema and queries
- `@midday/supabase` - Supabase client for database access

## Resources

- [Trigger.dev Documentation](https://trigger.dev/docs)
- [QuickBooks API](https://developer.intuit.com/app/developer/qbo/docs)
- [Xero API](https://developer.xero.com/documentation)
- [TESTING.md](./TESTING.md) - Testing guide
- [../accounting-providers/BACKGROUND_JOBS.md](../accounting-providers/BACKGROUND_JOBS.md) - Integration guide
