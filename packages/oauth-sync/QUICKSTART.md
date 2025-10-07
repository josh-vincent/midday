# OAuth Sync - Quick Start Guide

## 🚀 Simple Next.js Implementation

Replace 100+ lines of OAuth code with just a few lines using `@midday/oauth-sync`.

### 1. Install

```bash
bun add @midday/oauth-sync
```

### 2. Environment Variables

```env
# QuickBooks (automatically uses correct sandbox/production URLs)
OAUTH_QB_CLIENT_ID=your_client_id
OAUTH_QB_CLIENT_SECRET=your_client_secret
OAUTH_QB_ENVIRONMENT=sandbox  # or 'production'

# Xero
OAUTH_XERO_CLIENT_ID=your_client_id
OAUTH_XERO_CLIENT_SECRET=your_client_secret

# Gmail
OAUTH_GMAIL_CLIENT_ID=your_client_id
OAUTH_GMAIL_CLIENT_SECRET=your_client_secret

# Outlook
OAUTH_OUTLOOK_CLIENT_ID=your_client_id
OAUTH_OUTLOOK_CLIENT_SECRET=your_client_secret

# App URL (for redirect URIs)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (for storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Server-Side: OAuth Callback Route

**Before (122 lines):**
```typescript
// apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: Request, { params }: { params: Promise<{ provider: Provider }> }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // ... 100+ lines of manual OAuth token exchange, storage, error handling ...

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Token exchange failed:", errorText);
    return redirect("/apps?error=token_exchange_failed");
  }

  // ... more manual code ...
}
```

**After (10 lines):**
```typescript
// apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts
import { createOAuthSync } from "@midday/oauth-sync";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core/storage";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

const oauth = createOAuthSync({
  providers: {
    quickbooks: {
      clientId: process.env.OAUTH_QB_CLIENT_ID!,
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET!,
      environment: process.env.OAUTH_QB_ENVIRONMENT as "sandbox" | "production" || "production",
    },
    xero: {
      clientId: process.env.OAUTH_XERO_CLIENT_ID!,
      clientSecret: process.env.OAUTH_XERO_CLIENT_SECRET!,
    },
  },
  storage: new SupabaseStorageAdapter({
    createClient: async () => await createClient(),
  }),
  authExtractor: "auto", // Auto-detects NextAuth, Clerk, or Supabase Auth
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: "quickbooks" | "xero" }> }
) {
  try {
    const { provider } = await params;

    // Returns ConnectionRecord with all token info
    const connection = await oauth.callback(provider, request);

    // Redirect with success - auth context (teamId, userId) extracted automatically
    // Connection saved to Supabase with realm_id/tenant_id
    return redirect("/apps?success=true");
  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect("/apps?error=callback_failed");
  }
}
```

### 4. Server-Side: Authorization Route

```typescript
// apps/pivot-dashboard/src/app/api/oauth/[provider]/authorize/route.ts
import { createOAuthSync } from "@midday/oauth-sync";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core/storage";
import { createClient } from "@midday/supabase/server";

const oauth = createOAuthSync({
  providers: {
    quickbooks: {
      clientId: process.env.OAUTH_QB_CLIENT_ID!,
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET!,
      environment: process.env.OAUTH_QB_ENVIRONMENT as "sandbox" | "production" || "production",
    },
    xero: {
      clientId: process.env.OAUTH_XERO_CLIENT_ID!,
      clientSecret: process.env.OAUTH_XERO_CLIENT_SECRET!,
    },
  },
  storage: new SupabaseStorageAdapter({
    createClient: async () => await createClient(),
  }),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: "quickbooks" | "xero" }> }
) {
  const { provider } = await params;

  // Automatically generates correct authorization URL (sandbox vs production)
  // Automatically sets redirect URI to: {NEXT_PUBLIC_APP_URL}/api/oauth/{provider}/callback
  return oauth.authorize(provider);
}
```

### 5. Client-Side: Connect Button

```typescript
// apps/pivot-dashboard/src/components/connect-provider.tsx
"use client";

export function ConnectProvider({ provider }: { provider: "quickbooks" | "xero" }) {
  const handleConnect = () => {
    // Automatically redirects to /api/oauth/{provider}/authorize
    window.location.href = `/api/oauth/${provider}/authorize`;
  };

  return (
    <button onClick={handleConnect}>
      Connect {provider === "quickbooks" ? "QuickBooks" : "Xero"}
    </button>
  );
}
```

## ✨ What's Handled Automatically

### URLs
- ✅ **Sandbox vs Production**: Automatically uses correct URLs based on `environment` config
  - QuickBooks sandbox: `sandbox-quickbooks.api.intuit.com`
  - QuickBooks production: `quickbooks.api.intuit.com`
  - Xero: Always uses production (no separate sandbox)

- ✅ **Authorization URLs**: Generated automatically with correct scopes
- ✅ **Token Exchange URLs**: Configured per provider
- ✅ **Redirect URIs**: Auto-generated from `NEXT_PUBLIC_APP_URL`

### Auth Context
- ✅ **NextAuth**: Auto-detects session, extracts `userId`, `teamId`, `orgId`
- ✅ **Clerk**: Auto-detects Clerk session
- ✅ **Supabase Auth**: Auto-detects Supabase user
- ✅ **Custom JWT**: Configurable JWT extraction

### Token Management
- ✅ **Storage**: Automatic upserts to Supabase `oauth_connections` table
- ✅ **Expiration**: Calculates `expiresAt` automatically
- ✅ **Refresh**: Can auto-refresh tokens before expiry (optional)
- ✅ **Realm/Tenant IDs**: Extracted automatically (QuickBooks `realmId`, Xero `tenantId`)

### Error Handling
- ✅ **OAuth Errors**: Catches authorization errors, token exchange failures
- ✅ **Storage Errors**: Handles database connection issues
- ✅ **Validation**: Validates all inputs with Zod schemas

## 🔧 Advanced: Data Sync

Want to automatically sync customers, invoices, etc.? Add 3 lines:

```typescript
const oauth = createOAuthSync({
  providers: { /* ... */ },
  storage: /* ... */,

  // Add database sync
  database: {
    type: "postgres",
    connectionString: process.env.DATABASE_URL!,
  },

  // Configure what to sync
  sync: {
    customers: {
      schema: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
      }),
      table: "customers",
      strategy: "upsert", // or 'replace', 'append', 'incremental'
    },
    invoices: {
      schema: InvoiceSchema,
      table: "invoices",
      strategy: "incremental",
    },
  },
});

// Then sync data
const results = await oauth.sync("customers");
// Automatically fetches from provider API and writes to database
```

## 📦 Supabase Schema

Create this table if it doesn't exist:

```sql
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  org_id TEXT,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  realm_id TEXT,
  tenant_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(team_id, provider)
);

CREATE INDEX idx_oauth_connections_team_id ON oauth_connections(team_id);
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_expires_at ON oauth_connections(expires_at);
```

## 🎯 Key Benefits

| Before | After |
|--------|-------|
| 122 lines of code | 10 lines of code |
| Manual URL construction | Auto-detected (sandbox/prod) |
| Hardcoded token endpoints | Provider-specific configs |
| Manual token exchange | Automatic OAuth flow |
| Manual database writes | Automatic storage |
| No auth context | Auto-detects user/team |
| No error handling | Built-in error handling |
| No token refresh | Optional auto-refresh |

## 🔐 Provider-Specific Notes

### QuickBooks
- Set `environment: "sandbox"` for testing
- Set `environment: "production"` for live
- Automatically extracts `realmId` from callback

### Xero
- Always uses production URLs
- Automatically extracts `tenantId` from tokens

### Gmail/Outlook
- Requires offline access scope (handled automatically)
- Refresh tokens valid for extended periods

## Need Help?

Check the full API reference in `packages/oauth-sync/README.md`
