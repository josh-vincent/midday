# @midday/communications

Multi-channel communication package supporting Email, SMS, WhatsApp, Push notifications, and Webhooks.

## Installation

```bash
npm install @midday/communications
```

## Features

- 📧 **Email** - SendGrid, Resend, Mailgun, SES, Postmark
- 💬 **SMS** - Twilio, Vonage, MessageBird
- 📱 **WhatsApp** - Twilio WhatsApp Business API
- 🔔 **Push Notifications** - Web Push, Mobile Push
- 🪝 **Webhooks** - Outbound webhook calls
- 📝 **Templates** - Handlebars-based templating
- 📬 **Queue Management** - Redis/Bull queue for reliable delivery
- 🔄 **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Webhook Verification** - Signature verification for incoming webhooks

## Quick Start

```typescript
import { CommunicationManager } from "@midday/communications";

const comms = new CommunicationManager({
  providers: {
    email: {
      default: "resend",
      configs: {
        resend: {
          provider: "resend",
          apiKey: process.env.RESEND_API_KEY,
          from: "noreply@example.com",
        },
        sendgrid: {
          provider: "sendgrid",
          apiKey: process.env.SENDGRID_API_KEY,
          from: "noreply@example.com",
        },
      },
    },
    sms: {
      default: "twilio",
      configs: {
        twilio: {
          provider: "twilio",
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_PHONE_NUMBER,
        },
      },
    },
  },
  queue: {
    enabled: true,
    redis: {
      host: "localhost",
      port: 6379,
    },
  },
  templates: {
    enabled: true,
  },
});

// Send email
await comms.send({
  channel: "email",
  recipient: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform</h1>",
});

// Send SMS
await comms.send({
  channel: "sms",
  recipient: "+1234567890",
  body: "Your verification code is 123456",
});

// Send with template
await comms.send({
  channel: "email",
  recipient: "user@example.com",
  templateId: "welcome-email",
  templateData: {
    name: "John Doe",
    activationUrl: "https://example.com/activate",
  },
});

// Queue message for later
await comms.send(
  {
    channel: "email",
    recipient: "user@example.com",
    subject: "Scheduled Email",
    html: "<p>This will be sent in 1 hour</p>",
  },
  { queue: true }
);
```

## Templates

```typescript
const templateManager = comms.getTemplateManager();

// Create template
await templateManager.createTemplate({
  name: "welcome-email",
  channel: "email",
  subject: "Welcome {{name}}!",
  body: `
    <h1>Welcome {{name}}!</h1>
    <p>Thanks for joining on {{formatDate joinDate "short"}}.</p>
    <a href="{{activationUrl}}">Activate Account</a>
  `,
  variables: [
    { name: "name", type: "string", required: true },
    { name: "joinDate", type: "date", required: true },
    { name: "activationUrl", type: "string", required: true },
  ],
});
```

## Webhook Handling

```typescript
import { WebhookHandler } from "@midday/communications";

const webhookHandler = new WebhookHandler({
  provider: "sendgrid",
  secret: process.env.SENDGRID_WEBHOOK_SECRET,
  verifySignature: true,
});

webhookHandler.on("message.delivered", async (event, data) => {
  console.log("Email delivered:", data.messageId);
});

webhookHandler.on("message.bounced", async (event, data) => {
  console.log("Email bounced:", data.email);
});

// In your webhook endpoint
app.post("/webhooks/sendgrid", async (req, res) => {
  await webhookHandler.handle(req.headers, req.body, req.rawBody);
  res.sendStatus(200);
});
```

## Queue Management

```typescript
const queueManager = comms.getQueueManager();

// Get queue status
const status = await queueManager.getQueueStatus("email");
console.log(status);
// { waiting: 10, active: 2, completed: 100, failed: 3, delayed: 5, paused: false }

// Retry failed jobs
const failedJobs = await queueManager.getJobs("email", "failed");
for (const job of failedJobs) {
  await queueManager.retryJob("email", job.id);
}

// Pause/resume queue
await queueManager.pause("email");
await queueManager.resume("email");
```

## User Preferences

```typescript
// Send respecting user preferences
await comms.sendToUser(
  "user-123",
  {
    subject: "New notification",
    templateId: "notification",
    templateData: { message: "You have a new message" },
  },
  {
    userId: "user-123",
    channels: {
      email: { enabled: true, address: "user@example.com" },
      sms: { enabled: false },
      push: { enabled: true, address: "push-token-123" },
    },
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "08:00",
    },
  }
);
```

## API Reference

See [API Documentation](./docs/API.md) for detailed API reference.

## License

MIT