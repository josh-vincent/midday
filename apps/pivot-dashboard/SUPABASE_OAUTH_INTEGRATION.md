# Supabase OAuth Integration Guide

This guide shows how to integrate the Insync OAuth API Gateway (deployed on Supabase Edge Functions) with your Pivot Dashboard application.

## Architecture Overview

```
Pivot Dashboard (Next.js)
    ↓
tRPC API (pivot-api)
    ↓
Supabase OAuth Edge Functions
    ↓
OAuth Providers (Xero, QuickBooks, Sage, Fortnox)
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Supabase OAuth API Gateway
OAUTH_API_URL=https://ulncfblvuijlgniydjju.supabase.co/functions/v1/api
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik

# OAuth Provider Credentials (already configured in Supabase)
QUICKBOOKS_CLIENT_ID=ABquOQhQS7f0XJyVSD5MjK7QZltTnXVqTU264bxjdciOhpkx4n
QUICKBOOKS_CLIENT_SECRET=UNEfhLATd5rsn5g3BX417HMg6FtHL2IFv3zkiysN
XERO_CLIENT_ID=87F600BBB127488AAE900CA892EC0D40
XERO_CLIENT_SECRET=yUIphuIAit-jW7gNJeD1JcOAljcygGo2Qs5bOK6HdZnDRfr-

# Redirect URI
OAUTH_REDIRECT_URI=http://localhost:3336/api/oauth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3336
```

## Integration Options

### Option 1: Use Supabase OAuth API (Recommended)

**Pros:**
- Centralized token management
- Automatic token refresh (every 30 min via pg_cron)
- <10ms DB latency
- No connection string management
- Built-in distributed locking

**Implementation:**

The OAuth client is already created at `/apps/pivot-api/src/lib/oauth-client.ts`.

Use it in your tRPC routers:

```typescript
// apps/pivot-api/src/trpc/routers/accounting-connections.ts
import { oauthClient } from "@api/lib/oauth-client";

// Get authorization URL
const { authUrl } = await oauthClient.getAuthorizeUrl(
  'quickbooks',
  teamId
);

// Get customers from connected provider
const customers = await oauthClient.getCustomers(
  'quickbooks',
  teamId
);
```

### Option 2: Use Existing Next.js OAuth Routes

**Pros:**
- Already implemented
- Direct database access
- Full control over flow

**Current Implementation:**

The existing OAuth flow at `/apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts`:

1. Exchanges code for tokens
2. Stores in `oauth_connections` table
3. Redirects to integrations page

**To integrate with Supabase API:**

Update the callback to also sync with Supabase:

```typescript
// After successful token exchange
const { access_token, refresh_token, expires_in } = tokens;

// Sync with Supabase OAuth API
await oauthClient.handleCallback(
  provider,
  code,
  state
);
```

## Usage Examples

### 1. Initiate OAuth Connection (Frontend)

```typescript
// In your React component
import { trpc } from "@/trpc/client";

function ConnectQuickBooksButton() {
  const initiate = trpc.accountingConnections.initiateConnection.useMutation();

  const handleConnect = async () => {
    const { authUrl } = await initiate.mutateAsync({
      provider: 'quickbooks'
    });

    // Redirect to OAuth provider
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleConnect}>
      Connect QuickBooks
    </button>
  );
}
```

### 2. List Connections

```typescript
function ConnectionsList() {
  const { data: connections } = trpc.accountingConnections.get.useQuery();

  return (
    <div>
      {connections?.map(conn => (
        <div key={conn.id}>
          {conn.provider} - {conn.status}
        </div>
      ))}
    </div>
  );
}
```

### 3. Fetch Data from Connected Provider

```typescript
// In your tRPC router
import { oauthClient } from "@api/lib/oauth-client";

export const customersRouter = createTRPCRouter({
  getFromProvider: protectedProcedure
    .input(z.object({ provider: z.enum(['xero', 'quickbooks']) }))
    .query(async ({ input, ctx: { teamId } }) => {
      // Fetch customers from connected accounting software
      const customers = await oauthClient.getCustomers(
        input.provider,
        teamId
      );

      return customers;
    }),
});
```

## OAuth Flow Diagram

```
User clicks "Connect QuickBooks"
    ↓
Frontend: trpc.accountingConnections.initiateConnection()
    ↓
Backend tRPC: Calls oauthClient.getAuthorizeUrl()
    ↓
Supabase Edge Function: Returns authUrl
    ↓
Frontend: Redirects to QuickBooks
    ↓
User authorizes in QuickBooks
    ↓
QuickBooks: Redirects to /api/oauth/quickbooks/callback?code=xxx
    ↓
Next.js Callback Route: Exchanges code for tokens
    ↓
Option A: Stores in local oauth_connections table
Option B: Calls Supabase API to store in provider_configs
    ↓
Redirects to /settings/integrations?success=true
```

## Token Refresh

### Automatic Refresh (Supabase API)

Tokens are automatically refreshed every 30 minutes for tokens expiring in < 60 minutes via:

1. **pg_cron** triggers every 30 min
2. Calls `refresh-tokens` Edge Function
3. Queries `get_expiring_tokens()` Postgres function
4. Refreshes in batches of 10
5. Updates `provider_configs` table

### Manual Refresh

```typescript
// Trigger manual refresh via API
const response = await fetch(
  'https://ulncfblvuijlgniydjju.supabase.co/functions/v1/refresh-tokens',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
);

const result = await response.json();
// { success: true, refreshed: 5, failed: 0, total: 5 }
```

## Testing

### 1. Test OAuth Client

```typescript
// apps/pivot-api/test-oauth.ts
import { oauthClient } from './src/lib/oauth-client';

async function test() {
  // Health check
  const health = await oauthClient.checkHealth();
  console.log('Health:', health);

  // Get auth URL
  const { authUrl } = await oauthClient.getAuthorizeUrl(
    'quickbooks',
    'test-team-123'
  );
  console.log('Auth URL:', authUrl);
}

test();
```

### 2. Test OAuth Flow

1. Visit: http://localhost:3336/settings/integrations
2. Click "Connect QuickBooks"
3. Authorize in QuickBooks sandbox
4. Should redirect back with success

## Database Schema

### Current (Next.js)

```sql
-- oauth_connections table (local database)
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  provider TEXT,
  credentials JSONB,
  expires_at TIMESTAMPTZ,
  realm_id TEXT,
  tenant_id TEXT,
  environment TEXT
);
```

### Supabase OAuth API

```sql
-- provider_configs table (Supabase)
CREATE TABLE provider_configs (
  id TEXT PRIMARY KEY,
  provider TEXT,
  tenant_id TEXT,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  base_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Migration Strategy

### Phase 1: Dual Write (Recommended)

Write to both systems during transition:

```typescript
// In callback route
// 1. Store in local database
await supabase.from('oauth_connections').upsert(connectionData);

// 2. Also store in Supabase OAuth API
await oauthClient.handleCallback(provider, code, state);
```

### Phase 2: Read from Supabase

Gradually migrate reads to Supabase API:

```typescript
// Old: Read from local DB
const connections = await getAccountingConnectionsByTeamId(db, teamId);

// New: Read from Supabase API
const connections = await oauthClient.getConnections(teamId);
```

### Phase 3: Sunset Local Storage

Once stable, remove local oauth_connections table.

## Monitoring

### Check Token Refresh Status

```bash
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  https://ulncfblvuijlgniydjju.supabase.co/functions/v1/api/health
```

### View Logs

```bash
# Edge Functions logs
supabase functions logs api --project-ref ulncfblvuijlgniydjju

# Database logs
# Via Supabase Dashboard → Logs
```

## Troubleshooting

### OAuth Callback Fails

1. Check redirect URI matches exactly:
   ```bash
   # Supabase: https://localhost.com/callback
   # Next.js: http://localhost:3336/api/oauth/[provider]/callback
   ```

2. Update Supabase secrets:
   ```bash
   supabase secrets set OAUTH_REDIRECT_URI=http://localhost:3336/api/oauth/quickbooks/callback --project-ref ulncfblvuijlgniydjju
   ```

### Token Refresh Not Working

1. Check pg_cron job:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-oauth-locks';
   ```

2. Manually trigger refresh:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     https://ulncfblvuijlgniydjju.supabase.co/functions/v1/refresh-tokens
   ```

### Connection Shows Expired

1. Check expires_at timestamp
2. Verify refresh_token exists
3. Check provider token expiry (usually 1 hour)

## Next Steps

1. ✅ OAuth API Gateway deployed on Supabase
2. ✅ OAuth client created (`/apps/pivot-api/src/lib/oauth-client.ts`)
3. ✅ tRPC router updated with `initiateConnection` endpoint
4. ⏳ Update Next.js callback to sync with Supabase API
5. ⏳ Migrate connections list to read from Supabase
6. ⏳ Add UI components for connection management

## Resources

- Supabase Dashboard: https://supabase.com/dashboard/project/ulncfblvuijlgniydjju
- Edge Functions: https://supabase.com/dashboard/project/ulncfblvuijlgniydjju/functions
- OAuth API Code: `/Users/mini/Claude/github/Insync/supabase/functions/`
- Integration Docs: This file
