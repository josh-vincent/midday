# @midday/payments

A comprehensive payment processing solution supporting multiple payment providers, subscription management, invoicing, and financial operations.

## Features

- **Multi-Provider Support**: Stripe, PayPal, Square, Braintree, and more
- **Payment Processing**: One-time payments, recurring subscriptions, marketplace payments
- **Subscription Management**: Plans, billing cycles, upgrades, downgrades, cancellations
- **Invoice Generation**: Professional invoices with customizable templates
- **Refund Management**: Full and partial refunds with automated processing
- **Fraud Protection**: Built-in fraud detection and risk assessment
- **Multi-Currency**: Support for international payments and currency conversion
- **Webhooks**: Real-time payment notifications and event handling
- **Analytics**: Payment analytics, revenue tracking, and financial reporting

## Installation

```bash
npm install @midday/payments
```

## Quick Start

### Basic Payment Processing

```typescript
import { PaymentManager, StripeProvider } from "@midday/payments";

// Initialize payment provider
const stripeProvider = new StripeProvider({
  apiKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: "2023-10-16",
});

const paymentManager = new PaymentManager(stripeProvider, repository);

// Process a one-time payment
const payment = await paymentManager.createPayment({
  amount: 2999, // $29.99 in cents
  currency: "usd",
  paymentMethod: "pm_1234567890",
  customerId: "cus_customer123",
  description: "Premium subscription",
  metadata: {
    orderId: "order_123",
    userId: "user_456",
  },
});

// Confirm payment
const confirmedPayment = await paymentManager.confirmPayment(payment.id);

console.log(`Payment status: ${confirmedPayment.status}`);
```

### Subscription Management

```typescript
import { SubscriptionManager } from "@midday/payments";

const subscriptionManager = new SubscriptionManager(stripeProvider, repository);

// Create subscription plan
const plan = await subscriptionManager.createPlan({
  id: "premium-monthly",
  name: "Premium Monthly",
  amount: 2999, // $29.99
  currency: "usd",
  interval: "month",
  intervalCount: 1,
  trialPeriodDays: 14,
  features: [
    "Unlimited projects",
    "Advanced analytics",
    "Priority support",
  ],
});

// Subscribe customer to plan
const subscription = await subscriptionManager.createSubscription({
  customerId: "cus_customer123",
  planId: "premium-monthly",
  paymentMethod: "pm_1234567890",
  trialPeriodDays: 14,
  metadata: {
    source: "website",
    campaign: "summer2024",
  },
});

// Upgrade subscription
const upgradedSubscription = await subscriptionManager.updateSubscription(
  subscription.id,
  {
    planId: "premium-yearly",
    prorationBehavior: "create_prorations",
  }
);
```

### Invoice Management

```typescript
import { InvoiceManager } from "@midday/payments";

const invoiceManager = new InvoiceManager(stripeProvider, repository);

// Create invoice
const invoice = await invoiceManager.createInvoice({
  customerId: "cus_customer123",
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  items: [
    {
      description: "Professional Services",
      quantity: 40,
      unitAmount: 15000, // $150.00 per hour
      taxRate: 0.08, // 8% tax
    },
    {
      description: "Software License",
      quantity: 1,
      unitAmount: 99900, // $999.00
    },
  ],
  metadata: {
    projectId: "proj_123",
    clientId: "client_456",
  },
});

// Send invoice
await invoiceManager.sendInvoice(invoice.id, {
  subject: "Invoice for Professional Services",
  message: "Thank you for your business!",
});

// Generate PDF
const pdfBuffer = await invoiceManager.generatePDF(invoice.id);
```

### Refund Processing

```typescript
import { RefundManager } from "@midday/payments";

const refundManager = new RefundManager(stripeProvider, repository);

// Process full refund
const refund = await refundManager.createRefund({
  paymentId: "pi_1234567890",
  reason: "requested_by_customer",
  metadata: {
    supportTicket: "ticket_789",
    refundedBy: "support_agent_123",
  },
});

// Process partial refund
const partialRefund = await refundManager.createRefund({
  paymentId: "pi_1234567890",
  amount: 1000, // $10.00 refund from larger payment
  reason: "duplicate",
});

// Get refund status
const refundStatus = await refundManager.getRefund(refund.id);
console.log(`Refund status: ${refundStatus.status}`);
```

### Multi-Provider Setup

```typescript
import { 
  PaymentManager, 
  StripeProvider, 
  PayPalProvider 
} from "@midday/payments";

// Configure multiple providers
const stripeProvider = new StripeProvider({
  apiKey: process.env.STRIPE_SECRET_KEY,
});

const paypalProvider = new PayPalProvider({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: "sandbox", // or "production"
});

// Use different providers for different regions/customers
const getPaymentProvider = (customerCountry: string) => {
  switch (customerCountry) {
    case "US":
    case "CA":
      return stripeProvider;
    case "DE":
    case "FR":
    case "GB":
      return paypalProvider;
    default:
      return stripeProvider;
  }
};

const provider = getPaymentProvider("US");
const paymentManager = new PaymentManager(provider, repository);
```

### Webhook Handling

```typescript
// Express.js webhook endpoint
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = await stripeProvider.verifyWebhook(
      req.body,
      sig as string
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});
```

## API Reference

### PaymentManager

Main class for payment processing operations.

#### Methods

- `createPayment(options)` - Create a new payment
- `confirmPayment(paymentId, options?)` - Confirm payment intent
- `capturePayment(paymentId, amount?)` - Capture authorized payment
- `cancelPayment(paymentId)` - Cancel pending payment
- `getPayment(paymentId)` - Retrieve payment details
- `listPayments(filter?)` - List payments with filtering
- `updatePayment(paymentId, updates)` - Update payment metadata

### SubscriptionManager

Manages recurring subscriptions and billing.

#### Methods

- `createPlan(plan)` - Create subscription plan
- `updatePlan(planId, updates)` - Update plan details
- `deletePlan(planId)` - Delete subscription plan
- `createSubscription(subscription)` - Create new subscription
- `updateSubscription(subscriptionId, updates)` - Update subscription
- `cancelSubscription(subscriptionId, options?)` - Cancel subscription
- `pauseSubscription(subscriptionId)` - Pause subscription
- `resumeSubscription(subscriptionId)` - Resume paused subscription
- `getSubscription(subscriptionId)` - Get subscription details
- `listSubscriptions(filter?)` - List subscriptions

### InvoiceManager

Handles invoice creation and management.

#### Methods

- `createInvoice(invoice)` - Create new invoice
- `updateInvoice(invoiceId, updates)` - Update invoice
- `sendInvoice(invoiceId, options)` - Send invoice to customer
- `markInvoicePaid(invoiceId, payment?)` - Mark invoice as paid
- `voidInvoice(invoiceId)` - Void invoice
- `generatePDF(invoiceId)` - Generate invoice PDF
- `getInvoice(invoiceId)` - Get invoice details
- `listInvoices(filter?)` - List invoices

### RefundManager

Processes refunds and disputes.

#### Methods

- `createRefund(refund)` - Process refund
- `getRefund(refundId)` - Get refund details
- `listRefunds(filter?)` - List refunds
- `updateRefund(refundId, updates)` - Update refund metadata
- `getRefundAnalytics(period)` - Get refund analytics

## Provider Configuration

### Stripe

```typescript
const stripeProvider = new StripeProvider({
  apiKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: "2023-10-16",
  timeout: 30000,
  maxNetworkRetries: 3,
  telemetry: true,
});
```

### PayPal

```typescript
const paypalProvider = new PayPalProvider({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: "production", // or "sandbox"
  timeout: 30000,
  headers: {
    "PayPal-Partner-Attribution-Id": "your-partner-id",
  },
});
```

### Square

```typescript
const squareProvider = new SquareProvider({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: "production", // or "sandbox"
  applicationId: "your-app-id",
  customUrl: "https://connect.squareup.com",
});
```

### Braintree

```typescript
const braintreeProvider = new BraintreeProvider({
  environment: "Production", // or "Sandbox"
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});
```

## Payment Options

### Basic Payment

```typescript
const paymentOptions = {
  amount: 2999, // Amount in smallest currency unit
  currency: "usd",
  paymentMethod: "pm_card_visa", // or payment method ID
  customerId: "cus_customer123",
  description: "Premium subscription",
  metadata: {
    orderId: "order_123",
    userId: "user_456",
  },
  confirmationMethod: "automatic", // or "manual"
  captureMethod: "automatic", // or "manual"
};
```

### Advanced Payment

```typescript
const advancedOptions = {
  amount: 5000,
  currency: "usd",
  paymentMethod: "pm_card_visa",
  customerId: "cus_customer123",
  applicationFeeAmount: 250, // Marketplace fee
  transferData: {
    destination: "acct_connected_account",
  },
  shipping: {
    address: {
      line1: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94111",
      country: "US",
    },
    name: "John Doe",
  },
  statementDescriptor: "MYCOMPANY PURCHASE",
  receiptEmail: "customer@example.com",
};
```

## Subscription Plans

### Basic Plan

```typescript
const basicPlan = {
  id: "basic-monthly",
  name: "Basic Plan",
  amount: 999, // $9.99
  currency: "usd",
  interval: "month",
  intervalCount: 1,
  usageType: "licensed", // or "metered"
  billingScheme: "per_unit", // or "tiered"
};
```

### Tiered Pricing Plan

```typescript
const tieredPlan = {
  id: "api-usage",
  name: "API Usage Plan",
  currency: "usd",
  interval: "month",
  billingScheme: "tiered",
  tiers: [
    {
      upTo: 1000,
      unitAmount: 0, // Free tier
    },
    {
      upTo: 10000,
      unitAmount: 10, // $0.10 per unit
    },
    {
      upTo: null, // Unlimited
      unitAmount: 5, // $0.05 per unit
    },
  ],
  tiersMode: "graduated", // or "volume"
};
```

## Invoice Configuration

### Basic Invoice

```typescript
const invoiceOptions = {
  customerId: "cus_customer123",
  description: "Professional Services Invoice",
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  items: [
    {
      description: "Consulting Hours",
      quantity: 20,
      unitAmount: 15000, // $150.00 per hour
    },
  ],
  taxRate: 0.08, // 8% tax
  discountPercent: 5, // 5% discount
};
```

### Recurring Invoice

```typescript
const recurringInvoice = {
  customerId: "cus_customer123",
  description: "Monthly Retainer",
  items: [
    {
      description: "Monthly Retainer Fee",
      quantity: 1,
      unitAmount: 500000, // $5,000.00
    },
  ],
  schedule: {
    interval: "month",
    intervalCount: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  autoAdvance: true,
};
```

## Error Handling

### Payment Errors

```typescript
import { 
  PaymentError, 
  CardDeclinedError, 
  InsufficientFundsError,
  InvalidRequestError 
} from "@midday/payments";

try {
  const payment = await paymentManager.createPayment(paymentOptions);
} catch (error) {
  if (error instanceof CardDeclinedError) {
    console.error("Card was declined:", error.declineCode);
  } else if (error instanceof InsufficientFundsError) {
    console.error("Insufficient funds");
  } else if (error instanceof InvalidRequestError) {
    console.error("Invalid request:", error.message);
  } else {
    console.error("Payment error:", error);
  }
}
```

### Subscription Errors

```typescript
import { 
  SubscriptionError, 
  PlanNotFoundError, 
  CustomerNotFoundError 
} from "@midday/payments";

try {
  const subscription = await subscriptionManager.createSubscription(options);
} catch (error) {
  if (error instanceof PlanNotFoundError) {
    console.error("Plan not found:", error.planId);
  } else if (error instanceof CustomerNotFoundError) {
    console.error("Customer not found:", error.customerId);
  } else {
    console.error("Subscription error:", error);
  }
}
```

## Analytics and Reporting

### Revenue Analytics

```typescript
const analytics = await paymentManager.getAnalytics({
  period: {
    start: new Date("2024-01-01"),
    end: new Date("2024-12-31"),
  },
  groupBy: "month",
  metrics: ["revenue", "transactions", "refunds"],
});

console.log(`Total revenue: $${analytics.totalRevenue / 100}`);
console.log(`Success rate: ${analytics.successRate}%`);
console.log(`Average transaction: $${analytics.averageTransaction / 100}`);
```

### Subscription Metrics

```typescript
const subscriptionMetrics = await subscriptionManager.getMetrics({
  period: {
    start: new Date("2024-01-01"),
    end: new Date("2024-12-31"),
  },
});

console.log(`MRR: $${subscriptionMetrics.monthlyRecurringRevenue / 100}`);
console.log(`Churn rate: ${subscriptionMetrics.churnRate}%`);
console.log(`LTV: $${subscriptionMetrics.customerLifetimeValue / 100}`);
```

## Security Best Practices

### 1. Use Environment Variables

```typescript
const stripeProvider = new StripeProvider({
  apiKey: process.env.STRIPE_SECRET_KEY, // Never hardcode
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});
```

### 2. Validate Webhooks

```typescript
app.post('/webhooks', async (req, res) => {
  try {
    const event = await provider.verifyWebhook(req.body, req.headers);
    // Process verified event
  } catch (error) {
    return res.status(400).send('Webhook verification failed');
  }
});
```

### 3. Handle PCI Compliance

```typescript
// Never store card details directly
const payment = await paymentManager.createPayment({
  amount: 2999,
  currency: "usd",
  paymentMethod: "pm_card_token", // Use tokenized payment methods
  customerId: "cus_customer123",
});
```

### 4. Implement Idempotency

```typescript
const payment = await paymentManager.createPayment({
  amount: 2999,
  currency: "usd",
  paymentMethod: "pm_card_visa",
  idempotencyKey: "unique-operation-id", // Prevent duplicate charges
});
```

## Testing

```bash
npm test
```

## License

Private package for Midday platform.