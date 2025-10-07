# Background Jobs Integration Guide

This guide explains how to integrate `@midday/accounting-providers` with background jobs using Trigger.dev for production-ready accounting synchronization.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Accounting Integration Flow                   │
└──────────────────────────────────────────────────────────────────┘

1. User Authentication
   ┌──────────────┐
   │ OAuth Flow   │ → QuickBooks/Xero → Redirect with auth code
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Exchange     │ → Get access_token, refresh_token, expires_in
   │ Auth Code    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Save to      │ → apps table (config: { access_token, ... })
   │ Database     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Trigger      │ → @midday/jobs: initialQuickBooksSetup
   │ Initial Sync │
   └──────────────┘

2. Background Token Refresh (Automatic)
   ┌──────────────────┐
   │ Token Refresh    │ → Runs every 30 minutes
   │ Scheduler        │ → Checks all apps for expiring tokens
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Check Expiry     │ → QB: 1 hour, Xero: 30 min windows
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Refresh via      │ → QuickBooksProvider.refreshAccessToken()
   │ Provider         │ → XeroProvider.refreshAccessToken()
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Update Database  │ → New tokens saved to apps.config
   └──────────────────┘

3. Real-time Sync (Webhook-driven)
   ┌──────────────────┐
   │ Provider Webhook │ → QuickBooks/Xero sends event
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Verify Signature │ → Validate webhook authenticity
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Trigger Sync     │ → syncQuickBooksEntity task
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Fetch from API   │ → QuickBooksProvider.getInvoice(id)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Save to Database │ → synced_accounting_entities table
   └──────────────────┘
```

## Prerequisites

### 1. Database Setup

Ensure your database has the required tables:

```sql
-- apps table (stores OAuth integrations)
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,  -- 'quickbooks' or 'xero'
  config JSONB,          -- OAuth tokens: { access_token, refresh_token, ... }
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(team_id, app_id)
);

-- synced_accounting_entities table (caches synced data)
CREATE TABLE synced_accounting_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  entity_type TEXT NOT NULL,  -- 'customers', 'invoices', etc.
  external_id TEXT NOT NULL,  -- Provider's entity ID
  entity_data JSONB NOT NULL, -- Cached entity data
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(connection_id, entity_type, external_id)
);

CREATE INDEX idx_synced_entities_connection ON synced_accounting_entities(connection_id);
CREATE INDEX idx_synced_entities_type ON synced_accounting_entities(entity_type);
```

### 2. Environment Variables

```env
# Trigger.dev
TRIGGER_API_KEY=tr_dev_...
TRIGGER_PROJECT_ID=proj_...

# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_secret
QUICKBOOKS_SANDBOX=true  # false for production

# Xero OAuth
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_secret

# Database
DATABASE_URL=postgresql://...
```

### 3. Package Installation

```bash
bun add @midday/accounting-providers @midday/jobs
```

## Implementation Guide

### Step 1: OAuth Flow

```typescript
// app/api/auth/quickbooks/callback/route.ts
import { QuickBooksProvider } from "@midday/accounting-providers";
import { createClient } from "@midday/supabase/server";
import { initialQuickBooksSetup } from "@midday/jobs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code || !realmId) {
    return Response.json({ error: "Missing code or realmId" }, { status: 400 });
  }

  // Exchange authorization code for tokens
  const qbProvider = new QuickBooksProvider({
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    realmId,
  });

  const tokens = await qbProvider.exchangeCodeForToken(
    code,
    "http://localhost:3000/api/auth/quickbooks/callback"
  );

  // Save to database
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: app } = await supabase
    .from("apps")
    .insert({
      team_id: team.id,
      app_id: "quickbooks",
      config: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        connected_at: new Date().toISOString(),
        realm_id: realmId,
      },
      created_by: user.id,
    })
    .select()
    .single();

  // Trigger initial sync in background
  await initialQuickBooksSetup.trigger({
    integrationId: app.id,
    tenantId: team.id,
    realmId,
  });

  // Cleanup
  await qbProvider.disconnect();

  return Response.redirect("/dashboard/integrations?success=true");
}
```

### Step 2: Webhook Handler

```typescript
// app/api/webhooks/quickbooks/route.ts
import { syncQuickBooksEntity } from "@midday/jobs";
import { createClient } from "@midday/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("intuit-signature");

  // Verify webhook signature
  const webhookSecret = process.env.QUICKBOOKS_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("base64");

  if (hash !== signature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const webhook = JSON.parse(body);
  const supabase = createClient();

  // Process each event
  for (const event of webhook.eventNotifications) {
    const realmId = event.realmId;

    // Find the integration
    const { data: app } = await supabase
      .from("apps")
      .select("id, team_id, config")
      .eq("app_id", "quickbooks")
      .eq("config->>realm_id", realmId)
      .single();

    if (!app) continue;

    // Trigger sync for each entity in the event
    for (const dataChange of event.dataChangeEvent?.entities || []) {
      await syncQuickBooksEntity.trigger({
        integrationId: app.id,
        tenantId: app.team_id,
        entityType: dataChange.name.toLowerCase(), // "Customer", "Invoice", etc
        entityId: dataChange.id,
        operation: dataChange.operation.toLowerCase(), // "Create", "Update", "Delete"
        realmId,
        lastUpdated: event.eventTime,
      });
    }
  }

  return Response.json({ success: true });
}
```

### Step 3: Manual Sync (Optional)

```typescript
// app/api/sync/quickbooks/route.ts
import { syncQuickBooksEntity } from "@midday/jobs";
import { createClient } from "@midday/supabase/server";

export async function POST(request: Request) {
  const { entityType } = await request.json();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("team_id", team.id)
    .eq("app_id", "quickbooks")
    .single();

  if (!app) {
    return Response.json({ error: "QuickBooks not connected" }, { status: 404 });
  }

  // Trigger sync for all entities of this type
  await syncQuickBooksEntity.trigger({
    integrationId: app.id,
    tenantId: team.id,
    entityType,
    entityId: "all", // Special value for bulk sync
    operation: "sync_all",
    realmId: app.config.realm_id,
    lastUpdated: new Date().toISOString(),
  });

  return Response.json({ success: true, message: "Sync started" });
}
```

### Step 4: Query Synced Data

```typescript
// app/api/customers/route.ts
import { createClient } from "@midday/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Get QuickBooks integration
  const { data: app } = await supabase
    .from("apps")
    .select("id")
    .eq("team_id", team.id)
    .eq("app_id", "quickbooks")
    .single();

  if (!app) {
    return Response.json({ customers: [] });
  }

  // Query synced customers
  const { data: customers } = await supabase
    .from("synced_accounting_entities")
    .select("*")
    .eq("connection_id", app.id)
    .eq("entity_type", "customers")
    .order("updated_at", { ascending: false });

  return Response.json({
    customers: customers?.map(c => c.entity_data) || [],
  });
}
```

## Token Refresh Strategy

The background token refresh runs automatically every 30 minutes and handles:

### QuickBooks
- **Token Lifetime:** 1 hour (3600 seconds)
- **Refresh Window:** 1 hour before expiry
- **Refresh Trigger:** When `expires_in - elapsed_time < 1 hour`

### Xero
- **Token Lifetime:** 30 minutes (1800 seconds)
- **Refresh Window:** 30 minutes before expiry
- **Refresh Trigger:** When `expires_in - elapsed_time < 30 minutes`

### Manual Refresh (If Needed)

```typescript
import { refreshTokenIfNeeded } from "@midday/jobs/tasks/oauth/shared-token-refresh";

const config = app.config; // From database

const updatedConfig = await refreshTokenIfNeeded(
  config,
  "quickbooks", // or "xero"
  app.id
);

// updatedConfig now has fresh tokens
```

## Best Practices

### 1. Error Handling

```typescript
try {
  await syncQuickBooksEntity.trigger(payload);
} catch (error) {
  console.error("Sync failed:", error);
  // Log to error tracking service
  // Notify user via email/notification
}
```

### 2. Rate Limiting

QuickBooks and Xero have API rate limits. The sync tasks handle this internally with:
- Exponential backoff retries
- Respectful request pacing
- Error logging for rate limit errors

### 3. Data Consistency

```typescript
// Always use the latest synced data
const { data } = await supabase
  .from("synced_accounting_entities")
  .select("*")
  .eq("connection_id", appId)
  .order("updated_at", { ascending: false });
```

### 4. Monitoring

Monitor your background jobs:
- Check Trigger.dev dashboard for failed runs
- Set up alerts for repeated failures
- Monitor token refresh success rate
- Track sync latency

## Troubleshooting

### Tokens Not Refreshing

1. Check `token-refresh-scheduler` is running
2. Verify tokens in database have correct format
3. Check OAuth credentials in environment variables
4. View Trigger.dev logs for error details

### Sync Not Working

1. Verify app record exists in database
2. Check tokens are valid (not revoked)
3. Verify entity_type matches expected values
4. Check Trigger.dev dashboard for task failures

### Webhook Not Triggering

1. Verify webhook URL is publicly accessible
2. Check webhook signature verification
3. Ensure QuickBooks/Xero webhook is configured correctly
4. Check webhook payload format matches expected schema

## Production Checklist

- [ ] OAuth credentials configured for production
- [ ] Webhook URLs set to production endpoints
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Trigger.dev deployed to production
- [ ] Token refresh scheduler verified working
- [ ] Initial sync tested end-to-end
- [ ] Webhook handlers tested
- [ ] Error monitoring configured
- [ ] Rate limit handling verified

## Resources

- [Trigger.dev Documentation](https://trigger.dev/docs)
- [QuickBooks OAuth Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [Xero OAuth Guide](https://developer.xero.com/documentation/guides/oauth2/overview)
- [@midday/jobs README](../jobs/README.md)
- [@midday/jobs TESTING Guide](../jobs/TESTING.md)
