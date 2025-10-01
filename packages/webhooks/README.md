# @midday/webhooks

A comprehensive webhook management system with event subscriptions, retry logic, signature verification, and delivery tracking.

## Features

- **Event Management**: Type-safe event publishing and subscription
- **Webhook Delivery**: Reliable delivery with exponential backoff retry
- **Signature Verification**: HMAC-based payload signing and verification
- **Subscription Management**: Flexible event filtering and routing
- **Retry Logic**: Configurable retry policies with dead letter queues
- **Rate Limiting**: Protect endpoints from excessive webhook deliveries
- **Analytics**: Delivery metrics, failure tracking, and performance monitoring
- **Security**: IP whitelisting, signature validation, and encrypted payloads

## Installation

```bash
npm install @midday/webhooks
```

## Quick Start

### Basic Webhook Setup

```typescript
import { WebhookManager, WebhookHandler } from "@midday/webhooks";

// Initialize webhook manager
const webhookManager = new WebhookManager(repository, {
  defaultRetryAttempts: 3,
  retryBackoffMultiplier: 2,
  maxRetryDelay: 300000, // 5 minutes
  defaultTimeout: 30000, // 30 seconds
  signatureSecret: process.env.WEBHOOK_SECRET,
});

// Create a webhook endpoint
const webhook = await webhookManager.createWebhook({
  url: "https://api.example.com/webhooks/events",
  events: ["user.created", "payment.completed", "invoice.sent"],
  secret: "your-webhook-secret",
  metadata: {
    source: "user-dashboard",
    version: "v1",
  },
});

// Subscribe to events
await webhookManager.subscribe({
  webhookId: webhook.id,
  events: ["user.updated", "user.deleted"],
});
```

### Publishing Events

```typescript
// Publish an event
await webhookManager.publishEvent({
  type: "user.created",
  data: {
    userId: "user123",
    email: "user@example.com",
    name: "John Doe",
    createdAt: new Date().toISOString(),
  },
  metadata: {
    source: "user-service",
    version: "1.0",
  },
});

// Publish with custom delivery options
await webhookManager.publishEvent({
  type: "payment.completed",
  data: {
    paymentId: "pay123",
    amount: 1500,
    currency: "USD",
    customerId: "cust456",
  },
  deliveryOptions: {
    maxRetries: 5,
    retryDelay: 5000,
    timeout: 60000,
  },
});
```

### Webhook Handler

```typescript
import { WebhookHandler } from "@midday/webhooks";

// Create webhook handler for incoming webhooks
const handler = new WebhookHandler({
  secret: process.env.WEBHOOK_SECRET,
  tolerance: 300, // 5 minutes tolerance for timestamp validation
});

// Express.js middleware
app.post('/webhooks/stripe', async (req, res) => {
  try {
    const event = await handler.verifyAndParse(
      req.body,
      req.headers['stripe-signature'] as string
    );
    
    // Process the verified event
    await processStripeEvent(event);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
});

// Manual verification
const isValid = await handler.verifySignature(
  payload,
  signature,
  timestamp
);
```

### Event Subscriptions

```typescript
import { SubscriptionManager } from "@midday/webhooks";

const subscriptionManager = new SubscriptionManager(repository);

// Create subscription with filters
const subscription = await subscriptionManager.createSubscription({
  webhookId: "webhook123",
  events: ["user.*", "payment.completed"],
  filters: {
    "user.created": {
      "data.plan": ["premium", "enterprise"],
    },
    "payment.completed": {
      "data.amount": { $gte: 1000 },
    },
  },
  transform: {
    enabled: true,
    template: "slack", // Use predefined template
  },
});

// Update subscription
await subscriptionManager.updateSubscription(subscription.id, {
  events: ["user.*", "payment.*", "invoice.*"],
  active: true,
});

// Pause subscription
await subscriptionManager.pauseSubscription(subscription.id);
```

### Retry Configuration

```typescript
// Configure custom retry policy
const retryConfig = {
  maxAttempts: 5,
  backoffType: "exponential" as const,
  baseDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
  multiplier: 2,
  jitter: true,
};

// Create webhook with custom retry
const webhook = await webhookManager.createWebhook({
  url: "https://api.example.com/webhooks",
  events: ["order.created"],
  retryConfig,
});

// Manual retry of failed delivery
await webhookManager.retryDelivery("delivery123");
```

### Delivery Tracking

```typescript
import { DeliveryManager } from "@midday/webhooks";

const deliveryManager = new DeliveryManager(repository);

// Get delivery status
const delivery = await deliveryManager.getDelivery("delivery123");
console.log(`Status: ${delivery.status}`);
console.log(`Attempts: ${delivery.attempts}`);

// Get delivery history for webhook
const deliveries = await deliveryManager.getDeliveries({
  webhookId: "webhook123",
  status: ["failed", "pending"],
  limit: 50,
});

// Get delivery metrics
const metrics = await deliveryManager.getMetrics({
  webhookId: "webhook123",
  period: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
  },
});

console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Average response time: ${metrics.averageResponseTime}ms`);
```

### Signature Verification

```typescript
import { WebhookSigner } from "@midday/webhooks";

const signer = new WebhookSigner("your-secret-key");

// Sign payload (for outgoing webhooks)
const signature = signer.sign(payload, timestamp);

// Verify signature (for incoming webhooks)
const isValid = signer.verify(payload, signature, timestamp);

// Generate signature header
const signatureHeader = signer.generateHeader(payload, timestamp);
// Returns: "t=1634567890,v1=abc123def456..."
```

## API Reference

### WebhookManager

Main class for webhook management and event publishing.

#### Methods

- `createWebhook(options)` - Create a new webhook endpoint
- `updateWebhook(id, updates)` - Update webhook configuration
- `deleteWebhook(id)` - Delete a webhook
- `getWebhook(id)` - Get webhook details
- `listWebhooks(filter?)` - List webhooks with filtering
- `publishEvent(event)` - Publish event to subscribed webhooks
- `subscribe(subscription)` - Subscribe webhook to events
- `unsubscribe(webhookId, events)` - Unsubscribe from events
- `retryDelivery(deliveryId)` - Retry failed delivery

### SubscriptionManager

Manages event subscriptions and filtering.

#### Methods

- `createSubscription(subscription)` - Create event subscription
- `updateSubscription(id, updates)` - Update subscription
- `deleteSubscription(id)` - Delete subscription
- `getSubscription(id)` - Get subscription details
- `listSubscriptions(filter?)` - List subscriptions
- `pauseSubscription(id)` - Pause subscription
- `resumeSubscription(id)` - Resume subscription

### DeliveryManager

Tracks webhook deliveries and provides analytics.

#### Methods

- `getDelivery(id)` - Get delivery details
- `getDeliveries(filter?)` - List deliveries with filtering
- `getMetrics(options)` - Get delivery metrics and analytics
- `getFailedDeliveries(webhookId)` - Get failed deliveries for webhook
- `markDeliverySuccess(id, response)` - Mark delivery as successful
- `markDeliveryFailed(id, error)` - Mark delivery as failed

### WebhookHandler

Handles incoming webhook verification and processing.

#### Methods

- `verifyAndParse(payload, signature, headers?)` - Verify and parse webhook
- `verifySignature(payload, signature, timestamp)` - Verify webhook signature
- `parsePayload(payload, contentType?)` - Parse webhook payload
- `validateEvent(event, schema?)` - Validate event structure

### WebhookSigner

Provides HMAC signature generation and verification.

#### Methods

- `sign(payload, timestamp)` - Generate signature for payload
- `verify(payload, signature, timestamp)` - Verify payload signature
- `generateHeader(payload, timestamp)` - Generate complete signature header
- `parseHeader(header)` - Parse signature header

## Configuration

### Webhook Configuration

```typescript
interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: RetryConfig;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  ipWhitelist?: string[];
  metadata?: Record<string, any>;
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffType: "linear" | "exponential" | "fixed";
  baseDelay: number;
  maxDelay: number;
  multiplier?: number;
  jitter?: boolean;
}
```

### Event Filters

```typescript
interface EventFilter {
  [eventType: string]: {
    [fieldPath: string]: any | {
      $eq?: any;
      $ne?: any;
      $gt?: number;
      $gte?: number;
      $lt?: number;
      $lte?: number;
      $in?: any[];
      $nin?: any[];
      $exists?: boolean;
    };
  };
}
```

## Event Types

Define your event types for type safety:

```typescript
interface UserCreatedEvent {
  type: "user.created";
  data: {
    userId: string;
    email: string;
    name: string;
    plan: string;
    createdAt: string;
  };
}

interface PaymentCompletedEvent {
  type: "payment.completed";
  data: {
    paymentId: string;
    amount: number;
    currency: string;
    customerId: string;
    completedAt: string;
  };
}

type AppEvent = UserCreatedEvent | PaymentCompletedEvent;
```

## Security Best Practices

### 1. Always Verify Signatures

```typescript
// Never process unverified webhooks
const event = await handler.verifyAndParse(payload, signature);
```

### 2. Use HTTPS Endpoints

```typescript
const webhook = await webhookManager.createWebhook({
  url: "https://secure.example.com/webhooks", // Always HTTPS
  events: ["user.created"],
});
```

### 3. Implement Idempotency

```typescript
// Use event IDs to prevent duplicate processing
const processedEvents = new Set();

if (processedEvents.has(event.id)) {
  return; // Already processed
}
processedEvents.add(event.id);
```

### 4. Rate Limiting

```typescript
const webhook = await webhookManager.createWebhook({
  url: "https://api.example.com/webhooks",
  events: ["user.created"],
  rateLimit: {
    requests: 100,
    window: 60, // 100 requests per minute
  },
});
```

## Error Handling

### Custom Error Types

```typescript
import { WebhookError, SignatureError, DeliveryError } from "@midday/webhooks";

try {
  await webhookManager.publishEvent(event);
} catch (error) {
  if (error instanceof SignatureError) {
    console.error("Signature verification failed:", error.message);
  } else if (error instanceof DeliveryError) {
    console.error("Delivery failed:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Delivery Failure Handling

```typescript
// Get failed deliveries and implement custom retry logic
const failedDeliveries = await deliveryManager.getFailedDeliveries("webhook123");

for (const delivery of failedDeliveries) {
  if (delivery.attempts < 3) {
    await webhookManager.retryDelivery(delivery.id);
  } else {
    // Send to dead letter queue or alert admins
    await handlePermanentFailure(delivery);
  }
}
```

## Testing

```bash
npm test
```

## License

Private package for Midday platform.