# Midday Packages

This directory contains shared packages for the Midday monorepo that can be reused across multiple projects.

## Core Packages

### @midday/db
Database schema and utilities using Drizzle ORM with PostgreSQL/Supabase.

**Features:**
- Complete Stripe integration tables (customers, subscriptions, products, prices, invoices, etc.)
- Team and user management
- Type-safe database queries with Drizzle ORM

**Usage:**
```typescript
import { db } from "@midday/db";
import { stripeCustomers, stripeSubscriptions } from "@midday/db/schema";

const customer = await db.select()
  .from(stripeCustomers)
  .where(eq(stripeCustomers.teamId, teamId))
  .limit(1);
```

### @midday/queue
Reliable job queue system using BullMQ and Redis for webhook processing and background tasks.

**Features:**
- Webhook processing with retry logic
- Email sync operations
- Stripe webhook handling
- Exponential backoff retry strategy
- Dead letter queue for failed jobs

**Usage:**
```typescript
import { QueueManager } from "@midday/queue";

const queueManager = new QueueManager(config);
const webhookQueue = new WebhookQueue(queueManager);

await webhookQueue.addWebhook({
  provider: "stripe",
  eventType: "customer.subscription.created",
  payload: event,
});
```

### @midday/stripe-sync
Stripe subscription management and webhook handling with database synchronization.

**Features:**
- Webhook signature verification
- Automatic database sync for all Stripe events
- Checkout session creation
- Billing portal management
- Subscription updates and cancellations

**Usage:**
```typescript
import { StripeSubscriptionManager, StripeWebhookHandler } from "@midday/stripe-sync";

const subscriptionManager = new StripeSubscriptionManager(config);
const checkoutUrl = await subscriptionManager.createCheckoutSession({
  teamId,
  priceId,
  successUrl,
  cancelUrl,
});
```

### @midday/email-providers
Email integration for Gmail and Outlook with sync capabilities.

**Features:**
- Gmail API integration with OAuth2
- Microsoft Graph API for Outlook
- Email sending and receiving
- Folder/label management
- Email search and filtering
- Webhook support for real-time updates
- Batch operations

**Usage:**
```typescript
import { EmailSyncManager } from "@midday/email-providers";

const emailManager = new EmailSyncManager(queueManager);
await emailManager.initializeProvider(teamId, userId, "gmail", credentials);

const result = await emailManager.syncEmails({
  teamId,
  userId,
  provider: "gmail",
  credentials,
  maxResults: 100,
});
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- Database connection (DATABASE_URL)
- Redis connection for queues
- Stripe API keys and webhook secret
- Gmail/Outlook OAuth credentials

### 3. Run Database Migrations

```bash
pnpm db:push
```

### 4. Set Up Redis

Install and start Redis for queue management:

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo service redis-server start
```

### 5. Configure Stripe Webhooks

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Forward webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Add webhook endpoint in Stripe Dashboard for production

### 6. Configure Email Providers

#### Gmail Setup
1. Enable Gmail API in Google Cloud Console
2. Create OAuth2 credentials
3. Set up Pub/Sub topic for webhooks
4. Configure redirect URIs

#### Outlook Setup
1. Register app in Azure Portal
2. Configure Microsoft Graph permissions
3. Set up webhook subscriptions
4. Add redirect URIs

## Supabase Edge Functions

Deploy the edge functions for webhook processing:

```bash
# Deploy Stripe webhook handler
supabase functions deploy stripe-webhook

# Deploy Email webhook handler  
supabase functions deploy email-webhook

# Deploy Queue processor
supabase functions deploy process-queue
```

Configure secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set REDIS_HOST=your-redis-host
supabase secrets set REDIS_PASSWORD=your-redis-password
```

## Queue Management

### Monitor Queues

```bash
# Get queue metrics
curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "get-metrics", "queueName": "webhooks"}'

# List failed jobs
curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "list-failed", "queueName": "webhooks", "options": {"limit": 50}}'
```

### Retry Failed Jobs

```bash
# Retry all failed webhooks
curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "process-failed-webhooks"}'

# Retry specific job
curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "retry-job", "queueName": "webhooks", "options": {"jobId": "job_123"}}'
```

### Clean Old Jobs

```bash
# Clean completed jobs older than 24 hours
curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "clean-completed", "queueName": "webhooks"}'
```

## Testing

### Test Stripe Integration

```typescript
import { StripeSubscriptionManager } from "@midday/stripe-sync";

const manager = new StripeSubscriptionManager({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: "2024-11-20.acacia",
});

// Create test customer and subscription
const customer = await manager.createCustomer(teamId, {
  source: "test",
});

const checkoutUrl = await manager.createCheckoutSession({
  teamId,
  priceId: "price_xxx",
  customerId: customer.id,
  successUrl: "http://localhost:3000/success",
  cancelUrl: "http://localhost:3000/cancel",
});
```

### Test Email Integration

```typescript
import { EmailSyncManager } from "@midday/email-providers";

const emailManager = new EmailSyncManager();

// Initialize Gmail
await emailManager.initializeProvider(teamId, userId, "gmail", {
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  refreshToken: userRefreshToken,
});

// Send email
await emailManager.sendEmail(teamId, userId, "gmail", {
  to: "recipient@example.com",
  subject: "Test Email",
  html: "<p>This is a test email</p>",
});

// Sync emails
const result = await emailManager.syncEmails({
  teamId,
  userId,
  provider: "gmail",
  credentials,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  maxResults: 100,
});
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Client    │────▶│  Edge Functions │────▶│  Queue System   │
│                 │     │                 │     │    (Redis)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │    Database     │     │    Workers      │
                        │   (Supabase)    │◀────│   (BullMQ)      │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
                                                          │
                                ┌─────────────────────────┴─────────────────────────┐
                                │                                                   │
                                ▼                                                   ▼
                        ┌─────────────────┐                             ┌─────────────────┐
                        │                 │                             │                 │
                        │  Stripe API     │                             │  Email APIs     │
                        │                 │                             │  (Gmail/Outlook)│
                        └─────────────────┘                             └─────────────────┘
```

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check Redis password in environment variables
- Verify Redis port is not blocked by firewall

### Stripe Webhook Failures
- Verify webhook secret is correct
- Check webhook signature verification
- Ensure edge function URL is accessible
- Review webhook logs in Stripe Dashboard

### Email Sync Issues
- Verify OAuth credentials are valid
- Check refresh token hasn't expired
- Ensure required API scopes are granted
- Review email provider API quotas

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review edge function logs in Supabase Dashboard