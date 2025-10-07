# Data Sync Guide

Complete guide to syncing OAuth provider data to your database using **3 flexible strategies**.

## Overview

OAuth Sync v3 provides **three ways** to sync provider data (invoices, customers, etc.) to your database:

1. **Webhooks** (Default) - Most secure, you control everything
2. **Direct DB Sync** (Optional) - Automatic sync to your database
3. **Custom Transforms** (Advanced) - Full control over data processing

## Strategy 1: Webhooks (Recommended)

**Best for**: Production apps, maximum security, flexible processing

### How It Works

1. OAuth Sync fetches data from provider (Xero, QuickBooks)
2. Sends data to your webhook endpoint
3. You process and save to your database

### Setup

```typescript
// lib/oauth.ts
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,

  // Webhook configuration
  webhook: {
    url: 'https://your-app.com/api/webhooks/oauth-sync',
    secret: process.env.WEBHOOK_SECRET,
    retries: 3,
    timeout: 30000,
  },
});
```

### Webhook Handler

```typescript
// app/api/webhooks/oauth-sync/route.ts
import { db } from '@/lib/db';

export async function POST(request: Request) {
  // Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await request.json();

  // Process based on entity type
  switch (event.entity) {
    case 'customers':
      await db.customers.createMany({
        data: event.data.map(customer => ({
          external_id: customer.ContactID,
          name: customer.Name,
          email: customer.EmailAddress,
          provider: event.provider,
          synced_at: event.syncedAt,
        })),
        skipDuplicates: true,
      });
      break;

    case 'invoices':
      await db.invoices.createMany({
        data: event.data.map(invoice => ({
          external_id: invoice.InvoiceID,
          customer_id: invoice.Contact.ContactID,
          amount: invoice.Total,
          due_date: invoice.DueDate,
          status: invoice.Status,
          provider: event.provider,
          synced_at: event.syncedAt,
        })),
        skipDuplicates: true,
      });
      break;
  }

  return Response.json({ success: true });
}
```

### Pros & Cons

✅ **Pros**:
- Maximum security (no DB credentials shared)
- Full control over data processing
- Can enrich data before saving
- Can trigger other workflows
- Works with any database

❌ **Cons**:
- Requires building webhook handler
- Need to manage webhook failures
- More code to maintain

## Strategy 2: Direct DB Sync (Easiest)

**Best for**: Quick setup, internal tools, trusted environments

### How It Works

1. OAuth Sync fetches data from provider
2. Automatically transforms using field mapping
3. Writes directly to your database

### Setup

```typescript
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,

  // Direct database sync
  sync: {
    // Your database connection
    database: {
      type: 'postgres',
      connectionString: process.env.DATABASE_URL,
      ssl: true,
      poolSize: 10,
    },

    // Entity configurations
    entities: {
      customers: {
        provider: 'xero',
        endpoint: '/api.xro/2.0/Contacts',
        table: 'customers',

        // Field mapping (provider field → your DB column)
        mapping: {
          'ContactID': 'external_id',
          'Name': 'name',
          'EmailAddress': 'email',
          'FirstName': 'first_name',
          'LastName': 'last_name',
          'Phones[0].PhoneNumber': 'phone', // Nested fields supported
        },

        strategy: 'upsert',
        primaryKey: 'external_id',
      },

      invoices: {
        provider: 'quickbooks',
        endpoint: '/v3/company/{realmId}/query?query=SELECT * FROM Invoice',
        table: 'invoices',

        mapping: {
          'Id': 'external_id',
          'TotalAmt': 'amount',
          'DueDate': 'due_date',
          'TxnDate': 'invoice_date',
          'CustomerRef.value': 'customer_external_id',
        },

        strategy: 'incremental',
        incrementalField: 'updated_at', // Only sync new/updated records
      },
    },
  },
});
```

### Sync Strategies

#### 1. **Upsert** (Default)
Insert new records, update existing ones.

```typescript
entities: {
  customers: {
    strategy: 'upsert',
    primaryKey: 'external_id', // Used to detect duplicates
  }
}
```

#### 2. **Replace**
Delete all existing records, insert new ones.

```typescript
entities: {
  products: {
    strategy: 'replace', // Fresh sync every time
  }
}
```

#### 3. **Append**
Only insert new records, never update.

```typescript
entities: {
  transactions: {
    strategy: 'append', // Immutable data
  }
}
```

#### 4. **Incremental**
Only sync records modified since last sync.

```typescript
entities: {
  invoices: {
    strategy: 'incremental',
    incrementalField: 'updated_at', // Track last sync time
  }
}
```

### Trigger Sync

```typescript
// Manual sync
await oauth.sync('customers', { orgId: 'org_123' });
await oauth.sync('invoices', { orgId: 'org_123' });

// Auto-sync on connection
oauth.on('connection.created', async (event) => {
  await oauth.sync('customers', {
    orgId: event.orgId,
    connectionId: event.connectionId,
  });
});

// Scheduled sync (every 6 hours)
setInterval(async () => {
  await oauth.syncAll({ orgId: 'org_123' });
}, 6 * 60 * 60 * 1000);
```

### Supported Databases

- ✅ PostgreSQL
- ✅ Supabase (Postgres)
- ⏳ MySQL (coming soon)
- ⏳ MongoDB (coming soon)

### Pros & Cons

✅ **Pros**:
- Zero code for basic sync
- Automatic field mapping
- Built-in retry logic
- Supports multiple strategies

❌ **Cons**:
- Security risk (requires DB credentials)
- Less flexible than webhooks
- Limited to supported databases

## Strategy 3: Custom Transforms (Advanced)

**Best for**: Complex data processing, enrichment, multiple destinations

### How It Works

1. OAuth Sync fetches raw data
2. Your custom function processes it
3. You control what happens next

### Setup

```typescript
import { OAuthSync, DataSyncManager } from '@midday/oauth-sync';

const syncManager = new DataSyncManager();

// Register custom transform
syncManager.registerTransform('customers', async (rawData, context) => {
  // rawData: Raw response from Xero/QuickBooks
  // context: { provider, entity, connection, db }

  const customers = rawData.Contacts.map(contact => ({
    // Basic mapping
    external_id: contact.ContactID,
    name: contact.Name,
    email: contact.EmailAddress,

    // Custom enrichment
    score: calculateLeadScore(contact),
    segment: determineSegment(contact),
    territory: assignTerritory(contact.Addresses),

    // Computed fields
    lifetime_value: await calculateLTV(contact.ContactID),
    risk_level: assessRisk(contact),
  }));

  // Save to YOUR database your way
  await context.db.customers.createMany({ data: customers });

  // Trigger other workflows
  for (const customer of customers) {
    if (customer.score > 80) {
      await notifySalesTeam(customer);
    }
  }

  // Return for event system
  return customers;
});

export const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,
  syncManager, // Use custom sync manager
});
```

### Advanced Examples

#### Example 1: Multi-Destination Sync

```typescript
syncManager.registerTransform('invoices', async (rawData, context) => {
  const invoices = transformInvoices(rawData);

  // Save to multiple places
  await Promise.all([
    // Your main database
    context.db.invoices.createMany({ data: invoices }),

    // Analytics warehouse (Snowflake, BigQuery)
    analyticsDB.invoices.insert(invoices),

    // Search index (Algolia, Elasticsearch)
    searchIndex.saveObjects(invoices),

    // Cache (Redis)
    redis.set(`invoices:${context.connection.orgId}`, invoices),
  ]);

  return invoices;
});
```

#### Example 2: Real-Time Processing

```typescript
syncManager.registerTransform('transactions', async (rawData, context) => {
  const transactions = rawData.BankTransactions;

  for (const txn of transactions) {
    // Categorize transaction
    const category = await categorize(txn.Description);

    // Detect anomalies
    if (isAnomaly(txn.Amount, category)) {
      await sendAlert({
        type: 'suspicious_transaction',
        amount: txn.Amount,
        description: txn.Description,
      });
    }

    // Save with enrichment
    await context.db.transactions.create({
      data: {
        external_id: txn.BankTransactionID,
        amount: txn.Total,
        description: txn.Description,
        category,
        flagged: isAnomaly(txn.Amount, category),
      },
    });
  }

  return transactions;
});
```

#### Example 3: Data Validation

```typescript
import { z } from 'zod';

const CustomerSchema = z.object({
  external_id: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

syncManager.registerTransform('customers', async (rawData, context) => {
  const customers = rawData.Contacts.map(c => ({
    external_id: c.ContactID,
    name: c.Name,
    email: c.EmailAddress,
    phone: c.Phones?.[0]?.PhoneNumber,
  }));

  // Validate before saving
  const validCustomers = customers.filter(c => {
    const result = CustomerSchema.safeParse(c);
    if (!result.success) {
      console.error('Invalid customer:', c, result.error);
      return false;
    }
    return true;
  });

  await context.db.customers.createMany({ data: validCustomers });

  return validCustomers;
});
```

### Pros & Cons

✅ **Pros**:
- Maximum flexibility
- Can enrich/transform data
- Multi-destination sync
- Real-time processing
- Data validation

❌ **Cons**:
- Most code to write
- Need to handle errors
- More complex

## Comparison

| Feature | Webhooks | Direct DB | Custom Transforms |
|---------|----------|-----------|-------------------|
| **Security** | ⭐⭐⭐ Best | ⭐⭐ Moderate | ⭐⭐⭐ Best |
| **Ease of Setup** | ⭐⭐ Medium | ⭐⭐⭐ Easy | ⭐ Complex |
| **Flexibility** | ⭐⭐⭐ High | ⭐ Limited | ⭐⭐⭐ Highest |
| **Code Required** | Medium | Minimal | Most |
| **Data Enrichment** | ✅ Yes | ❌ No | ✅ Yes |
| **Multi-Destination** | ✅ Yes | ❌ No | ✅ Yes |
| **Real-time Processing** | ✅ Yes | ❌ No | ✅ Yes |
| **Auto-retry** | ✅ Built-in | ✅ Built-in | ⚠️ Manual |

## Hybrid Approach (Recommended)

**Use all three together** for maximum power:

```typescript
const oauth = new OAuthSync({
  storage: 'supabase',
  autoRefresh: true,

  // 1. Direct DB sync for simple entities
  sync: {
    database: {
      type: 'postgres',
      connectionString: process.env.DATABASE_URL,
    },
    entities: {
      products: {
        strategy: 'replace',
        table: 'products',
        mapping: { /* ... */ },
      },
    },
  },

  // 2. Webhook for notifications
  webhook: {
    url: 'https://your-app.com/api/webhooks/sync',
    secret: process.env.WEBHOOK_SECRET,
  },

  // 3. Custom transforms for complex entities
  transforms: {
    invoices: async (rawData, context) => {
      // Complex processing with AI, enrichment, etc.
      return await processInvoicesWithAI(rawData);
    },
  },
});
```

## Best Practices

### 1. Error Handling

```typescript
syncManager.registerTransform('customers', async (rawData, context) => {
  try {
    const customers = transformCustomers(rawData);
    await context.db.customers.createMany({ data: customers });
    return customers;
  } catch (error) {
    // Log error
    console.error('Sync failed:', error);

    // Store in dead letter queue
    await context.db.sync_errors.create({
      data: {
        entity: 'customers',
        provider: context.provider,
        error: error.message,
        raw_data: JSON.stringify(rawData),
      },
    });

    // Re-throw to trigger retry
    throw error;
  }
});
```

### 2. Batch Processing

```typescript
syncManager.registerTransform('invoices', async (rawData, context) => {
  const invoices = rawData.Invoices;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < invoices.length; i += batchSize) {
    const batch = invoices.slice(i, i + batchSize);

    await context.db.invoices.createMany({
      data: batch.map(transformInvoice),
    });

    // Rate limiting
    await sleep(100);
  }

  return invoices;
});
```

### 3. Idempotency

```typescript
syncManager.registerTransform('transactions', async (rawData, context) => {
  const transactions = rawData.BankTransactions;

  // Use upsert to handle duplicate syncs
  for (const txn of transactions) {
    await context.db.transactions.upsert({
      where: { external_id: txn.BankTransactionID },
      update: {
        amount: txn.Total,
        updated_at: new Date(),
      },
      create: {
        external_id: txn.BankTransactionID,
        amount: txn.Total,
        description: txn.Description,
      },
    });
  }

  return transactions;
});
```

### 4. Monitoring

```typescript
oauth.on('sync.completed', (event) => {
  // Log metrics
  console.log(`Synced ${event.count} ${event.entity} from ${event.provider}`);

  // Track in analytics
  analytics.track('Data Synced', {
    entity: event.entity,
    count: event.count,
    provider: event.provider,
    duration: event.duration,
  });

  // Alert if too many records
  if (event.count > 10000) {
    notifyAdmin(`Large sync: ${event.count} records`);
  }
});
```

## Security Considerations

### Direct DB Sync
- ⚠️ Never commit database credentials
- ✅ Use environment variables
- ✅ Use read-only credentials when possible
- ✅ Limit network access to your DB
- ✅ Enable SSL/TLS

### Webhooks
- ✅ Always verify webhook secret
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Validate payload structure

## Migration Guide

### From Stripe's Approach

```typescript
// Before (Stripe-like webhook only)
stripe.on('invoice.created', async (invoice) => {
  await db.invoices.create({ data: invoice });
});

// After (OAuth Sync - multiple options)

// Option 1: Direct DB sync (easiest)
const oauth = new OAuthSync({
  sync: {
    database: { type: 'postgres', connectionString: DB_URL },
    entities: {
      invoices: {
        table: 'invoices',
        mapping: { /* ... */ },
        strategy: 'upsert',
      },
    },
  },
});

// Option 2: Webhook (most flexible)
const oauth = new OAuthSync({
  webhook: {
    url: '/api/webhooks/sync',
    secret: WEBHOOK_SECRET,
  },
});

// Option 3: Custom transform (most powerful)
syncManager.registerTransform('invoices', async (data, ctx) => {
  // Your custom logic
});
```

## Examples

- [Next.js with Direct DB Sync](./examples/nextjs-direct-sync)
- [Webhook Handler Examples](./examples/webhook-handlers)
- [Custom Transforms](./examples/custom-transforms)
- [Multi-Destination Sync](./examples/multi-destination)

## FAQ

**Q: Which strategy should I use?**
A: Start with webhooks for production, use direct DB sync for internal tools, add custom transforms when you need advanced processing.

**Q: Can I use multiple strategies together?**
A: Yes! Use direct DB sync for simple entities, webhooks for notifications, and custom transforms for complex processing.

**Q: Is direct DB sync secure?**
A: It requires database credentials, so only use in trusted environments. For production, prefer webhooks.

**Q: How do I handle sync failures?**
A: All strategies have built-in retry logic. For custom transforms, implement your own error handling.

**Q: Can I sync to multiple databases?**
A: Yes, with custom transforms you can write to multiple destinations.

## Support

- [GitHub Issues](https://github.com/midday/oauth-sync/issues)
- [Discord](https://discord.gg/midday)
- [Documentation](https://oauth-sync.midday.ai)
