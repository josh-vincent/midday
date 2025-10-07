# Email Providers - Usage Examples

Complete examples showing how to use the email providers package for common tasks.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Syncing Emails](#syncing-emails)
3. [Searching Emails](#searching-emails)
4. [Sending Emails](#sending-emails)
5. [Managing Folders](#managing-folders)
6. [Webhooks](#webhooks)
7. [Background Jobs (Trigger.dev)](#background-jobs-triggerdev)
8. [tRPC Integration](#trpc-integration)

---

## Initial Setup

### Get OAuth Connection from Database

```typescript
import { createClient } from "@midday/supabase/server";

async function getEmailConnection(teamId: string, provider: "gmail" | "outlook") {
  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("team_id", teamId)
    .eq("provider", provider)
    .single();

  if (error || !connection) {
    throw new Error(`No ${provider} connection found`);
  }

  return connection;
}
```

### Initialize Provider

```typescript
import { GmailProvider, OutlookProvider } from "@midday/email-providers";
import type { GmailCredentials, OutlookCredentials } from "@midday/email-providers";

async function initializeGmailProvider(teamId: string) {
  const connection = await getEmailConnection(teamId, "gmail");

  return new GmailProvider({
    accessToken: connection.credentials.accessToken,
    refreshToken: connection.credentials.refreshToken,
    expiryDate: connection.credentials.expiryDate,
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  });
}

async function initializeOutlookProvider(teamId: string) {
  const connection = await getEmailConnection(teamId, "outlook");

  return new OutlookProvider({
    accessToken: connection.credentials.accessToken,
    refreshToken: connection.credentials.refreshToken,
    expiryDate: connection.credentials.expiryDate,
    clientId: process.env.OUTLOOK_CLIENT_ID!,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
    tenantId: process.env.OUTLOOK_TENANT_ID!,
  });
}
```

---

## Syncing Emails

### Basic Email Sync

```typescript
import { emailSyncOptionsSchema, emailSyncResultSchema } from "@midday/email-providers";

async function syncEmails(teamId: string, userId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  // Validate options with Zod
  const options = emailSyncOptionsSchema.parse({
    teamId,
    userId,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults: 100,
    syncAttachments: false,
  });

  // Perform sync
  const result = await provider.syncEmails(options);

  // Validate result with Zod
  const validated = emailSyncResultSchema.parse(result);

  console.log(`Synced ${validated.synced.messages} emails`);

  return validated;
}
```

### Incremental Sync (Using Sync Token)

```typescript
async function incrementalSync(teamId: string, userId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  // Get last sync token from database
  const lastSyncToken = connection.sync_token;

  const result = await provider.syncEmails({
    teamId,
    userId,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults: 100,
    syncToken: lastSyncToken, // Only fetch new emails since last sync
  });

  // Save new sync token for next time
  const supabase = await createClient();
  await supabase
    .from("oauth_connections")
    .update({
      sync_token: result.nextSyncToken,
      last_sync_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return result;
}
```

### Sync with Date Range

```typescript
async function syncLastMonth(teamId: string, userId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const result = await provider.syncEmails({
    teamId,
    userId,
    provider: "gmail",
    credentials: connection.credentials,
    startDate: lastMonth,
    endDate: now,
    maxResults: 500,
    syncAttachments: true,
  });

  return result;
}
```

### Store Synced Emails in Database

```typescript
import { createClient } from "@midday/supabase/server";

async function syncAndStore(teamId: string, userId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  const result = await provider.syncEmails({
    teamId,
    userId,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults: 100,
  });

  if (result.success && result.emails) {
    const supabase = await createClient();

    // Map and insert emails into synced_emails table
    const emailsToInsert = result.emails.map(email => ({
      connection_id: connection.id,
      message_id: email.id!,
      thread_id: email.threadId,
      subject: email.subject,
      from_email: typeof email.from === 'string' ? email.from : email.from.email,
      to_emails: Array.isArray(email.to)
        ? email.to.map(t => typeof t === 'string' ? t : t.email)
        : [typeof email.to === 'string' ? email.to : email.to.email],
      received_at: email.receivedAt,
      has_attachments: email.hasAttachments || false,
      body_preview: email.bodyPreview,
      labels: email.labels || [],
      folder: email.folder,
      is_read: email.isRead || false,
    }));

    const { error } = await supabase
      .from("synced_emails")
      .insert(emailsToInsert)
      .onConflictDoNothing();

    if (error) {
      console.error("Error storing emails:", error);
    }
  }

  return result;
}
```

---

## Searching Emails

### Search by Query

```typescript
import { emailSearchOptionsSchema } from "@midday/email-providers";

async function searchInvoiceEmails(teamId: string) {
  const provider = await initializeGmailProvider(teamId);

  const options = emailSearchOptionsSchema.parse({
    query: "invoice OR receipt",
    from: "billing@",
    hasAttachments: true,
    isUnread: false,
    maxResults: 50,
  });

  const emails = await provider.searchEmails(options);

  return emails;
}
```

### Search by Date Range

```typescript
async function searchLastWeek(teamId: string) {
  const provider = await initializeGmailProvider(teamId);

  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const emails = await provider.searchEmails({
    startDate: lastWeek,
    endDate: now,
    isUnread: true,
    maxResults: 100,
  });

  return emails;
}
```

### Search Specific Folders

```typescript
async function searchInbox(teamId: string) {
  const provider = await initializeGmailProvider(teamId);

  const emails = await provider.searchEmails({
    folders: ["INBOX"],
    isUnread: true,
    maxResults: 50,
  });

  return emails;
}
```

### Search with Pagination

```typescript
async function paginatedSearch(teamId: string, pageToken?: string) {
  const provider = await initializeGmailProvider(teamId);

  const result = await provider.searchEmails({
    query: "important",
    maxResults: 25,
    pageToken, // Pass this from previous results
  });

  return {
    emails: result.emails,
    nextPageToken: result.nextPageToken,
  };
}
```

---

## Sending Emails

### Send Simple Email

```typescript
async function sendSimpleEmail(teamId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  await provider.sendEmail({
    from: connection.email_address!,
    to: "recipient@example.com",
    subject: "Hello from tocld",
    html: "<h1>Hello!</h1><p>This is a test email.</p>",
  });
}
```

### Send Email with Attachments

```typescript
async function sendInvoiceEmail(teamId: string, invoicePath: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  await provider.sendEmail({
    from: connection.email_address!,
    to: ["customer@example.com"],
    cc: ["accounting@tocld.com"],
    subject: "Your Invoice #12345",
    html: `
      <h1>Invoice Attached</h1>
      <p>Please find your invoice attached.</p>
    `,
    attachments: [{
      filename: "invoice-12345.pdf",
      path: invoicePath,
      contentType: "application/pdf",
    }],
  });
}
```

### Send Reply Email

```typescript
async function sendReply(teamId: string, originalMessageId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  // Get original email
  const originalEmail = await provider.getEmail(originalMessageId);

  await provider.sendEmail({
    from: connection.email_address!,
    to: originalEmail.from,
    subject: `Re: ${originalEmail.subject}`,
    html: "<p>Thank you for your email!</p>",
    inReplyTo: originalEmail.id,
    references: originalEmail.id,
  });
}
```

---

## Managing Folders

### Get All Folders

```typescript
import { emailFolderSchema } from "@midday/email-providers";

async function getAllFolders(teamId: string) {
  const provider = await initializeGmailProvider(teamId);

  const folders = await provider.getFolders();

  // Validate with Zod
  const validated = folders.map(f => emailFolderSchema.parse(f));

  return validated;
}
```

### Get Inbox Stats

```typescript
async function getInboxStats(teamId: string) {
  const provider = await initializeGmailProvider(teamId);

  const folders = await provider.getFolders();
  const inbox = folders.find(f => f.type === "inbox");

  return {
    totalMessages: inbox?.messageCount || 0,
    unreadMessages: inbox?.unreadCount || 0,
  };
}
```

---

## Webhooks

### Setup Gmail Push Notifications

```typescript
async function setupGmailWebhook(teamId: string, userId: string) {
  const provider = await initializeGmailProvider(teamId);
  const connection = await getEmailConnection(teamId, "gmail");

  const result = await provider.watchEmails({
    provider: "gmail",
    teamId,
    userId,
    credentials: connection.credentials,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gmail`,
    labelIds: ["INBOX"], // Watch inbox only
  });

  // Save watch details
  const supabase = await createClient();
  await supabase
    .from("oauth_connections")
    .update({
      metadata: {
        ...connection.metadata,
        watch: {
          historyId: result.historyId,
          expiration: result.expiration,
        },
      },
    })
    .eq("id", connection.id);

  return result;
}
```

### Handle Webhook Notification

```typescript
// In /app/api/webhooks/gmail/route.ts
import { GmailProvider } from "@midday/email-providers";

export async function POST(request: Request) {
  const body = await request.json();

  // Gmail sends a historyId in the notification
  const { historyId, emailAddress } = body.message.data;

  // Find connection by email
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("email_address", emailAddress)
    .eq("provider", "gmail")
    .single();

  if (!connection) {
    return new Response("No connection found", { status: 404 });
  }

  // Initialize provider and fetch new emails
  const provider = new GmailProvider(connection.credentials);

  const result = await provider.syncEmails({
    teamId: connection.team_id,
    userId: connection.user_id,
    provider: "gmail",
    credentials: connection.credentials,
    syncToken: connection.sync_token,
    maxResults: 50,
  });

  // Process new emails...

  return new Response("OK", { status: 200 });
}
```

---

## Background Jobs (Trigger.dev)

### Create Email Sync Job

```typescript
// In packages/jobs/src/tasks/email/sync-emails.ts
import { task } from "@trigger.dev/sdk/v3";
import { GmailProvider, OutlookProvider } from "@midday/email-providers";
import { connectDb } from "@midday/db/client";

export const syncEmailsJob = task({
  id: "sync-emails",
  maxDuration: 600, // 10 minutes
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    connectionId: string;
    teamId: string;
    userId: string;
  }) => {
    const { connectionId, teamId, userId } = payload;

    // Get connection
    const supabase = await createClient();
    const { data: connection } = await supabase
      .from("oauth_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (!connection) {
      throw new Error("Connection not found");
    }

    // Initialize provider
    const provider =
      connection.provider === "gmail"
        ? new GmailProvider(connection.credentials)
        : new OutlookProvider(connection.credentials);

    // Perform sync
    const result = await provider.syncEmails({
      teamId,
      userId,
      provider: connection.provider,
      credentials: connection.credentials,
      maxResults: 100,
      syncToken: connection.sync_token,
    });

    // Update sync token
    await supabase
      .from("oauth_connections")
      .update({
        sync_token: result.nextSyncToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    return {
      success: result.success,
      syncedCount: result.synced.messages,
      errors: result.errors,
    };
  },
});
```

### Trigger Sync Job

```typescript
import { tasks } from "@trigger.dev/sdk/v3";

async function triggerEmailSync(connectionId: string, teamId: string, userId: string) {
  const handle = await tasks.trigger("sync-emails", {
    connectionId,
    teamId,
    userId,
  });

  console.log("Job triggered:", handle.id);

  return handle;
}
```

---

## tRPC Integration

### Query Synced Emails

```typescript
// In your React component
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function EmailList() {
  const trpc = useTRPC();

  const { data: connections } = useQuery(
    trpc.emails.connections.queryOptions()
  );

  const { data: emails } = useQuery(
    trpc.emails.search.queryOptions({
      connectionId: connections?.[0]?.id,
      query: "invoice",
      hasAttachments: true,
      maxResults: 50,
    })
  );

  return (
    <div>
      {emails?.map(email => (
        <div key={email.id}>
          <h3>{email.subject}</h3>
          <p>From: {email.fromEmail}</p>
        </div>
      ))}
    </div>
  );
}
```

### Trigger Manual Sync

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function SyncButton({ connectionId }: { connectionId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const syncMutation = useMutation(
    trpc.emails.sync.mutationOptions({
      onSuccess: (data) => {
        console.log(`Synced ${data.emailsCount} emails`);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return key[0] === 'trpc' && key[1]?.toString().startsWith('emails.');
          },
        });
      },
    })
  );

  return (
    <button
      onClick={() =>
        syncMutation.mutate({
          connectionId,
          maxResults: 100,
        })
      }
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? "Syncing..." : "Sync Emails"}
    </button>
  );
}
```

---

## Complete Example: Full Email Workflow

```typescript
import { GmailProvider } from "@midday/email-providers";
import { createClient } from "@midday/supabase/server";

async function completeEmailWorkflow(teamId: string, userId: string) {
  // 1. Get connection
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("team_id", teamId)
    .eq("provider", "gmail")
    .single();

  if (!connection) {
    throw new Error("No Gmail connection found");
  }

  // 2. Initialize provider
  const provider = new GmailProvider({
    accessToken: connection.credentials.accessToken,
    refreshToken: connection.credentials.refreshToken,
    expiryDate: connection.credentials.expiryDate,
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  });

  // 3. Sync emails
  const syncResult = await provider.syncEmails({
    teamId,
    userId,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults: 100,
    syncAttachments: true,
  });

  console.log(`Synced ${syncResult.synced.messages} emails`);

  // 4. Search for invoices
  const invoices = await provider.searchEmails({
    query: "invoice",
    hasAttachments: true,
    maxResults: 50,
  });

  console.log(`Found ${invoices.length} invoice emails`);

  // 5. Send confirmation email
  await provider.sendEmail({
    from: connection.email_address!,
    to: "admin@tocld.com",
    subject: "Email Sync Complete",
    html: `
      <h1>Sync Complete</h1>
      <p>Synced ${syncResult.synced.messages} emails</p>
      <p>Found ${invoices.length} invoices</p>
    `,
  });

  // 6. Setup webhook for real-time updates
  await provider.watchEmails({
    provider: "gmail",
    teamId,
    userId,
    credentials: connection.credentials,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gmail`,
    labelIds: ["INBOX"],
  });

  return {
    synced: syncResult.synced.messages,
    invoicesFound: invoices.length,
  };
}
```
