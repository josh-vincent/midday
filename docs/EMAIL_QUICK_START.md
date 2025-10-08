# Email Integration - Quick Start Guide

Get started with Gmail/Outlook email syncing in 5 minutes.

## 1. Connect Email Account (One-time Setup)

**User Action**: Go to Settings → Integrations → Click "Connect" on Gmail or Outlook

**What happens**:
- OAuth flow authenticates the user
- Access/refresh tokens stored in `oauth_connections` table
- Connection is now available for syncing

## 2. Create Server Action

**File**: `src/actions/email/sync-emails-action.ts`

```typescript
"use server";

import { createClient } from "@midday/supabase/server";
import { GmailProvider } from "@midday/email-providers";
import { revalidatePath } from "next/cache";

export async function syncEmailsAction(params: {
  connectionId: string;
  maxResults?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Get connection
  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("id", params.connectionId)
    .eq("user_id", user.id)
    .single();

  if (!connection) throw new Error("Connection not found");

  // Initialize provider
  const provider = new GmailProvider({
    accessToken: connection.credentials.accessToken,
    refreshToken: connection.credentials.refreshToken,
    clientId: process.env.GMAIL_CLIENT_ID!,
    clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  });

  // Sync emails
  const result = await provider.syncEmails({
    teamId: connection.team_id,
    userId: user.id,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults: params.maxResults || 10,
  });

  // Store in database
  if (result.success && result.emails) {
    await supabase.from("synced_emails").upsert(
      result.emails.map(email => ({
        connection_id: connection.id,
        message_id: email.id!,
        subject: email.subject,
        from_email: typeof email.from === 'string' ? email.from : email.from.email,
        to_emails: Array.isArray(email.to)
          ? email.to.map(t => typeof t === 'string' ? t : t.email)
          : [typeof email.to === 'string' ? email.to : email.to.email],
        received_at: email.receivedAt,
        has_attachments: email.hasAttachments || false,
        body_preview: email.bodyPreview,
        is_read: email.isRead || false,
      })),
      { onConflict: "connection_id,message_id" }
    );
  }

  revalidatePath("/inbox");
  return result;
}

export async function getEmailConnectionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("oauth_connections")
    .select("id, provider, email_address")
    .eq("user_id", user.id)
    .in("provider", ["gmail", "outlook"]);

  return data;
}

export async function getSyncedEmailsAction(params?: {
  limit?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("synced_emails")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(params?.limit || 10);

  return data;
}
```

## 3. Create Client Component

**File**: `src/components/inbox/email-sync.tsx`

```typescript
"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import {
  syncEmailsAction,
  getEmailConnectionsAction,
  getSyncedEmailsAction,
} from "@/actions/email/sync-emails-action";

export function EmailSync() {
  const [connectionId, setConnectionId] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connections
  const { data: connections } = useQuery({
    queryKey: ["email-connections"],
    queryFn: getEmailConnectionsAction,
  });

  // Fetch emails
  const { data: emails, isLoading } = useQuery({
    queryKey: ["synced-emails"],
    queryFn: getSyncedEmailsAction,
  });

  // Sync handler
  const handleSync = () => {
    startTransition(async () => {
      try {
        const result = await syncEmailsAction({
          connectionId,
          maxResults: 10,
        });

        toast({
          title: "Success",
          description: `Synced ${result.synced.messages} emails`,
        });

        queryClient.invalidateQueries({ queryKey: ["synced-emails"] });
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div>
      <select value={connectionId} onChange={(e) => setConnectionId(e.target.value)}>
        <option value="">Select account...</option>
        {connections?.map(c => (
          <option key={c.id} value={c.id}>{c.email_address}</option>
        ))}
      </select>

      <Button onClick={handleSync} disabled={isPending || !connectionId}>
        {isPending ? "Syncing..." : "Sync Emails"}
      </Button>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {emails?.map(email => (
            <div key={email.id}>
              <h3>{email.subject}</h3>
              <p>From: {email.from_email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 4. Add to Page

**File**: `src/app/[locale]/(app)/(sidebar)/inbox/page.tsx`

```typescript
import { EmailSync } from "@/components/inbox/email-sync";

export default async function InboxPage() {
  return (
    <div>
      <h1>Inbox</h1>
      <EmailSync />
    </div>
  );
}
```

## 5. Environment Variables

Add to `.env.local`:

```bash
# Gmail
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret

# Outlook
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_TENANT_ID=common
```

## Common Patterns

### Pattern 1: Auto-sync on mount

```typescript
useEffect(() => {
  if (connectionId) {
    queryClient.invalidateQueries({ queryKey: ["synced-emails"] });
  }
}, [connectionId]);
```

### Pattern 2: Periodic syncing

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    syncEmailsAction({ connectionId, maxResults: 10 });
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(interval);
}, [connectionId]);
```

### Pattern 3: Search emails

```typescript
const { data: emails } = useQuery({
  queryKey: ["synced-emails", searchQuery],
  queryFn: () => searchEmailsAction({ query: searchQuery }),
});
```

### Pattern 4: Send email

```typescript
const sendEmail = async () => {
  await sendEmailAction({
    connectionId,
    to: "user@example.com",
    subject: "Hello",
    html: "<p>Hi there!</p>",
  });
};
```

## Troubleshooting

### No emails showing?

1. Check connection exists:
   ```sql
   SELECT * FROM oauth_connections WHERE provider IN ('gmail', 'outlook');
   ```

2. Check emails table:
   ```sql
   SELECT COUNT(*) FROM synced_emails;
   ```

3. Check server logs for errors

### Token expired?

Tokens auto-refresh. If issues persist:
1. Disconnect in Settings → Integrations
2. Reconnect the account

### Sync not working?

1. Verify environment variables are set
2. Check network tab for errors
3. Verify OAuth connection has valid tokens

## Next Steps

- **Full Documentation**: See `/docs/EMAIL_INTEGRATION_NEXTJS.md`
- **Examples**: See `/packages/email-providers/EXAMPLES.md`
- **API Reference**: See `/packages/email-providers/README.md`
- **Live Demo**: http://localhost:3336/inbox/emails

## Quick Reference

| Task | Server Action | Client Component |
|------|--------------|------------------|
| Sync emails | `syncEmailsAction()` | `handleSync()` + `useTransition` |
| Get connections | `getEmailConnectionsAction()` | `useQuery()` |
| Get emails | `getSyncedEmailsAction()` | `useQuery()` |
| Refresh data | `revalidatePath()` | `queryClient.invalidateQueries()` |

**Remember**:
- Server actions = backend (secrets, database, providers)
- Client components = frontend (UI, interactions, display)
- React Query = data fetching and caching
