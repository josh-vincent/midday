# Email Providers Package

Complete email integration package for Gmail and Outlook with OAuth2 authentication, email syncing, and webhook support.

## Features

- ✅ Gmail integration via Google APIs
- ✅ Outlook integration via Microsoft Graph API
- ✅ OAuth 2.0 token management with auto-refresh
- ✅ Batch email syncing with pagination
- ✅ Search and filter emails
- ✅ Send emails
- ✅ Folder/Label management
- ✅ Thread support
- ✅ Webhook notifications (Gmail Push, Outlook Change Notifications)
- ✅ Attachment handling
- ✅ TypeScript types and Zod schemas

## Installation

This package is already installed in the monorepo. Import from `@midday/email-providers`.

## Quick Start

### 1. Fetch OAuth Connection

```typescript
import { createClient } from "@midday/supabase/server";

const supabase = await createClient();

// Get the connection from oauth_connections table
const { data: connection } = await supabase
  .from("oauth_connections")
  .select("*")
  .eq("team_id", teamId)
  .eq("provider", "gmail") // or "outlook"
  .single();
```

### 2. Initialize Provider

```typescript
import { GmailProvider, OutlookProvider } from "@midday/email-providers";

// For Gmail
const gmailProvider = new GmailProvider({
  accessToken: connection.credentials.accessToken,
  refreshToken: connection.credentials.refreshToken,
  expiryDate: connection.credentials.expiryDate,
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
});

// For Outlook
const outlookProvider = new OutlookProvider({
  accessToken: connection.credentials.accessToken,
  refreshToken: connection.credentials.refreshToken,
  expiryDate: connection.credentials.expiryDate,
  clientId: process.env.OUTLOOK_CLIENT_ID,
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  tenantId: process.env.OUTLOOK_TENANT_ID,
});
```

### 3. Sync Emails

```typescript
const result = await gmailProvider.syncEmails({
  teamId: "team-uuid",
  userId: "user-uuid",
  provider: "gmail",
  credentials: connection.credentials,
  maxResults: 100,
  startDate: new Date("2025-01-01"),
  syncAttachments: true,
});

console.log(result);
// {
//   success: true,
//   synced: { messages: 100, attachments: 25, folders: 5 },
//   errors: [],
//   nextSyncToken: "sync-token-for-incremental-sync"
// }
```

## API Reference

### EmailSyncOptions

```typescript
interface EmailSyncOptions {
  teamId: string;              // Required: Team ID
  userId: string;              // Required: User ID
  provider: "gmail" | "outlook"; // Required: Provider type
  credentials: any;            // Required: OAuth credentials
  folders?: string[];          // Optional: Specific folders to sync
  startDate?: Date;            // Optional: Sync from this date
  endDate?: Date;              // Optional: Sync until this date
  maxResults?: number;         // Optional: Max messages per sync (default: 100)
  syncAttachments?: boolean;   // Optional: Include attachments (default: false)
  syncDrafts?: boolean;        // Optional: Include draft messages
  syncSent?: boolean;          // Optional: Include sent messages
  syncTrash?: boolean;         // Optional: Include trashed messages
}
```

### EmailSyncResult

```typescript
interface EmailSyncResult {
  success: boolean;
  synced: {
    messages: number;
    attachments: number;
    folders: number;
  };
  errors: Array<{
    messageId?: string;
    error: string;
  }>;
  nextSyncToken?: string;  // Use this for incremental syncing
}
```

### EmailMessage

```typescript
interface EmailMessage {
  id?: string;
  from: string | EmailAddress;
  to: string | string[] | EmailAddress | EmailAddress[];
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  inReplyTo?: string;
  references?: string | string[];
  priority?: "high" | "normal" | "low";
  metadata?: Record<string, any>;
}
```

## Common Use Cases

### 1. Search Emails

```typescript
const emails = await gmailProvider.searchEmails({
  query: "invoice",
  from: "billing@example.com",
  hasAttachments: true,
  isUnread: true,
  startDate: new Date("2025-01-01"),
  maxResults: 50,
});

// Returns: EmailMessage[]
```

### 2. Get Single Email

```typescript
const email = await gmailProvider.getEmail("message-id-123");

// Returns: EmailMessage with full details
```

### 3. Send Email

```typescript
await gmailProvider.sendEmail({
  from: "you@example.com",
  to: ["recipient@example.com"],
  subject: "Test Email",
  html: "<h1>Hello World</h1>",
  attachments: [{
    filename: "invoice.pdf",
    path: "/path/to/invoice.pdf",
  }],
});
```

### 4. Get Folders/Labels

```typescript
const folders = await gmailProvider.getFolders();

// Returns: EmailFolder[]
// [
//   { id: "INBOX", name: "Inbox", type: "inbox", unreadCount: 5 },
//   { id: "SENT", name: "Sent", type: "sent" },
//   ...
// ]
```

### 5. Get Threads

```typescript
const threads = await gmailProvider.getThreads(50);

// Returns: EmailThread[]
```

### 6. Batch Operations

```typescript
await gmailProvider.batchOperation({
  operation: "markRead",
  messageIds: ["msg-1", "msg-2", "msg-3"],
});

await gmailProvider.batchOperation({
  operation: "move",
  messageIds: ["msg-4"],
  targetFolder: "Archive",
});
```

### 7. Setup Webhooks (Push Notifications)

```typescript
const watchResult = await gmailProvider.watchEmails({
  provider: "gmail",
  teamId: "team-uuid",
  userId: "user-uuid",
  credentials: connection.credentials,
  webhookUrl: "https://your-app.com/api/webhooks/gmail",
  labelIds: ["INBOX"],
});

console.log(watchResult);
// {
//   historyId: "12345",
//   expiration: 1234567890000
// }
```

## Using with tRPC

The package is already integrated into the tRPC emails router:

```typescript
// In your React component
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

// Get email connections
const { data: connections } = useQuery(
  trpc.emails.connections.queryOptions()
);

// Sync emails
const syncMutation = useMutation(
  trpc.emails.sync.mutationOptions({
    onSuccess: (data) => {
      console.log(`Synced ${data.emailsCount} emails`);
    },
  })
);

syncMutation.mutate({
  connectionId: "connection-uuid",
  maxResults: 100,
});

// Search emails
const { data: emails } = useQuery(
  trpc.emails.search.queryOptions({
    connectionId: "connection-uuid",
    query: "invoice",
    hasAttachments: true,
  })
);
```

## Database Schema

Emails are stored in the `synced_emails` table:

```sql
CREATE TABLE synced_emails (
  id UUID PRIMARY KEY,
  connection_id UUID REFERENCES oauth_connections(id),
  message_id VARCHAR(255) NOT NULL,
  thread_id VARCHAR(255),
  subject TEXT,
  from_email VARCHAR(255),
  to_emails JSONB DEFAULT '[]',
  received_at TIMESTAMP,
  has_attachments BOOLEAN DEFAULT false,
  body_preview TEXT,
  labels JSONB DEFAULT '[]',
  folder VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret

# Outlook OAuth
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_TENANT_ID=common  # or your tenant ID
```

## Error Handling

```typescript
try {
  const result = await gmailProvider.syncEmails(options);

  if (!result.success) {
    console.error("Sync had errors:", result.errors);
  }

  // Check individual errors
  result.errors.forEach(error => {
    console.error(`Message ${error.messageId}: ${error.error}`);
  });

} catch (error) {
  console.error("Sync failed completely:", error);
}
```

## Token Refresh

Tokens are automatically refreshed when expired. The providers handle this internally:

```typescript
// Tokens will be refreshed automatically during API calls
const emails = await gmailProvider.searchEmails({ ... });

// Get updated credentials after refresh
const updatedCredentials = gmailProvider.getCredentials();

// Update in database
await supabase
  .from("oauth_connections")
  .update({ credentials: updatedCredentials })
  .eq("id", connectionId);
```

## Best Practices

1. **Incremental Syncing**: Use `nextSyncToken` to avoid re-syncing old emails
```typescript
const result = await gmailProvider.syncEmails({
  ...options,
  syncToken: previousSyncToken,
});
```

2. **Pagination**: Limit results per sync to avoid timeouts
```typescript
const result = await gmailProvider.syncEmails({
  ...options,
  maxResults: 100, // Don't exceed 500
});
```

3. **Background Jobs**: Use Trigger.dev for long-running syncs
```typescript
// In packages/jobs/src/tasks/email/sync-emails.ts
export const syncEmails = task({
  id: "sync-emails",
  maxDuration: 600,
  run: async ({ connectionId, teamId }) => {
    // Your sync logic here
  },
});
```

4. **Webhooks**: Set up webhooks for real-time updates instead of polling
```typescript
// Webhooks reduce API calls and provide instant notifications
await gmailProvider.watchEmails({ ... });
```

## TypeScript Support

All types are exported from the package:

```typescript
import type {
  EmailMessage,
  EmailSyncOptions,
  EmailSyncResult,
  EmailSearchOptions,
  EmailFolder,
  EmailThread,
  GmailCredentials,
  OutlookCredentials,
} from "@midday/email-providers";
```

## Testing

```typescript
// Mock provider for testing
import { GmailProvider } from "@midday/email-providers";

const mockCredentials = {
  accessToken: "test-token",
  refreshToken: "test-refresh",
  expiryDate: Date.now() + 3600000,
};

const provider = new GmailProvider(mockCredentials);
```

## Support

- Gmail API Docs: https://developers.google.com/gmail/api
- Microsoft Graph Docs: https://learn.microsoft.com/en-us/graph/api/resources/message
- OAuth 2.0: https://oauth.net/2/
