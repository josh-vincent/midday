# OAuth Testing with @midday/oauth-sync-core

This implementation uses the **REAL** `@midday/oauth-sync-core` package with localStorage storage for testing.

## 🎯 What's Being Tested

✅ **Real OAuth Package**: Uses actual `QuickBooksProvider` and `XeroProvider` from `@midday/oauth-sync-core`
✅ **Real Storage Adapter**: Uses `LocalStorageAdapter` that implements `IStorageAdapter` interface
✅ **Real Token Management**: Token expiration calculation using provider classes
✅ **Full Type Safety**: All types from the OAuth package (`ConnectionRecord`, `OAuthProvider`, etc.)
✅ **Production-Ready Code**: Only the storage backend (localStorage) is for testing

## 🧪 Testing Mode Features

- **localStorage Storage**: OAuth tokens stored using `LocalStorageAdapter` from the OAuth package
- **Mock Token Exchange**: Simulated OAuth flow (real flow would call QuickBooks/Xero APIs)
- **Real Providers**: Uses actual `QuickBooksProvider` and `XeroProvider` classes
- **Real UI**: Full UI experience with connection management

## 📍 Testing Instructions

### 1. Navigate to Integrations Page

```
http://localhost:3336/settings/integrations
```

### 2. Connect QuickBooks

1. Click "Connect" on the QuickBooks card
2. You'll be redirected through a mock OAuth flow
3. Connection will appear in the "Connected Accounts" section
4. Token details are stored in localStorage

### 3. Connect Xero

1. Click "Connect" on the Xero card
2. You'll be redirected through a mock OAuth flow
3. Connection will appear in the "Connected Accounts" section
4. Token details are stored in localStorage

### 4. View Connections

Connected integrations show:
- Provider name (QuickBooks/Xero)
- Tenant/Organization name
- Connection status (Active/Expiring Soon/Expired)
- Delete button

### 5. Delete Connections

Click the delete icon (trash) on any connection to remove it from localStorage.

## 🔍 Inspect localStorage

Open browser DevTools > Application > Local Storage > `oauth_connections`

You'll see all stored connections in JSON format:

```json
[
  {
    "id": "conn_1234567890_abc123",
    "provider": "quickbooks",
    "teamId": "mock_team_123",
    "userId": "mock_user_123",
    "credentials": {
      "accessToken": "mock_qb_access_1234567890",
      "refreshToken": "mock_qb_refresh_1234567890",
      "expiresIn": 3600,
      "expiresAt": "2025-10-05T23:00:00.000Z",
      "connectedAt": "2025-10-05T22:00:00.000Z",
      "scope": "com.intuit.quickbooks.accounting",
      "tokenType": "bearer"
    },
    "tenantId": "123456789",
    "tenantName": "Test QuickBooks Company",
    "createdAt": "2025-10-05T22:00:00.000Z",
    "updatedAt": "2025-10-05T22:00:00.000Z",
    "expiresAt": "2025-10-05T23:00:00.000Z"
  }
]
```

## 🔧 Files Created

### Storage Utility
- `src/lib/oauth-storage.ts` - localStorage CRUD operations

### API Routes (Mock)
- `src/app/api/accounting/quickbooks/authorize/route.ts` - QuickBooks auth
- `src/app/api/accounting/quickbooks/callback/route.ts` - QuickBooks callback
- `src/app/api/accounting/xero/authorize/route.ts` - Xero auth
- `src/app/api/accounting/xero/callback/route.ts` - Xero callback

### UI Components
- `src/components/accounting-connections.tsx` - Main container
- `src/components/connect-quickbooks.tsx` - QuickBooks connect button
- `src/components/connect-xero.tsx` - Xero connect button
- `src/components/accounting-connection-status.tsx` - Status indicator

### Page
- `src/app/[locale]/(app)/(sidebar)/settings/integrations/page.tsx`

## 🚀 Production Migration

When ready for production:

1. **Replace localStorage with database**:
   - Use `@midday/oauth-sync-core` package
   - Store connections in `accounting_connections` table
   - Use tRPC routes from `apps/pivot-api/src/trpc/routers/accounting-connections.ts`

2. **Replace mock OAuth routes**:
   - Implement real OAuth authorization URLs
   - Exchange auth codes for real tokens
   - Store environment variables for client credentials

3. **Add token refresh**:
   - Use `TokenSyncManager` from `@midday/oauth-sync-core`
   - Set up scheduled job (Trigger.dev/Cloudflare Workers)
   - Auto-refresh expiring tokens

4. **Update components**:
   - Replace `getOAuthConnections()` with `trpc.accountingConnections.get`
   - Replace `saveOAuthConnection()` with database insert
   - Replace `deleteOAuthConnection()` with `trpc.accountingConnections.delete`

## 📦 How the Real OAuth Package is Used

### OAuth Routes Use Real Providers

```typescript
// apps/pivot-dashboard/src/app/api/accounting/quickbooks/callback/route.ts
import { QuickBooksProvider } from "@midday/oauth-sync-core/providers";

const provider = new QuickBooksProvider();
const expiresAt = provider.calculateExpiresAt(mockInitialTokens.expiresIn);
```

### Storage Uses Real Adapter

```typescript
// apps/pivot-dashboard/src/lib/oauth-storage.ts
import { LocalStorageAdapter } from "@midday/oauth-sync-core/storage";
import type { ConnectionRecord } from "@midday/oauth-sync-core/types";

const storage = new LocalStorageAdapter();

export async function getOAuthConnections(): Promise<ConnectionRecord[]> {
  return await storage.getConnectionsByTeam(teamId);
}
```

### Types Come From Package

```typescript
import type {
  ConnectionRecord,
  OAuthProvider,
  TokenConfig
} from "@midday/oauth-sync-core/types";
```

## 📦 localStorage Utilities

```typescript
import {
  getOAuthConnections,
  saveOAuthConnection,
  deleteOAuthConnection,
  clearAllOAuthConnections,
  isProviderConnected,
  getStorageAdapter,
} from "@/lib/oauth-storage";

// Get all connections (async now!)
const connections = await getOAuthConnections();

// Check if QuickBooks is connected
const isConnected = await isProviderConnected("quickbooks");

// Clear all (useful for testing)
await clearAllOAuthConnections();

// Get direct access to storage adapter
const adapter = getStorageAdapter();
```

## ⚠️ Important Notes

- **Testing Only**: This localStorage implementation is for testing. Never use in production!
- **No Security**: Tokens are stored in plain text in browser localStorage
- **No Sync**: Data is only stored locally, not synced across devices
- **Browser Clearing**: Clearing browser data will delete all connections

## 🎯 Next Steps

1. Test the OAuth flow for both providers
2. Verify connection status indicators
3. Test deletion functionality
4. Review token data in localStorage
5. When ready, migrate to database-backed storage

---

**Ready for Production?** See the OAuth sync package documentation in `packages/oauth-sync/core/README.md`
