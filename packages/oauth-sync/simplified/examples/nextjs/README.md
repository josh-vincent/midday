# Next.js OAuth Sync v3 Example

Complete Next.js 14 App Router example using `@midday/oauth-sync` v3 with **Stripe-like API** and **three data sync strategies**.

## What's New in v3

✅ **Stripe-like single instance API** - 60% less code
✅ **Built-in auto-refresh** - no manual setup
✅ **Direct token access** - `tokens.xero` instead of filtering
✅ **Event-driven** - Stripe-style event handling
✅ **Three data sync strategies** - webhooks, direct DB, custom transforms
✅ **Provider namespaces** - `oauth.xero.getToken()`

## Features

✅ Organization, Team, and User-level connections
✅ Automatic token refresh (built-in)
✅ Webhooks, Direct DB sync, or Custom transforms
✅ Row Level Security (RLS)
✅ Audit logging
✅ Usage tracking
✅ Multiple connections per org with fallback

## Quick Start

### 1. Install Dependencies

```bash
npm install @midday/oauth-sync@3.0.0
# or
bun add @midday/oauth-sync@3.0.0
```

### 2. Environment Variables

```bash
# .env.local

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# OAuth Providers (auto-detected)
OAUTH_XERO_CLIENT_ID=your-xero-client-id
OAUTH_XERO_CLIENT_SECRET=your-xero-client-secret
OAUTH_QB_CLIENT_ID=your-quickbooks-client-id
OAUTH_QB_CLIENT_SECRET=your-quickbooks-client-secret

# For Direct DB Sync (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# For Webhooks (optional)
WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

Visit http://localhost:3000

## Project Structure

```
examples/nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── oauth/
│   │   │       └── [...oauth]/route.ts  # OAuth handlers
│   │   ├── (dashboard)/
│   │   │   ├── settings/
│   │   │   │   └── connections/
│   │   │   │       └── page.tsx         # Connections UI
│   │   │   └── layout.tsx               # Dashboard layout
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Home page
│   ├── lib/
│   │   ├── oauth.ts                     # OAuth config
│   │   ├── supabase/
│   │   │   ├── client.ts                # Supabase client
│   │   │   └── server.ts                # Supabase server
│   │   └── auth.ts                      # Auth helpers
│   └── components/
│       ├── providers.tsx                # React providers
│       ├── connect-button.tsx           # OAuth connect UI
│       └── connection-list.tsx          # Connections list
├── package.json
└── README.md
```

## Data Sync Strategies

Choose the strategy that best fits your needs:

### Strategy 1: Webhooks (Most Secure) 🔒

**Best for**: Production apps, maximum security, flexible processing

Your app receives sync data via webhooks and processes it however you want.

**`src/lib/oauth.ts`**
```typescript
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,

  webhook: {
    url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/oauth-sync',
    secret: process.env.WEBHOOK_SECRET,
    retries: 3,
  },
});

// Event handling (Stripe-style)
oauth.on('token.refreshed', (event) => {
  console.log(`✅ ${event.provider} token refreshed`);
});
```

**Webhook Handler: `src/app/api/webhooks/oauth-sync/route.ts`**
```typescript
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await request.json();

  switch (event.entity) {
    case 'customers':
      await db.customers.createMany({
        data: event.data.map(c => ({
          external_id: c.ContactID || c.Id,
          name: c.Name || c.DisplayName,
          email: c.EmailAddress || c.PrimaryEmailAddr?.Address,
          provider: event.provider,
        })),
        skipDuplicates: true,
      });
      break;

    case 'invoices':
      await db.invoices.createMany({
        data: event.data.map(i => ({
          external_id: i.InvoiceID || i.Id,
          amount: i.Total || i.TotalAmt,
          due_date: i.DueDate,
          provider: event.provider,
        })),
        skipDuplicates: true,
      });
      break;
  }

  return Response.json({ success: true });
}
```

### Strategy 2: Direct DB Sync (Easiest) ⚡

**Best for**: Quick setup, internal tools, trusted environments

Automatically syncs to your database with field mapping.

**`src/lib/oauth.ts`**
```typescript
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,

  sync: {
    database: {
      type: 'postgres',
      connectionString: process.env.DATABASE_URL!,
      ssl: true,
    },

    entities: {
      customers: {
        provider: 'xero',
        endpoint: '/api.xro/2.0/Contacts',
        table: 'customers',
        strategy: 'upsert',
        primaryKey: 'external_id',

        mapping: {
          'ContactID': 'external_id',
          'Name': 'name',
          'EmailAddress': 'email',
          'Phones[0].PhoneNumber': 'phone',
        },
      },

      invoices: {
        provider: 'quickbooks',
        endpoint: '/v3/company/{realmId}/query?query=SELECT * FROM Invoice',
        table: 'invoices',
        strategy: 'incremental',
        incrementalField: 'synced_at',

        mapping: {
          'Id': 'external_id',
          'TotalAmt': 'amount',
          'DueDate': 'due_date',
        },
      },
    },
  },
});

// Trigger sync on connection
oauth.on('connection.created', async (event) => {
  await oauth.sync('customers', { orgId: event.orgId });
});
```

### Strategy 3: Custom Transforms (Most Flexible) 🎨

**Best for**: Complex processing, data enrichment, AI categorization

Full control over data transformation and storage.

**`src/lib/oauth.ts`**
```typescript
import { OAuthSync, DataSyncManager } from '@midday/oauth-sync';
import { db } from './db';
import { categorizeWithAI } from './ai';

const syncManager = new DataSyncManager();

// Custom customer transform with enrichment
syncManager.registerTransform('customers', async (rawData, context) => {
  const customers = rawData.Contacts || rawData.Customer;

  const enriched = await Promise.all(
    customers.map(async (c) => ({
      external_id: c.ContactID || c.Id,
      name: c.Name || c.DisplayName,
      email: c.EmailAddress || c.PrimaryEmailAddr?.Address,
      // Enrichment
      score: calculateLeadScore(c),
      segment: determineSegment(c),
      territory: await assignTerritory(c.Addresses),
    }))
  );

  await db.customers.createMany({ data: enriched });

  // Notify sales for high-score leads
  for (const customer of enriched) {
    if (customer.score > 80) {
      await notifySalesTeam(customer);
    }
  }

  return enriched;
});

// AI-powered transaction categorization
syncManager.registerTransform('transactions', async (rawData, context) => {
  for (const txn of rawData.BankTransactions) {
    const category = await categorizeWithAI(txn.Description);
    const isAnomaly = detectAnomaly(txn.Amount, category);

    await db.transactions.create({
      data: {
        external_id: txn.BankTransactionID,
        amount: txn.Total,
        description: txn.Description,
        category,
        flagged: isAnomaly,
      },
    });

    if (isAnomaly) {
      await sendAlert({ type: 'suspicious_transaction', ...txn });
    }
  }

  return rawData.BankTransactions;
});

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,
  syncManager,
});
```

## v3 API Usage

### 1. API Routes

**`src/app/api/oauth/[...oauth]/route.ts`**
```typescript
import { oauth } from '@/lib/oauth';

// That's it! Handles all OAuth routes
export const { GET, POST } = oauth.handlers;
```

Routes handled automatically:
- `/api/oauth/xero/authorize` - Start OAuth flow
- `/api/oauth/xero/callback` - Handle callback
- `/api/oauth/connections?orgId=...` - List connections
- `/api/oauth/disconnect` - Remove connection

### 2. Server Components (Get Tokens)

**`src/app/(dashboard)/page.tsx`**
```typescript
import { oauth } from '@/lib/oauth';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Get all tokens with ONE line
  const tokens = await oauth.getTokens({
    orgId: user.orgId,
    teamId: user.teamId,
    userId: user.id,
  });

  // Direct access to tokens
  if (tokens.xero) {
    const xeroData = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      headers: { Authorization: `Bearer ${tokens.xero}` },
    }).then(r => r.json());

    return <InvoiceList invoices={xeroData.Invoices} />;
  }

  return <ConnectPrompt />;
}
```

### 3. Server Actions

**`src/app/actions.ts`**
```typescript
'use server'

import { oauth } from '@/lib/oauth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function connectXero(orgId: string, userId: string) {
  const authUrl = await oauth.xero.connect({
    orgId,
    userId,
    redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/xero/callback',
  });

  redirect(authUrl);
}

export async function disconnectProvider(connectionId: string) {
  await oauth.disconnect(connectionId);
  revalidatePath('/settings/connections');
}

export async function syncCustomers(orgId: string) {
  await oauth.sync('customers', { orgId });
  revalidatePath('/customers');
}
```

### 4. Client Components

**`src/components/connect-button.tsx`**
```typescript
'use client'

import { connectXero, connectQuickBooks } from '@/app/actions';
import { Button } from '@/components/ui/button';

export function ConnectButton({
  provider,
  orgId,
  userId
}: {
  provider: 'xero' | 'quickbooks';
  orgId: string;
  userId: string;
}) {
  const handleConnect = async () => {
    if (provider === 'xero') {
      await connectXero(orgId, userId);
    } else {
      await connectQuickBooks(orgId, userId);
    }
  };

  return (
    <Button onClick={handleConnect}>
      Connect {provider === 'xero' ? 'Xero' : 'QuickBooks'}
    </Button>
  );
}
```

### 5. Connection List

**`src/components/connection-list.tsx`**
```typescript
'use client'

import { disconnectProvider } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ConnectionList({ orgId }: { orgId: string }) {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch(`/api/oauth/connections?orgId=${orgId}`)
      .then(r => r.json())
      .then(data => setConnections(data.connections));
  }, [orgId]);

  const handleDisconnect = async (connectionId: string) => {
    await disconnectProvider(connectionId);
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  return (
    <div className="space-y-4">
      {connections.map((conn) => (
        <div key={conn.id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold capitalize">{conn.provider}</h3>
              {conn.orgId && <Badge>Organization</Badge>}
              {conn.metadata?.isPrimary && <Badge variant="success">Primary</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Expires: {new Date(conn.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <Button variant="destructive" onClick={() => handleDisconnect(conn.id)}>
            Disconnect
          </Button>
        </div>
      ))}
    </div>
  );
}
```

## Flexible Token Access

### All Context Combinations Supported

The v3 API works with **any combination** of orgId, teamId, or userId:

```typescript
import { oauth } from '@/lib/oauth';

// ✅ Just userId (simple apps, individual users)
const tokens = await oauth.getTokens({ userId: 'user_123' });

// ✅ userId + teamId (team-based apps, no org)
const tokens = await oauth.getTokens({
  userId: 'user_123',
  teamId: 'team_456'
});

// ✅ orgId + userId (org-based, skip team)
const tokens = await oauth.getTokens({
  orgId: 'org_123',
  userId: 'user_456'
});

// ✅ Full hierarchy (enterprise B2B)
const tokens = await oauth.getTokens({
  orgId: 'org_123',
  teamId: 'team_456',
  userId: 'user_789'
});

// ✅ Even empty context (gets ALL connections - admin use)
const allTokens = await oauth.getTokens({});
```

### Filter by Specific Providers

Request only the providers you need:

```typescript
// Get only Xero token
const tokens = await oauth.getTokens({
  userId: 'user_123',
  providers: ['xero']
});
// Returns: { xero: 'token_xxx' }

// Get Xero and QuickBooks
const tokens = await oauth.getTokens({
  orgId: 'org_123',
  providers: ['xero', 'quickbooks']
});
// Returns: { xero: 'token_xxx', quickbooks: 'token_yyy' }
```

### Rich Token Information (Scopes & Permissions)

Get detailed token info including scopes, permissions, and expiry:

```typescript
import { oauth } from '@/lib/oauth';

// Get rich token information
const richTokens = await oauth.getRichTokens({
  orgId: 'org_123',
  providers: ['xero', 'quickbooks']
});

// Access detailed information
const xeroInfo = richTokens.xero;
console.log(xeroInfo.token);          // 'token_xxx'
console.log(xeroInfo.scopes);         // ['accounting.transactions', 'accounting.contacts.read']
console.log(xeroInfo.expiresAt);      // '2025-01-01T00:00:00Z'
console.log(xeroInfo.metadata?.permissions);  // 'readWrite' | 'read' | 'admin'
console.log(xeroInfo.metadata?.isPrimary);    // true

// Check permissions before API calls
if (richTokens.xero?.metadata?.permissions === 'readWrite') {
  // Can write data
  await createInvoice(richTokens.xero.token);
} else {
  // Read-only
  await getInvoices(richTokens.xero.token);
}

// Check scopes
if (richTokens.xero?.scopes.includes('accounting.contacts.read')) {
  await getContacts(richTokens.xero.token);
}
```

### Real-World Examples

#### Example 1: Simple User App (Just userId)

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Just userId - perfect for individual user apps
  const tokens = await oauth.getTokens({ userId: user.id });

  return (
    <div>
      {tokens.xero && <XeroInvoices token={tokens.xero} />}
      {tokens.quickbooks && <QBInvoices token={tokens.quickbooks} />}
    </div>
  );
}
```

#### Example 2: Team App (userId + teamId)

```typescript
// app/team/[teamId]/page.tsx
export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const user = await getCurrentUser();

  // Team-level tokens
  const tokens = await oauth.getTokens({
    userId: user.id,
    teamId: params.teamId
  });

  return <TeamDashboard tokens={tokens} />;
}
```

#### Example 3: Enterprise B2B (Full Hierarchy)

```typescript
// app/org/[orgId]/dashboard/page.tsx
export default async function OrgDashboard({ params }: { params: { orgId: string } }) {
  const user = await getCurrentUser();

  // Hierarchical fallback: org → team → user
  const tokens = await oauth.getTokens({
    orgId: params.orgId,
    teamId: user.teamId,
    userId: user.id
  });

  return <OrgDashboard tokens={tokens} />;
}
```

#### Example 4: Permission-Based UI

```typescript
// app/accounting/page.tsx
export default async function AccountingPage() {
  const user = await getCurrentUser();

  // Get rich token info to check permissions
  const richTokens = await oauth.getRichTokens({
    orgId: user.orgId,
    providers: ['xero', 'quickbooks']
  });

  const canWriteXero = richTokens.xero?.metadata?.permissions === 'readWrite';
  const canWriteQB = richTokens.quickbooks?.metadata?.permissions === 'readWrite';

  return (
    <div>
      <h1>Accounting</h1>

      {canWriteXero && (
        <Button onClick={createXeroInvoice}>
          Create Xero Invoice
        </Button>
      )}

      {canWriteQB && (
        <Button onClick={createQBInvoice}>
          Create QuickBooks Invoice
        </Button>
      )}

      {/* Show read-only view if no write permissions */}
      {!canWriteXero && !canWriteQB && (
        <ReadOnlyInvoiceList />
      )}
    </div>
  );
}
```

#### Example 5: Scope-Based Features

```typescript
// app/contacts/page.tsx
export default async function ContactsPage() {
  const user = await getCurrentUser();

  const richTokens = await oauth.getRichTokens({
    orgId: user.orgId,
    providers: ['xero']
  });

  const xero = richTokens.xero;

  // Check specific scopes
  const canReadContacts = xero?.scopes.includes('accounting.contacts.read');
  const canWriteContacts = xero?.scopes.includes('accounting.contacts');

  return (
    <div>
      {canReadContacts ? (
        <ContactsList token={xero.token} readOnly={!canWriteContacts} />
      ) : (
        <NoPermissionMessage requiredScopes={['accounting.contacts.read']} />
      )}
    </div>
  );
}
```

## Type Safety with Zod

OAuth Sync v3 includes **full Zod schemas** for runtime validation and type inference.

### Using Zod Schemas

```typescript
import {
  tokenContextSchema,
  connectOptionsSchema,
  tokenInfoSchema,
  oauthSyncConfigSchema,
  validateTokenContext,
  validateConnectOptions,
} from '@midday/oauth-sync';
import { z } from 'zod';

// 1. Validate API input (Next.js API route)
export async function POST(request: Request) {
  const body = await request.json();

  // Parse and validate with Zod
  const context = tokenContextSchema.parse(body);
  // { userId?: string, teamId?: string, orgId?: string, providers?: string[] }

  const tokens = await oauth.getTokens(context);
  return Response.json({ tokens });
}

// 2. Validate server action input
'use server'

export async function getTokensAction(rawContext: unknown) {
  // Validate input
  const context = validateTokenContext(rawContext);

  const tokens = await oauth.getTokens(context);
  return tokens;
}

// 3. Infer types from schemas
type TokenContext = z.infer<typeof tokenContextSchema>;
type TokenInfo = z.infer<typeof tokenInfoSchema>;

// 4. Validate configuration
const config = oauthSyncConfigSchema.parse({
  storage: 'supabase',
  autoRefresh: true,
  maxRetries: 3,
  timeout: 30000,
});

const oauth = new OAuthSync(config);
```

### Safe Parsing (Don't Throw)

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';

export async function POST(request: Request) {
  const body = await request.json();

  // Safe parse - returns { success: boolean, data?: T, error?: ZodError }
  const result = tokenContextSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', issues: result.error.issues },
      { status: 400 }
    );
  }

  const tokens = await oauth.getTokens(result.data);
  return Response.json({ tokens });
}
```

### Custom Validation

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

// Extend schema with custom validation
const strictTokenContextSchema = tokenContextSchema.extend({
  userId: z.string().min(1), // Make userId required
  providers: z.array(z.enum(['xero', 'quickbooks'])).min(1), // At least one provider
});

export async function POST(request: Request) {
  const body = await request.json();
  const context = strictTokenContextSchema.parse(body);

  const tokens = await oauth.getTokens(context);
  return Response.json({ tokens });
}
```

### Validate Rich Token Response

```typescript
import { tokenInfoSchema } from '@midday/oauth-sync';
import { z } from 'zod';

// Create schema for rich token response
const richTokenResponseSchema = z.record(tokenInfoSchema);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return Response.json({ error: 'Missing orgId' }, { status: 400 });
  }

  const richTokens = await oauth.getRichTokens({ orgId });

  // Validate response (ensure it matches expected structure)
  const validated = richTokenResponseSchema.parse(richTokens);

  return Response.json({ tokens: validated });
}
```

### Form Validation (tRPC/React Hook Form)

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function TokenRequestForm() {
  const form = useForm({
    resolver: zodResolver(tokenContextSchema),
    defaultValues: {
      userId: '',
      providers: ['xero'],
    },
  });

  async function onSubmit(data: z.infer<typeof tokenContextSchema>) {
    const tokens = await getTokensAction(data);
    console.log(tokens);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('userId')} />
      <button type="submit">Get Tokens</button>
    </form>
  );
}
```

### Available Schemas

```typescript
import {
  // Schemas
  tokenContextSchema,      // TokenContext validation
  connectOptionsSchema,     // ConnectOptions validation
  tokenInfoSchema,          // TokenInfo validation
  oauthSyncConfigSchema,    // OAuthSyncConfig validation

  // Helper functions (throws on error)
  validateTokenContext,
  validateConnectOptions,
  validateOAuthSyncConfig,
} from '@midday/oauth-sync';
```

## Advanced Patterns

### 1. Multiple Connections with Fallback

**`src/lib/oauth-helpers.ts`**

```typescript
import { auth } from '@/lib/oauth';
import type { ConnectionRecord, OAuthProvider } from '@midday/oauth-sync-core';

export async function getConnectionWithFallback(
  orgId: string,
  provider: OAuthProvider
): Promise<ConnectionRecord> {
  const { connections } = await auth({ orgId });

  const providerConnections = connections
    .filter((c) => c.provider === provider)
    .sort((a, b) => {
      // Prioritize: primary > most recent > least expiring
      if (a.metadata?.isPrimary && !b.metadata?.isPrimary) return -1;
      if (!a.metadata?.isPrimary && b.metadata?.isPrimary) return 1;

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

  // Try each connection until one works
  for (const connection of providerConnections) {
    try {
      // Test connection
      const response = await fetch(`/api/oauth/test/${connection.id}`);
      if (response.ok) {
        return connection;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`No working ${provider} connections found for org ${orgId}`);
}
```

### 2. Admin Delegation

**`src/app/api/admin/delegate/route.ts`**

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { userId, orgId, providers } = await request.json();
  const supabase = createClient();

  const { data: admin } = await supabase.auth.getUser();

  const { error } = await supabase.from('oauth_admins').insert({
    user_id: userId,
    org_id: orgId,
    providers,
    delegated_by: admin?.user?.id,
    delegated_at: new Date().toISOString(),
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
```

### 3. Usage Tracking

**`src/lib/track-usage.ts`**

```typescript
import { createClient } from '@/lib/supabase/server';

export async function trackUsage(
  connectionId: string,
  operation: 'api_call' | 'sync' | 'data_transfer',
  metadata?: { bytes?: number }
) {
  const supabase = createClient();

  const { data: connection } = await supabase
    .from('oauth_connections')
    .select('org_id, team_id, provider')
    .eq('id', connectionId)
    .single();

  if (!connection) return;

  await supabase.from('oauth_usage_metrics').insert({
    org_id: connection.org_id,
    team_id: connection.team_id,
    provider: connection.provider,
    connection_id: connectionId,
    operation,
    bytes: metadata?.bytes || 0,
    timestamp: new Date().toISOString(),
  });
}
```

### 4. Expiry Notifications

**`src/app/api/cron/check-expiring/route.ts`**

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@/lib/oauth';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all expiring connections (next 7 days)
  const { connections } = await auth({});
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + 7);

  const expiring = connections.filter((conn) => {
    if (!conn.expiresAt) return false;
    return new Date(conn.expiresAt) <= thresholdDate;
  });

  // Send notifications
  for (const conn of expiring) {
    const owner = conn.metadata?.createdBy;
    if (owner?.email) {
      await sendEmail({
        to: owner.email,
        subject: `${conn.provider} connection expiring soon`,
        body: `Your ${conn.provider} connection will expire on ${conn.expiresAt}. Please reconnect to maintain access.`,
      });
    }
  }

  return Response.json({
    success: true,
    notified: expiring.length,
  });
}
```

## Testing

### Unit Tests

**`src/lib/__tests__/oauth-helpers.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getConnectionWithFallback } from '../oauth-helpers';

describe('getConnectionWithFallback', () => {
  it('should return primary connection first', async () => {
    // Mock auth to return multiple connections
    vi.mock('../oauth', () => ({
      auth: vi.fn().mockResolvedValue({
        connections: [
          { id: 'conn1', provider: 'xero', metadata: { isPrimary: false } },
          { id: 'conn2', provider: 'xero', metadata: { isPrimary: true } },
        ],
      }),
    }));

    const connection = await getConnectionWithFallback('org_123', 'xero');
    expect(connection.id).toBe('conn2');
  });
});
```

### E2E Tests (Playwright)

**`tests/oauth-flow.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('OAuth connection flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to connections
  await page.goto('/settings/connections');

  // Click connect Xero
  await page.click('button:has-text("Connect Xero")');

  // Should redirect to Xero OAuth
  await expect(page).toHaveURL(/login\.xero\.com/);

  // Mock OAuth callback (in real tests, you'd complete OAuth flow)
  // For now, just verify the redirect happened
});
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `OAUTH_XERO_CLIENT_ID`
- `OAUTH_XERO_CLIENT_SECRET`
- `OAUTH_QB_CLIENT_ID`
- `OAUTH_QB_CLIENT_SECRET`
- `CRON_SECRET` (for scheduled jobs)

### Cron Jobs (Vercel Cron)

**`vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiring",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/refresh-tokens",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Troubleshooting

### Issue: "Connection not found"

**Cause**: RLS policy blocking access

**Solution**: Verify user is in organization
```sql
SELECT * FROM organization_members
WHERE user_id = 'user_123' AND org_id = 'org_456';
```

### Issue: "Token refresh failed"

**Cause**: Invalid refresh token or provider credentials

**Solution**:
1. Check provider credentials in dashboard
2. Verify connection in database still valid
3. Check provider's OAuth app settings

### Issue: "Multiple primary connections"

**Cause**: Unique constraint violation

**Solution**: Only one connection per org/provider can be primary
```sql
-- Find duplicates
SELECT org_id, provider, COUNT(*)
FROM oauth_connections
WHERE is_primary = true
GROUP BY org_id, provider
HAVING COUNT(*) > 1;

-- Fix: Unmark extras
UPDATE oauth_connections
SET is_primary = false
WHERE id IN (SELECT id FROM duplicates_except_one);
```

## Performance Tips

1. **Use Read Replicas**: For high-traffic apps, use Supabase read replicas
2. **Cache Connections**: Cache connection lookups for 5-10 minutes
3. **Batch Refresh**: Use manager.refreshExpiringConnections() for bulk refresh
4. **Index Tuning**: Add custom indexes for your specific query patterns

## See Also

- [Database Schema](../schema/README.md) - Full schema documentation
- [Connection Examples](../../CONNECTION_EXAMPLES.md) - Usage patterns
- [B2B Patterns](../../B2B_PATTERNS.md) - Enterprise patterns
