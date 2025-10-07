# @midday/oauth-sync

**Simplified OAuth 2.0 token management for QuickBooks, Xero, and more.**

A comprehensive OAuth synchronization package that handles token refresh, storage, and authentication context automatically. Built for Next.js applications with Supabase, but works in any JavaScript runtime.

## ✨ Features

- ✅ **Automatic Token Refresh** - Refreshes tokens before expiration
- ✅ **Multi-Provider** - QuickBooks, Xero, Gmail, Outlook
- ✅ **Auth Context Detection** - Auto-detects NextAuth, Clerk, Supabase Auth
- ✅ **Storage Adapters** - Supabase, PostgreSQL, KV stores
- ✅ **Data Sync** - Optional customer/invoice sync from providers
- ✅ **Type-Safe** - Full TypeScript support with Zod schemas
- ✅ **Production-Ready** - Handles errors, retries, distributed locking

## 📦 Packages

### [@midday/oauth-sync](./simplified) - Main Package (You are here)

Comprehensive OAuth sync with automatic refresh and data sync.

### [@midday/oauth-sync-core](./core) - Core Library

Runtime-agnostic OAuth providers and storage adapters.

### [@midday/oauth-sync-trigger](./trigger) - Trigger.dev Integration

Scheduled token refresh tasks for Trigger.dev.

### [@midday/oauth-sync-cloudflare](./cloudflare) - Cloudflare Workers

Token refresh for Cloudflare Workers.

## 🚀 Quick Start

### Installation

```bash
bun add @midday/oauth-sync
```

### Basic Usage

```typescript
import { createOAuthSync } from "@midday/oauth-sync";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core/storage";
import { createClient } from "@midday/supabase/server";

// Create centralized OAuth instance
export const oauth = createOAuthSync({
  providers: {
    quickbooks: {
      clientId: process.env.OAUTH_QB_CLIENT_ID!,
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET!,
      environment: "sandbox", // or "production"
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

// Authorization Route (3 lines)
export async function GET(request: Request, { params }) {
  const { provider } = await params;
  return oauth.authorize(provider, request);
}

// Callback Route (3 lines)
export async function GET(request: Request, { params }) {
  const { provider } = await params;
  const connection = await oauth.callback(provider, request);
  redirect("/settings/integrations?success=true");
}
```

**That's it!** The package handles:
- ✅ Token exchange
- ✅ Auth context (user/team ID)
- ✅ Database storage
- ✅ Realm ID / Tenant ID extraction
- ✅ Error handling

### Advanced: Data Sync

Optional automatic data sync from providers:

```typescript
export const oauth = createOAuthSync({
  providers: { /* ... */ },
  storage: /* ... */,

  // Add data sync configuration
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
  },
});

// Sync customers from QuickBooks
const results = await oauth.sync("customers", { provider: "quickbooks" });
```

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get started in 5 minutes
- **[Core Package](./core/README.md)** - Low-level APIs and providers
- **[Trigger.dev Integration](./trigger/README.md)** - Scheduled token refresh
- **[Cloudflare Workers](./cloudflare/README.md)** - Edge runtime support

## 🏗️ Architecture

```
@midday/oauth-sync/
├── simplified/     # Main package (createOAuthSync)
├── core/           # Runtime-agnostic providers & storage
├── trigger/        # Trigger.dev integration
└── cloudflare/     # Cloudflare Workers integration
```

## 🔌 Supported Providers

- ✅ **QuickBooks Online** - Sandbox & Production
- ✅ **Xero** - Accounting API
- ✅ **Gmail** - Google OAuth
- ✅ **Outlook** - Microsoft OAuth

## 💾 Storage Adapters

- ✅ **Supabase** - PostgreSQL with RLS
- ✅ **PostgreSQL** - Direct postgres.js connection
- ✅ **Cloudflare KV** - Edge storage
- ✅ **Custom** - Implement `IStorageAdapter`

## 🔐 Auth Context Detection

Automatically detects authentication context from:

- ✅ **Supabase Auth** - `auth.getUser()`
- ✅ **NextAuth** - `getServerSession()`
- ✅ **Clerk** - `auth()`
- ✅ **Custom JWT** - Custom extractor function

## 📚 Examples

See individual package READMEs for detailed examples:

- [Quick Start Guide](./QUICKSTART.md)
- [Core Package](./core/README.md)
- [Trigger.dev Integration](./trigger/README.md)
- [Cloudflare Workers](./cloudflare/README.md)

## 🧪 Testing

```bash
# Test core package
cd packages/oauth-sync/core
bun test

# Test all packages
bun test
```

## 📝 License

MIT

## 🙏 Acknowledgments

Architecture inspired by [@ai-sdk-tools](https://github.com/midday-ai/ai-sdk-tools) - modular, focused packages for AI development.
