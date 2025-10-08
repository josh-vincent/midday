# OAuth Integration Guide

This application uses **OAuth Sync v3** for OAuth token management with **zero configuration** required.

## Features

✅ **Zero Configuration** - Auto-detects everything from environment variables
✅ **Auto Token Refresh** - Tokens refresh automatically in the background
✅ **Provider-Optimized** - Different refresh intervals for each provider
✅ **Cross-Platform** - Works on Vercel, Cloudflare, AWS, Deno, Node.js
✅ **Secure Storage** - Tokens stored in Supabase/Postgres with encryption

## Quick Start

### 1. Set Environment Variables

Copy `.env.example` to `.env.local` and fill in your OAuth credentials:

```bash
cp .env.example .env.local
```

Required variables:

```bash
# Storage (Supabase auto-detected)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Xero
OAUTH_XERO_CLIENT_ID=your-xero-client-id
OAUTH_XERO_CLIENT_SECRET=your-xero-client-secret

# QuickBooks
OAUTH_QB_CLIENT_ID=your-quickbooks-client-id
OAUTH_QB_CLIENT_SECRET=your-quickbooks-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3333
```

### 2. Database Setup

OAuth Sync v3 requires an `oauth_connections` table in your database. The table schema is:

```sql
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  user_id TEXT,
  org_id TEXT,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  realm_id TEXT,  -- QuickBooks specific
  tenant_id TEXT, -- Xero specific
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_id, provider)
);

-- Index for faster lookups
CREATE INDEX idx_oauth_team_provider ON oauth_connections(team_id, provider);
CREATE INDEX idx_oauth_expiring ON oauth_connections(expires_at) WHERE expires_at IS NOT NULL;
```

### 3. Run the Application

```bash
npm run dev
```

Navigate to Settings → Integrations to connect your OAuth providers.

## How It Works

### Authorization Flow

1. User clicks "Connect" button on an integration
2. App redirects to `/api/oauth/[provider]/authorize`
3. OAuth Sync v3 generates authorization URL and redirects to provider
4. Provider redirects back to `/api/oauth/[provider]/callback`
5. App exchanges code for tokens and saves to database
6. User sees "Connected" badge on integration

### Token Management

OAuth Sync v3 automatically:
- **Xero**: Refreshes every 10 minutes (30min token lifetime)
- **QuickBooks**: Refreshes every 15 minutes (60min token lifetime)
- **Gmail**: Refreshes every 15 minutes (60min token lifetime)
- **Outlook**: Refreshes every 15 minutes (60min token lifetime)

### API Routes

- `GET /api/oauth/[provider]/authorize` - Start OAuth flow
- `GET /api/oauth/[provider]/callback` - Handle OAuth callback
- `GET /api/oauth/connections` - List all connections
- `POST /api/oauth/disconnect` - Disconnect a connection

## Usage Examples

### Server-Side (API Routes/Server Actions)

```typescript
import { oauth } from "@/lib/oauth";

// Get all tokens (auto-detects user from session)
const tokens = await oauth.getTokens();
const xeroToken = tokens.xero;

// Fetch from Xero API
const invoices = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
  headers: { Authorization: `Bearer ${xeroToken}` }
});
```

### Client-Side (React Components)

```typescript
import { useState, useEffect } from "react";

function MyComponent() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    async function fetchConnections() {
      const res = await fetch("/api/oauth/connections");
      const data = await res.json();
      setConnections(data.connections);
    }
    fetchConnections();
  }, []);

  return (
    <div>
      {connections.map(conn => (
        <div key={conn.id}>{conn.provider} connected</div>
      ))}
    </div>
  );
}
```

## Configuration (Optional)

While zero configuration works out of the box, you can customize OAuth Sync v3:

```typescript
// lib/oauth.ts
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  // Override storage
  storage: 'postgres',

  // Override auto-refresh intervals
  autoRefresh: {
    enabled: true,
    perProviderConfig: {
      intervals: {
        xero: 5,  // Check every 5 minutes
      },
      thresholds: {
        xero: 25, // Refresh when 25 min left
      }
    }
  }
});
```

## Supported Providers

| Provider | Status | Token Lifetime | Refresh Interval |
|----------|--------|---------------|------------------|
| Xero | ✅ Active | 30 minutes | 10 minutes |
| QuickBooks | ✅ Active | 60 minutes | 15 minutes |
| Gmail | 🚧 Coming Soon | 60 minutes | 15 minutes |
| Outlook | 🚧 Coming Soon | 60 minutes | 15 minutes |

## Troubleshooting

### Tokens Not Refreshing

- Check that auto-refresh is enabled in `lib/oauth.ts`
- Verify environment variables are set correctly
- Check database for expiring tokens
- Look for errors in server logs

### OAuth Callback Errors

Common errors:
- `missing_code` - Authorization code not provided by OAuth provider
- `missing_team_id` - Team ID not in session/localStorage
- `token_exchange_failed` - Invalid client credentials or expired code
- `storage_failed` - Database connection or schema issue

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check that `oauth_connections` table exists
- Ensure table has correct schema and indexes

## Security

- ✅ Tokens stored encrypted in database
- ✅ OAuth 2.0 authorization code flow (most secure)
- ✅ Automatic token refresh prevents expired tokens
- ✅ CSRF protection via state parameter
- ✅ HTTPS required in production

## Resources

- [OAuth Sync v3 Documentation](../packages/oauth-sync/simplified/README.md)
- [Xero OAuth Guide](https://developer.xero.com/documentation/guides/oauth2/auth-flow/)
- [QuickBooks OAuth Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
