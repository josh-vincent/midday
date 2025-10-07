# Usage Examples

## Complete OAuth Flow

### QuickBooks OAuth Implementation

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";
import { db } from "@midday/db";

// 1. Initiate OAuth Flow
export async function initiateQuickBooksAuth(teamId: string) {
  const provider = new QuickBooksProvider({
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    realmId: "", // Will be set after auth
    environment: "production",
  });

  const state = `${teamId}:${Date.now()}`; // Include teamId in state
  const redirectUri = `${process.env.APP_URL}/api/integrations/quickbooks/callback`;

  const authUrl = await provider.getAuthUrl(redirectUri, state);

  return { authUrl, state };
}

// 2. Handle OAuth Callback
export async function handleQuickBooksCallback(code: string, state: string, realmId: string) {
  const [teamId] = state.split(":");

  const provider = new QuickBooksProvider({
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    realmId,
    environment: "production",
  });

  const redirectUri = `${process.env.APP_URL}/api/integrations/quickbooks/callback`;
  const tokens = await provider.exchangeCodeForToken(code, redirectUri);

  // Save to database
  await db.accountingIntegrations.create({
    data: {
      teamId,
      provider: "quickbooks",
      realmId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return { success: true, teamId };
}

// 3. Use Provider with Stored Credentials
export async function getQuickBooksProvider(teamId: string) {
  const integration = await db.accountingIntegrations.findFirst({
    where: { teamId, provider: "quickbooks" },
  });

  if (!integration) {
    throw new Error("QuickBooks not connected");
  }

  return new QuickBooksProvider({
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    realmId: integration.realmId,
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiryDate: integration.expiresAt.getTime(),
    environment: "production",
  });
}
```

## Syncing Data

### Sync Customers and Invoices

```typescript
import { createAccountingSyncManager } from "@midday/accounting-providers";
import { db } from "@midday/db";

export async function syncAccountingData(teamId: string) {
  // Get stored credentials
  const integration = await db.accountingIntegrations.findFirst({
    where: { teamId },
  });

  if (!integration) {
    throw new Error("No accounting integration found");
  }

  // Create sync manager
  const manager = createAccountingSyncManager(integration.provider, {
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    realmId: integration.realmId,
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
  });

  // Sync specific entities
  const result = await manager.syncAll({
    teamId,
    userId: integration.userId,
    provider: integration.provider,
    credentials: integration,
    entities: ["customers", "invoices"],
    modifiedSince: integration.lastSyncedAt || new Date("2024-01-01"),
    maxResults: 1000,
  });

  // Update last sync time
  await db.accountingIntegrations.update({
    where: { id: integration.id },
    data: { lastSyncedAt: new Date() },
  });

  await manager.disconnect();

  return result;
}
```

### Custom Sync with Database Storage

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";
import { db } from "@midday/db";

export async function syncCustomersToDatabase(teamId: string) {
  const provider = await getQuickBooksProvider(teamId);

  // Fetch customers from QuickBooks
  const qbCustomers = await provider.getCustomers({
    modifiedSince: new Date("2024-01-01"),
    maxResults: 500,
  });

  // Upsert to database
  for (const customer of qbCustomers) {
    await db.customers.upsert({
      where: {
        teamId_externalId: {
          teamId,
          externalId: customer.externalId!,
        },
      },
      update: {
        name: customer.displayName,
        email: customer.email,
        phone: customer.phone,
        address: customer.billingAddress,
        updatedAt: new Date(),
      },
      create: {
        teamId,
        externalId: customer.externalId!,
        name: customer.displayName,
        email: customer.email,
        phone: customer.phone,
        address: customer.billingAddress,
        provider: "quickbooks",
      },
    });
  }

  return { synced: qbCustomers.length };
}
```

## Creating Invoices

### Create Invoice in QuickBooks from Local Data

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";
import { db } from "@midday/db";

export async function createQuickBooksInvoice(localInvoiceId: string) {
  // Get local invoice data
  const invoice = await db.invoices.findUnique({
    where: { id: localInvoiceId },
    include: {
      customer: true,
      lineItems: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Get QuickBooks provider
  const provider = await getQuickBooksProvider(invoice.teamId);

  // Create invoice in QuickBooks
  const qbInvoice = await provider.createInvoice({
    customerId: invoice.customer.externalId!, // QB customer ID
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    lineItems: invoice.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
    subtotal: invoice.subtotal,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    currencyCode: invoice.currency,
    status: "draft",
    notes: invoice.notes,
  });

  // Save QuickBooks invoice ID
  await db.invoices.update({
    where: { id: localInvoiceId },
    data: {
      externalId: qbInvoice.externalId,
      syncedAt: new Date(),
    },
  });

  // Send invoice
  await provider.sendInvoice(qbInvoice.id!);

  return qbInvoice;
}
```

### Sync Invoice Status Updates

```typescript
export async function syncInvoiceStatus(localInvoiceId: string) {
  const invoice = await db.invoices.findUnique({
    where: { id: localInvoiceId },
  });

  if (!invoice?.externalId) {
    throw new Error("Invoice not synced to QuickBooks");
  }

  const provider = await getQuickBooksProvider(invoice.teamId);
  const qbInvoice = await provider.getInvoice(invoice.externalId);

  if (!qbInvoice) {
    throw new Error("Invoice not found in QuickBooks");
  }

  // Update local invoice with QB data
  await db.invoices.update({
    where: { id: localInvoiceId },
    data: {
      status: qbInvoice.status,
      amountPaid: qbInvoice.amountPaid,
      amountDue: qbInvoice.amountDue,
      syncedAt: new Date(),
    },
  });

  return qbInvoice;
}
```

## Recording Payments

### Record Payment from Stripe to QuickBooks

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";

export async function recordStripePaymentInQuickBooks(
  teamId: string,
  stripePaymentIntent: any
) {
  // Get the invoice
  const invoice = await db.invoices.findFirst({
    where: {
      teamId,
      stripePaymentIntentId: stripePaymentIntent.id,
    },
  });

  if (!invoice?.externalId) {
    throw new Error("Invoice not found or not synced");
  }

  const provider = await getQuickBooksProvider(teamId);

  // Record payment in QuickBooks
  const payment = await provider.createPayment({
    invoiceId: invoice.externalId,
    customerId: invoice.customerExternalId!,
    paymentDate: new Date(stripePaymentIntent.created * 1000),
    amount: stripePaymentIntent.amount / 100,
    currencyCode: stripePaymentIntent.currency.toUpperCase(),
    paymentMethod: "Credit Card",
    reference: stripePaymentIntent.id,
    notes: `Stripe payment: ${stripePaymentIntent.id}`,
  });

  // Update local invoice
  await db.invoices.update({
    where: { id: invoice.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      syncedAt: new Date(),
    },
  });

  return payment;
}
```

## Webhook Handlers

### Handle QuickBooks Webhook

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";
import type { AccountingWebhookPayload } from "@midday/accounting-providers";

export async function handleQuickBooksWebhook(payload: AccountingWebhookPayload) {
  const { type, entityId, realmId } = payload;

  // Find team by realmId
  const integration = await db.accountingIntegrations.findFirst({
    where: { realmId, provider: "quickbooks" },
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  const provider = await getQuickBooksProvider(integration.teamId);

  switch (type) {
    case "invoice.created":
    case "invoice.updated":
      // Sync the specific invoice
      const invoice = await provider.getInvoice(entityId);
      if (invoice) {
        await syncInvoiceToDatabase(integration.teamId, invoice);
      }
      break;

    case "payment.created":
      // Sync the payment
      const payment = await provider.getPayment(entityId);
      if (payment) {
        await syncPaymentToDatabase(integration.teamId, payment);
      }
      break;

    case "customer.created":
    case "customer.updated":
      // Sync the customer
      const customer = await provider.getCustomer(entityId);
      if (customer) {
        await syncCustomerToDatabase(integration.teamId, customer);
      }
      break;
  }

  return { success: true };
}

async function syncInvoiceToDatabase(teamId: string, invoice: any) {
  await db.invoices.upsert({
    where: {
      teamId_externalId: {
        teamId,
        externalId: invoice.externalId!,
      },
    },
    update: {
      status: invoice.status,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      updatedAt: new Date(),
    },
    create: {
      teamId,
      externalId: invoice.externalId!,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
    },
  });
}
```

## Background Jobs with Trigger.dev

### Scheduled Sync Job

```typescript
import { task } from "@trigger.dev/sdk/v3";
import { syncTeamAccounting } from "@midday/accounting-providers";
import { db } from "@midday/db";

export const syncAccountingDataTask = task({
  id: "sync-accounting-data",
  run: async (payload: { teamId: string }) => {
    const integration = await db.accountingIntegrations.findFirst({
      where: { teamId: payload.teamId },
    });

    if (!integration) {
      throw new Error("No accounting integration found");
    }

    const result = await syncTeamAccounting({
      teamId: payload.teamId,
      userId: integration.userId,
      provider: integration.provider,
      credentials: {
        clientId: process.env.QUICKBOOKS_CLIENT_ID!,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
        realmId: integration.realmId,
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
      },
      entities: ["customers", "invoices", "payments"],
      modifiedSince: integration.lastSyncedAt,
    });

    await db.accountingIntegrations.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date() },
    });

    return result;
  },
});
```

## Error Handling Best Practices

```typescript
import { QuickBooksProvider } from "@midday/accounting-providers";
import { logger } from "@midday/logger";

export async function safeQuickBooksOperation<T>(
  teamId: string,
  operation: (provider: QuickBooksProvider) => Promise<T>
): Promise<T> {
  let provider: QuickBooksProvider | null = null;

  try {
    provider = await getQuickBooksProvider(teamId);
    return await operation(provider);
  } catch (error: any) {
    logger.error("QuickBooks operation failed", {
      error,
      teamId,
      message: error.message,
    });

    // Handle specific errors
    if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
      // Try to refresh token
      try {
        if (provider) {
          await provider.refreshAccessToken();
          return await operation(provider);
        }
      } catch (refreshError) {
        // Token refresh failed - notify user to reconnect
        await notifyUserToReconnect(teamId, "quickbooks");
        throw new Error("QuickBooks authentication expired. Please reconnect.");
      }
    }

    if (error.message?.includes("rate limit")) {
      // Handle rate limiting
      await delay(60000); // Wait 1 minute
      return await operation(provider!);
    }

    throw error;
  } finally {
    if (provider) {
      await provider.disconnect();
    }
  }
}

// Usage
const customers = await safeQuickBooksOperation(teamId, async (provider) => {
  return provider.getCustomers({ maxResults: 100 });
});
```

## Testing

### Mock Provider for Testing

```typescript
import type { IAccountingProvider, AccountingCustomer } from "@midday/accounting-providers";

export class MockQuickBooksProvider implements IAccountingProvider {
  private mockCustomers: AccountingCustomer[] = [
    {
      id: "1",
      externalId: "QB-1",
      displayName: "Test Customer",
      email: "test@example.com",
    },
  ];

  async getCustomers() {
    return this.mockCustomers;
  }

  async getCustomer(id: string) {
    return this.mockCustomers.find(c => c.id === id) || null;
  }

  async createCustomer(customer: AccountingCustomer) {
    const newCustomer = {
      ...customer,
      id: String(this.mockCustomers.length + 1),
      externalId: `QB-${this.mockCustomers.length + 1}`,
    };
    this.mockCustomers.push(newCustomer);
    return newCustomer;
  }

  // Implement other methods...
}

// Use in tests
import { vi, describe, it, expect } from "vitest";

describe("Accounting Sync", () => {
  it("should sync customers", async () => {
    const mockProvider = new MockQuickBooksProvider();
    const customers = await mockProvider.getCustomers();
    expect(customers).toHaveLength(1);
    expect(customers[0].displayName).toBe("Test Customer");
  });
});
```
