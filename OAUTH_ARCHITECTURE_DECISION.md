# OAuth Architecture Decision: @midday/oauth-sync vs Supabase OAuth API

## Current Situation

You now have **two OAuth systems**:

### 1. **@midday/oauth-sync** (Existing)
- **Location:** `/packages/oauth-sync`
- **Usage:** Used in pivot-dashboard's `/src/lib/oauth.ts`
- **Architecture:** Node.js package running in Next.js API routes
- **Storage:** Supabase `oauth_connections` table
- **Token Refresh:** In-app via `TokenSyncManager`

### 2. **Supabase OAuth API Gateway** (New)
- **Location:** `/github/Insync/supabase/functions/`
- **Usage:** Deployed Supabase Edge Functions
- **Architecture:** Deno Edge Functions with Postgres
- **Storage:** Supabase `provider_configs` table
- **Token Refresh:** Automatic via pg_cron every 30 min

## Comparison

| Feature | @midday/oauth-sync | Supabase OAuth API |
|---------|-------------------|-------------------|
| **Runtime** | Node.js (Next.js) | Deno (Edge Functions) |
| **Latency to DB** | ~50-100ms | <10ms (co-located) |
| **Token Refresh** | Manual trigger or cron | Automatic pg_cron |
| **Providers** | QB, Xero, Gmail, Outlook | QB, Xero, Sage, Fortnox |
| **Storage Table** | `oauth_connections` | `provider_configs` |
| **Auth Context** | NextAuth/Clerk/Supabase | Team ID based |
| **Data Sync** | ✅ Built-in (customers, invoices) | ❌ API only |
| **Distributed Locking** | ❌ | ✅ `oauth_locks` table |
| **Type Safety** | ✅ Full TypeScript + Zod | ✅ TypeScript |
| **Ease of Use** | ⭐⭐⭐⭐⭐ (3 lines of code) | ⭐⭐⭐ (HTTP client) |
| **Cost** | Included in Next.js | Edge Function costs |
| **Maintenance** | Local package updates | Supabase deployments |

## Recommendation: **Hybrid Approach** 🎯

**Keep both systems**, but use them for different purposes:

### Use **@midday/oauth-sync** for:
✅ **OAuth Authorization & Callback** (already implemented)
- Simple 3-line API routes
- Automatic auth context detection
- Built-in error handling

✅ **Data Sync Operations**
- Customer sync from QuickBooks/Xero
- Invoice sync
- Entity mapping with Zod schemas

✅ **User-Facing Features**
- Settings page connections list
- Manual connection triggers
- UI-driven operations

### Use **Supabase OAuth API** for:
✅ **Centralized Token Storage** (multi-tenant)
- Cross-app token sharing
- API-first access to tokens
- Future mobile app support

✅ **Automatic Token Refresh**
- Proactive refresh via pg_cron
- Background processing
- Distributed locking for concurrency

✅ **API Integrations**
- External service access to OAuth
- Webhook handlers
- Background jobs (Trigger.dev)

## Implementation Strategy

### Phase 1: **Dual Write Pattern** (Recommended Start)

Update your existing OAuth callback to write to **both** systems:

```typescript
// /apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts

import { oauth } from "@/lib/oauth"; // @midday/oauth-sync
import { oauthClient } from "@api/lib/oauth-client"; // Supabase API

export async function GET(request: Request, { params }: { params: Promise<{ provider: Provider }> }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const { provider } = await params;

  // 1. Use oauth-sync for callback (stores in oauth_connections)
  const connection = await oauth.callback(provider as any, request);

  // 2. Also sync to Supabase OAuth API (stores in provider_configs)
  try {
    await oauthClient.handleCallback(
      provider as any,
      code!,
      state!
    );
  } catch (error) {
    // Log but don't fail - local storage succeeded
    console.error('Supabase sync failed:', error);
  }

  redirect("/settings/integrations?success=true");
}
```

### Phase 2: **Read from Best Source**

Choose the best data source for each use case:

```typescript
// For UI operations - use @midday/oauth-sync
import { oauth } from "@/lib/oauth";

// Get connections for UI
const connections = await oauth.getConnections({ teamId });

// Sync customers from provider
const customers = await oauth.sync("customers", {
  provider: "quickbooks",
  teamId
});
```

```typescript
// For API/Background jobs - use Supabase OAuth API
import { oauthClient } from "@api/lib/oauth-client";

// Background job to sync all tenants
const customers = await oauthClient.getCustomers("quickbooks", tenantId);
```

### Phase 3: **Shared Token Access** (Future)

Eventually, migrate to a unified token source:

```typescript
// Update @midday/oauth-sync to read from Supabase API
import { SupabaseOAuthStorageAdapter } from "@midday/oauth-sync-core/storage";

export const oauth = new OAuthSync({
  storage: new SupabaseOAuthStorageAdapter({
    apiUrl: process.env.OAUTH_API_URL,
    apiKey: process.env.SUPABASE_ANON_KEY,
    // Maps to provider_configs table via API
  }),
  providers,
});
```

## Concrete Next Steps

### Option A: **Keep Separate (Recommended)**

**No changes needed to @midday/oauth-sync!**

Just add the dual-write pattern to your callback:

1. ✅ Keep using `@midday/oauth-sync` for all current features
2. ✅ Add Supabase API sync in callback (optional)
3. ✅ Use Supabase API for new features (mobile app, external APIs)

**Benefits:**
- No breaking changes
- Gradual migration
- Best of both worlds

### Option B: **Migrate to Supabase API**

Replace `@midday/oauth-sync` with Supabase API calls:

1. ❌ Remove `@midday/oauth-sync` dependency
2. ❌ Rewrite callback routes to use `oauthClient`
3. ❌ Lose data sync features (need to rebuild)
4. ❌ Lose auth context auto-detection

**Drawbacks:**
- More work upfront
- Loss of existing features
- Need to rebuild data sync

### Option C: **Create Supabase Storage Adapter**

Extend `@midday/oauth-sync` to use Supabase API as storage:

1. Create new storage adapter in `/packages/oauth-sync/core/src/storage/supabase-api.ts`
2. Implement `IStorageAdapter` interface
3. Calls Supabase Edge Functions under the hood
4. Keep all oauth-sync features

**Benefits:**
- Keep oauth-sync API
- Use Supabase backend
- Best of both worlds

## My Recommendation 🎯

**Option A: Keep Separate (Hybrid Approach)**

Here's why:

1. **@midday/oauth-sync is excellent** for the Pivot Dashboard use case:
   - Simple API routes (3 lines!)
   - Built-in data sync
   - Auth context detection
   - Already works perfectly

2. **Supabase OAuth API is excellent** for:
   - Centralized token management
   - Automatic background refresh
   - Future multi-app support
   - External API access

3. **No migration needed** - just enhance:
   - Add dual-write in callback (5 lines of code)
   - Use Supabase API for new features
   - Keep existing features working

## Code Changes Required

### Minimal Change: Add Dual Write

```typescript
// /apps/pivot-dashboard/src/app/api/oauth/[provider]/callback/route.ts

// Add this import
import { oauthClient } from "@api/lib/oauth-client";

// In your existing callback, after successful token storage:
export async function GET(request: Request, { params }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")!;
  const state = searchParams.get("state")!;
  const { provider } = await params;

  // ... existing oauth-sync logic ...

  // ADD: Sync to Supabase API (background, non-blocking)
  oauthClient.handleCallback(provider as any, code, state)
    .catch(err => console.error('Supabase sync failed:', err));

  redirect("/settings/integrations?success=true");
}
```

That's it! 2 lines of code. ✅

## Future Architecture

```
┌─────────────────────────────────────────────────┐
│           Pivot Dashboard (Next.js)             │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │      @midday/oauth-sync                  │  │
│  │                                          │  │
│  │  • OAuth flow (authorize/callback)       │  │
│  │  • Data sync (customers, invoices)       │  │
│  │  • UI operations                         │  │
│  └──────────────────────────────────────────┘  │
│                     │                           │
│                     │ (dual write)              │
│                     ↓                           │
└─────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│         Supabase OAuth API Gateway              │
│                                                 │
│  • Centralized token storage                   │
│  • Automatic refresh (pg_cron)                 │
│  • Multi-tenant support                        │
│  • External API access                         │
│  • Future mobile app support                   │
└─────────────────────────────────────────────────┘
```

## Decision Matrix

| If you need... | Use this |
|---------------|----------|
| OAuth authorization in Next.js | `@midday/oauth-sync` |
| OAuth callback handling | `@midday/oauth-sync` |
| Sync customers from QuickBooks | `@midday/oauth-sync` |
| UI connection management | `@midday/oauth-sync` |
| Centralized token storage | Supabase OAuth API |
| Automatic background refresh | Supabase OAuth API |
| External API access to tokens | Supabase OAuth API |
| Mobile app OAuth | Supabase OAuth API |
| Webhook handlers | Supabase OAuth API |
| Trigger.dev jobs | Supabase OAuth API |

## Conclusion

**You don't need to update @midday/oauth-sync!**

It's perfect for what it does. Just:

1. Keep using it for Pivot Dashboard
2. Use Supabase API for new use cases
3. Optionally add dual-write for token redundancy

Both systems complement each other beautifully. 🚀
