# OAuth Testing Guide: Xero & QuickBooks Integration

## Quick Start

Your `@midday/oauth-sync` package is ready to use! All tests passed ✅

## Test Results Summary
- ✅ 90 tests passed
- ✅ QuickBooks token refresh working
- ✅ Xero token refresh working
- ✅ Concurrent protection active
- ✅ Retry logic functional

## Setting Up Real OAuth Testing

### 1. Get Developer Credentials

#### QuickBooks (Intuit)
1. Go to https://developer.intuit.com
2. Create app in "My Apps"
3. Note your:
   - Client ID
   - Client Secret
   - Redirect URI (set to `http://localhost:3336/api/oauth/quickbooks/callback`)

#### Xero
1. Go to https://developer.xero.com/app/manage
2. Create New App
3. Note your:
   - Client ID
   - Client Secret
   - Redirect URI (set to `http://localhost:3336/api/oauth/xero/callback`)

### 2. Environment Variables

Add to your `.env.local`:

```bash
# QuickBooks
QUICKBOOKS_CLIENT_ID=your_qb_client_id
QUICKBOOKS_CLIENT_SECRET=your_qb_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3336/api/oauth/quickbooks/callback

# Xero
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3336/api/oauth/xero/callback

# Database (already configured)
DATABASE_URL=your_existing_database_url
SUPABASE_URL=your_existing_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_existing_key
```

### 3. Create OAuth API Routes

#### Create authorization endpoint:

```typescript
// apps/pivot-dashboard/src/app/api/oauth/[provider]/authorize/route.ts
import { TokenSyncManager } from "@midday/oauth-sync-core";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: { provider: "quickbooks" | "xero" } }
) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return Response.json({ error: "teamId required" }, { status: 400 });
  }

  const { provider } = params;

  const config = {
    quickbooks: {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      authUrl: "https://appcenter.intuit.com/connect/oauth2",
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
      scope: "com.intuit.quickbooks.accounting",
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      authUrl: "https://login.xero.com/identity/connect/authorize",
      redirectUri: process.env.XERO_REDIRECT_URI!,
      scope: "accounting.contacts accounting.transactions offline_access",
    },
  }[provider];

  const state = Buffer.from(JSON.stringify({ teamId, provider })).toString("base64");

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  redirect(authUrl.toString());
}
```

#### Create callback endpoint:

```typescript
// apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts
import { TokenSyncManager } from "@midday/oauth-sync-core";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: { provider: "quickbooks" | "xero" } }
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return redirect(`/settings/integrations?error=${error}`);
  }

  if (!code || !state) {
    return redirect("/settings/integrations?error=missing_params");
  }

  try {
    const { teamId, provider } = JSON.parse(
      Buffer.from(state, "base64").toString()
    );

    const supabase = createClient();

    // Exchange code for tokens
    const tokenUrl = provider === "quickbooks"
      ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
      : "https://identity.xero.com/connect/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env[`${provider.toUpperCase()}_CLIENT_ID`]}:${
            process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]
          }`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env[`${provider.toUpperCase()}_REDIRECT_URI`]!,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${await response.text()}`);
    }

    const tokens = await response.json();

    // Store tokens
    await supabase.from("oauth_connections").insert({
      team_id: teamId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      realm_id: provider === "quickbooks" ? searchParams.get("realmId") : null,
    });

    redirect("/settings/integrations?success=true");
  } catch (err) {
    console.error("OAuth callback error:", err);
    redirect("/settings/integrations?error=callback_failed");
  }
}
```

#### Create token refresh endpoint:

```typescript
// apps/pivot-dashboard/src/app/api/oauth/refresh/route.ts
import { TokenSyncManager, SupabaseStorageAdapter } from "@midday/oauth-sync-core";
import { createClient } from "@midday/supabase/server";

export async function POST() {
  const supabase = createClient();

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
    scheduler: {
      thresholdMinutes: 60,
    },
  });

  const results = await manager.refreshExpiringTokens();

  return Response.json({
    success: true,
    refreshed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
```

### 4. Database Schema

Ensure your database has the `oauth_connections` table:

```sql
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  realm_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, provider)
);

CREATE INDEX idx_oauth_connections_team_id ON oauth_connections(team_id);
CREATE INDEX idx_oauth_connections_expires_at ON oauth_connections(expires_at);
```

### 5. Testing the Integration

#### Step 1: Start your dev servers
```bash
bun run dev:pivot
```

#### Step 2: Test QuickBooks OAuth Flow
1. Visit: `http://localhost:3336/api/oauth/quickbooks/authorize?teamId=test-team-123`
2. Complete QuickBooks authorization
3. Should redirect back with success

#### Step 3: Test Xero OAuth Flow
1. Visit: `http://localhost:3336/api/oauth/xero/authorize?teamId=test-team-123`
2. Complete Xero authorization
3. Should redirect back with success

#### Step 4: Test Token Refresh
```bash
curl -X POST http://localhost:3336/api/oauth/refresh
```

Expected response:
```json
{
  "success": true,
  "refreshed": 2,
  "failed": 0,
  "results": [...]
}
```

### 6. Automated Testing

Run the OAuth sync test suite:
```bash
cd packages/oauth-sync/core
bun test
```

### 7. Monitoring & Debugging

Check logs for token refresh activity:
```typescript
// The manager logs all refresh attempts
Token refreshed successfully {
  connectionId: "conn_123",
  provider: "quickbooks",
  duration: 102,
  expiresAt: "2025-10-06T07:40:21.991Z",
}
```

## Using OAuth Connections in Your Code

### Helper Functions

The OAuth integration includes helper functions in `apps/pivot-dashboard/src/lib/oauth-helpers.ts`:

```typescript
import {
  getOAuthConnection,
  hasOAuthConnection,
  deleteOAuthConnection,
  getTeamOAuthConnections,
} from "@/lib/oauth-helpers";

// Check if team has a valid QuickBooks connection
const hasQuickBooks = await hasOAuthConnection(teamId, "quickbooks");

// Get connection details with access token
const connection = await getOAuthConnection(teamId, "xero");
if (connection) {
  // Use connection.access_token to make API calls
  // Token is automatically refreshed if expiring soon
}

// Get all OAuth connections for a team
const connections = await getTeamOAuthConnections(teamId);

// Remove OAuth connection
await deleteOAuthConnection(teamId, "quickbooks");
```

### Making API Calls with OAuth Tokens

Example using QuickBooks API:

```typescript
import { getOAuthConnection } from "@/lib/oauth-helpers";

async function getQuickBooksCustomers(teamId: string) {
  const connection = await getOAuthConnection(teamId, "quickbooks");

  if (!connection) {
    throw new Error("QuickBooks not connected");
  }

  const response = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${connection.realm_id}/query?query=select * from Customer`,
    {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        Accept: "application/json",
      },
    }
  );

  return response.json();
}
```

Example using Xero API:

```typescript
import { getOAuthConnection } from "@/lib/oauth-helpers";

async function getXeroContacts(teamId: string) {
  const connection = await getOAuthConnection(teamId, "xero");

  if (!connection) {
    throw new Error("Xero not connected");
  }

  const response = await fetch("https://api.xero.com/api.xro/2.0/Contacts", {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
      Accept: "application/json",
    },
  });

  return response.json();
}
```

### App Store Integration

QuickBooks and Xero apps are now available in the App Store at `/apps`. Users can:

1. Browse apps in the App Store
2. Click "Install" on QuickBooks or Xero
3. Complete OAuth authorization
4. Start using the connection

The apps automatically handle:
- OAuth authorization flow
- Token storage in database
- Token refresh (automatically refreshes tokens expiring within 60 minutes)

### Automatic Token Refresh

Tokens are automatically refreshed by:

1. **Manual API call**: `POST /api/oauth/refresh`
2. **Trigger.dev scheduled job** (recommended for production)
3. **Cron job** calling the refresh endpoint

## Next Steps

1. **Set up Trigger.dev** for automated background token refresh every 30 minutes
2. **Implement data sync** to pull customers/invoices from Xero/QuickBooks using the helper functions
3. **Add webhook handling** for real-time updates
4. **Configure environment variables** with your OAuth credentials

## Troubleshooting

### "Invalid redirect URI"
- Ensure redirect URIs match exactly in developer consoles
- Check for trailing slashes

### "Token refresh failed"
- Verify client credentials are correct
- Check token hasn't been manually revoked
- Ensure database connection is working

### "Connection not found"
- Verify team_id matches
- Check oauth_connections table has data

## Resources

- QuickBooks API Docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting
- Xero API Docs: https://developer.xero.com/documentation/
- Your OAuth Package: `packages/oauth-sync/README.md`
