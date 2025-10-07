# @midday/accounting-providers

Accounting providers integration package for QuickBooks, Xero, and more.

## Features

- 🔐 **OAuth 2.0 Authentication** - Secure authentication with accounting platforms
- 📊 **Unified API** - Work with multiple accounting providers through a single interface
- 🔄 **Automatic Syncing** - Sync customers, invoices, payments, and more
- 🔁 **Auto Token Refresh** - Automatic access token refresh
- 📝 **TypeScript** - Full TypeScript support with comprehensive types
- 🪝 **Webhook Support** - Handle real-time updates from accounting platforms

## Supported Providers

- ✅ QuickBooks Online
- ✅ Xero
- 🔜 Sage Business Cloud
- 🔜 Wave Accounting
- 🔜 FreshBooks

## Installation

```bash
bun add @midday/accounting-providers
```

## Quick Start

### QuickBooks

```typescript
import { QuickBooksProvider, createAccountingSyncManager } from "@midday/accounting-providers";

// Initialize provider
const qbProvider = new QuickBooksProvider({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  realmId: "your-company-id",
  accessToken: "your-access-token",
  refreshToken: "your-refresh-token",
  environment: "production", // or "sandbox"
});

// Get customers
const customers = await qbProvider.getCustomers({ maxResults: 100 });

// Create an invoice
const invoice = await qbProvider.createInvoice({
  customerId: "123",
  invoiceNumber: "INV-001",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  lineItems: [
    {
      description: "Consulting Services",
      quantity: 10,
      unitPrice: 150,
      amount: 1500,
    },
  ],
  subtotal: 1500,
  taxTotal: 0,
  total: 1500,
  currencyCode: "USD",
  status: "draft",
});

// Send invoice
await qbProvider.sendInvoice(invoice.id);
```

### Xero

```typescript
import { XeroProvider } from "@midday/accounting-providers";

// Initialize provider
const xeroProvider = new XeroProvider({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  tenantId: "your-org-id",
  accessToken: "your-access-token",
  refreshToken: "your-refresh-token",
});

// Get invoices
const invoices = await xeroProvider.getInvoices({
  status: "AUTHORISED",
  maxResults: 50,
});

// Create a payment
const payment = await xeroProvider.createPayment({
  invoiceId: "inv-123",
  customerId: "cust-456",
  paymentDate: new Date(),
  amount: 1500,
  currencyCode: "USD",
  paymentMethod: "Credit Card",
});
```

### Using the Sync Manager

```typescript
import { createAccountingSyncManager } from "@midday/accounting-providers";

// Create sync manager
const syncManager = createAccountingSyncManager("quickbooks", {
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  realmId: "your-company-id",
  accessToken: "your-access-token",
  refreshToken: "your-refresh-token",
});

// Sync all data
const result = await syncManager.syncAll({
  teamId: "team-123",
  userId: "user-456",
  provider: "quickbooks",
  credentials: { /* ... */ },
  entities: ["customers", "invoices", "payments"],
  modifiedSince: new Date("2024-01-01"),
});

console.log(result);
// {
//   success: true,
//   synced: {
//     customers: 150,
//     invoices: 450,
//     payments: 320,
//     accounts: 0,
//     items: 0,
//     vendors: 0,
//     bills: 0,
//   },
//   errors: [],
//   lastSyncTime: "2024-10-05T12:00:00Z"
// }

// Test connection
const testResult = await syncManager.testConnection();
console.log(testResult.message); // "Successfully connected to quickbooks"

// Disconnect
await syncManager.disconnect();
```

## Background Jobs Integration

For production environments, use `@midday/jobs` with [Trigger.dev](https://trigger.dev) to automate syncing, OAuth token refresh, and webhook processing.

### Features

- ⏰ **Automatic Token Refresh** - Tokens refreshed every 30 minutes before expiry
- 🔄 **Real-time Sync** - Webhook-driven updates from QuickBooks/Xero
- 📦 **Batch Processing** - Efficient syncing of large datasets
- 🔁 **Retry Logic** - Exponential backoff for failed requests
- 📊 **Monitoring** - Track sync status and errors in Trigger.dev dashboard

### Quick Example

```typescript
import { initialQuickBooksSetup, syncQuickBooksEntity } from "@midday/jobs";

// After OAuth flow completes, trigger initial sync
await initialQuickBooksSetup.trigger({
  integrationId: app.id,      // UUID from apps table
  tenantId: team.id,           // Team ID
  realmId: oauthTokens.realm_id,
});

// Handle webhook event
await syncQuickBooksEntity.trigger({
  integrationId: app.id,
  tenantId: team.id,
  entityType: "invoice",
  entityId: "123",
  operation: "update",
  realmId: app.config.realm_id,
  lastUpdated: new Date().toISOString(),
});
```

### Architecture

```
User OAuth → Save to apps table → Trigger initial sync
                                          ↓
              ┌─────────────────────────────────────────┐
              │  @midday/jobs (Trigger.dev tasks)       │
              ├─────────────────────────────────────────┤
              │  • Token refresh scheduler (30 min)     │
              │  • Initial setup (all entities)         │
              │  • Entity sync (webhook-driven)         │
              └─────────────────┬───────────────────────┘
                                ↓
              ┌─────────────────────────────────────────┐
              │  @midday/accounting-providers           │
              ├─────────────────────────────────────────┤
              │  • QuickBooksProvider                   │
              │  • XeroProvider                         │
              │  • Token refresh                        │
              │  • API calls                            │
              └─────────────────┬───────────────────────┘
                                ↓
              ┌─────────────────────────────────────────┐
              │  Database                               │
              ├─────────────────────────────────────────┤
              │  • apps (OAuth tokens)                  │
              │  • synced_accounting_entities (cache)   │
              └─────────────────────────────────────────┘
```

### Available Tasks

**OAuth & Authentication**
- `token-refresh-scheduler` - Runs every 30 minutes to refresh expiring tokens

**QuickBooks**
- `initial-quickbooks-setup` - Initial sync after OAuth connection
- `sync-quickbooks-entity` - Sync specific entities (webhook or manual)

**Xero**
- `initial-xero-setup` - Initial sync after OAuth connection
- `sync-xero-entity` - Sync specific entities (webhook or manual)

### Get Started

See the comprehensive guides:
- **[Background Jobs Integration Guide](./BACKGROUND_JOBS.md)** - Complete implementation guide
- **[@midday/jobs README](../jobs/README.md)** - Package documentation
- **[@midday/jobs Testing Guide](../jobs/TESTING.md)** - Testing and debugging

## OAuth Flow

### QuickBooks OAuth

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";

const qb = new QuickBooksProvider({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  realmId: "", // Will be set after auth
});

// Step 1: Get authorization URL
const authUrl = await qb.getAuthUrl("https://your-app.com/callback", "random-state");
// Redirect user to authUrl

// Step 2: Exchange code for token (in your callback handler)
const tokens = await qb.exchangeCodeForToken(
  code, // From query params
  "https://your-app.com/callback"
);

// Step 3: Save tokens to database
// tokens.access_token, tokens.refresh_token, tokens.expires_in
```

### Xero OAuth

```typescript
import { XeroProvider } from "@midday/accounting-providers";

const xero = new XeroProvider({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  tenantId: "", // Will be set after auth
});

// Step 1: Get authorization URL
const authUrl = await xero.getAuthUrl("https://your-app.com/callback", "random-state");
// Redirect user to authUrl

// Step 2: Exchange code for token (in your callback handler)
const tokens = await xero.exchangeCodeForToken(
  code, // From query params
  "https://your-app.com/callback"
);

// Step 3: Save tokens to database
```

## API Reference

### Provider Methods

All providers implement the `IAccountingProvider` interface:

#### Customers
- `getCustomers(options?)` - Get all customers
- `getCustomer(id)` - Get a single customer
- `createCustomer(customer)` - Create a new customer
- `updateCustomer(id, customer)` - Update a customer
- `deleteCustomer(id)` - Delete/archive a customer

#### Invoices
- `getInvoices(options?)` - Get all invoices
- `getInvoice(id)` - Get a single invoice
- `createInvoice(invoice)` - Create a new invoice
- `updateInvoice(id, invoice)` - Update an invoice
- `deleteInvoice(id)` - Delete/void an invoice
- `sendInvoice(id, email?)` - Send invoice via email

#### Payments
- `getPayments(options?)` - Get all payments
- `getPayment(id)` - Get a single payment
- `createPayment(payment)` - Record a new payment

#### Accounts
- `getAccounts()` - Get chart of accounts
- `getAccount(id)` - Get a single account

#### Items/Products
- `getItems(options?)` - Get all items
- `getItem(id)` - Get a single item
- `createItem(item)` - Create a new item
- `updateItem(id, item)` - Update an item

#### Vendors
- `getVendors(options?)` - Get all vendors
- `getVendor(id)` - Get a single vendor
- `createVendor(vendor)` - Create a new vendor
- `updateVendor(id, vendor)` - Update a vendor

#### Bills
- `getBills(options?)` - Get all bills
- `getBill(id)` - Get a single bill
- `createBill(bill)` - Create a new bill
- `updateBill(id, bill)` - Update a bill

#### Utility
- `getCompanyInfo()` - Get company/organization info
- `disconnect()` - Disconnect and cleanup
- `refreshAccessToken()` - Manually refresh access token

## TypeScript Types

The package includes comprehensive TypeScript types:

```typescript
import type {
  AccountingCustomer,
  AccountingInvoice,
  AccountingPayment,
  AccountingAccount,
  AccountingItem,
  AccountingVendor,
  AccountingBill,
  QuickBooksCredentials,
  XeroCredentials,
  AccountingSyncOptions,
  AccountingSyncResult,
} from "@midday/accounting-providers";
```

## Error Handling

All methods throw errors that should be handled:

```typescript
try {
  const invoice = await qbProvider.getInvoice("123");
} catch (error) {
  if (error.message.includes("not found")) {
    // Handle not found
  } else if (error.message.includes("unauthorized")) {
    // Handle auth error - maybe refresh token
    await qbProvider.refreshAccessToken();
  } else {
    // Handle other errors
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## License

MIT
