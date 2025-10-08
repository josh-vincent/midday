# Email Integration for Next.js (Client & Server)

Complete guide for integrating Gmail/Outlook email syncing in Next.js with server actions and client components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server-Side Usage (Server Actions)](#server-side-usage-server-actions)
3. [Client-Side Usage (React Components)](#client-side-usage-react-components)
4. [Complete Example](#complete-example)
5. [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌─────────────────────┐  │
│  │  Client Component│         │  Server Action      │  │
│  │  (Browser)       │────────▶│  (Server)           │  │
│  │                  │         │                     │  │
│  │  - Button clicks │         │  - Sync emails      │  │
│  │  - Display data  │         │  - Fetch from DB    │  │
│  │  - User input    │         │  - Call providers   │  │
│  └──────────────────┘         └─────────────────────┘  │
│         │                               │               │
│         │                               ▼               │
│         │                     ┌─────────────────────┐  │
│         │                     │  Email Providers    │  │
│         │                     │  - GmailProvider    │  │
│         │                     │  - OutlookProvider  │  │
│         │                     └─────────────────────┘  │
│         │                               │               │
│         │                               ▼               │
│         │                     ┌─────────────────────┐  │
│         │                     │  Database           │  │
│         └────────────────────▶│  - oauth_connections│  │
│                               │  - synced_emails    │  │
│                               └─────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Server Actions** = Backend logic (syncing, database access)
2. **Client Components** = UI and user interactions
3. **Email Providers** = Only run on server (have secrets)
4. **Database** = Single source of truth

---

## Server-Side Usage (Server Actions)

Server actions run on the server and can access secrets, databases, and email providers.

### File Location
```
src/actions/email/sync-emails-action.ts
```

### Basic Server Action

```typescript
"use server";

import { createClient } from "@midday/supabase/server";
import { GmailProvider } from "@midday/email-providers";
import { revalidatePath } from "next/cache";

export async function syncEmailsAction(params: {
  connectionId: string;
  maxResults?: number;
}) {
  const { connectionId, maxResults = 10 } = params;

  // 1. Get authenticated user (server-side only)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 2. Get OAuth connection from database
  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    throw new Error("Connection not found");
  }

  // 3. Initialize provider (server-side only - has secrets!)
  const provider = new GmailProvider({
    accessToken: connection.credentials.accessToken,
    refreshToken: connection.credentials.refreshToken,
    expiryDate: connection.credentials.expiryDate,
    clientId: process.env.GMAIL_CLIENT_ID!,      // Secret!
    clientSecret: process.env.GMAIL_CLIENT_SECRET!, // Secret!
  });

  // 4. Sync emails from Gmail
  const result = await provider.syncEmails({
    teamId: connection.team_id,
    userId: user.id,
    provider: "gmail",
    credentials: connection.credentials,
    maxResults,
  });

  // 5. Store in database
  if (result.success && result.emails) {
    await supabase.from("synced_emails").upsert(
      result.emails.map(email => ({
        connection_id: connection.id,
        message_id: email.id!,
        subject: email.subject,
        from_email: typeof email.from === 'string' ? email.from : email.from.email,
        // ... more fields
      })),
      { onConflict: "connection_id,message_id" }
    );
  }

  // 6. Revalidate cache (refresh UI)
  revalidatePath("/inbox");

  return result;
}
```

### Why Server Actions?

✅ **Secure**: Secrets (API keys) never sent to client
✅ **Fast**: Direct database access, no API routes needed
✅ **Simple**: Called like regular functions from client
✅ **Type-safe**: Full TypeScript support

### Multiple Server Actions Pattern

```typescript
// src/actions/email/sync-emails-action.ts
"use server";

// Action 1: Sync emails
export async function syncEmailsAction(params) { ... }

// Action 2: Get email connections
export async function getEmailConnectionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("oauth_connections")
    .select("id, provider, email_address, last_sync_at")
    .eq("user_id", user.id)
    .in("provider", ["gmail", "outlook"]);

  return data;
}

// Action 3: Get synced emails
export async function getSyncedEmailsAction(params?: {
  connectionId?: string;
  limit?: number;
}) {
  const { connectionId, limit = 10 } = params || {};

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("synced_emails")
    .select("*, connection:oauth_connections!inner(provider, email_address)")
    .eq("oauth_connections.user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data } = await query;
  return data;
}
```

---

## Client-Side Usage (React Components)

Client components display data and handle user interactions. They call server actions.

### File Location
```
src/components/inbox/synced-emails-list.tsx
```

### Basic Client Component

```typescript
"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import {
  syncEmailsAction,
  getEmailConnectionsAction,
  getSyncedEmailsAction,
} from "@/actions/email/sync-emails-action";

export function SyncedEmailsList() {
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch connections using React Query
  const { data: connections } = useQuery({
    queryKey: ["email-connections"],
    queryFn: getEmailConnectionsAction, // Server action!
  });

  // 2. Fetch emails using React Query
  const { data: emails, isLoading } = useQuery({
    queryKey: ["synced-emails", selectedConnection],
    queryFn: () => getSyncedEmailsAction({
      connectionId: selectedConnection || undefined,
      limit: 10,
    }),
  });

  // 3. Handle sync button click
  const handleSync = () => {
    startTransition(async () => {
      try {
        const result = await syncEmailsAction({
          connectionId: selectedConnection,
          maxResults: 10,
        });

        if (result.success) {
          toast({
            title: "Sync Complete",
            description: `Synced ${result.synced.messages} emails`,
          });

          // Refresh data
          queryClient.invalidateQueries({ queryKey: ["synced-emails"] });
        }
      } catch (error) {
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // 4. Render UI
  return (
    <div>
      <select value={selectedConnection} onChange={(e) => setSelectedConnection(e.target.value)}>
        {connections?.map(conn => (
          <option key={conn.id} value={conn.id}>
            {conn.email_address}
          </option>
        ))}
      </select>

      <Button onClick={handleSync} disabled={isPending}>
        {isPending ? "Syncing..." : "Sync Emails"}
      </Button>

      {isLoading ? (
        <Icons.Spinner className="animate-spin" />
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

### Key Client-Side Patterns

#### 1. useTransition for Mutations

```typescript
const [isPending, startTransition] = useTransition();

const handleAction = () => {
  startTransition(async () => {
    await serverAction();
  });
};
```

**Why**: Shows pending state automatically, prevents blocking UI

#### 2. React Query for Data Fetching

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["unique-key"],
  queryFn: serverActionFunction,
});
```

**Why**: Automatic caching, refetching, loading states

#### 3. Query Invalidation

```typescript
const queryClient = useQueryClient();

await serverAction();
queryClient.invalidateQueries({ queryKey: ["data-key"] });
```

**Why**: Refreshes data after mutations

---

## Complete Example

### Step 1: Create Server Actions

```typescript
// src/actions/email/sync-emails-action.ts
"use server";

import { createClient } from "@midday/supabase/server";
import { GmailProvider, OutlookProvider } from "@midday/email-providers";
import { revalidatePath } from "next/cache";

export async function syncEmailsAction(params: {
  connectionId: string;
  maxResults?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: connection } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("id", params.connectionId)
    .eq("user_id", user.id)
    .single();

  if (!connection) throw new Error("Connection not found");

  const provider = connection.provider === "gmail"
    ? new GmailProvider({
        accessToken: connection.credentials.accessToken,
        refreshToken: connection.credentials.refreshToken,
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      })
    : new OutlookProvider({
        accessToken: connection.credentials.accessToken,
        refreshToken: connection.credentials.refreshToken,
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
      });

  const result = await provider.syncEmails({
    teamId: connection.team_id,
    userId: user.id,
    provider: connection.provider,
    credentials: connection.credentials,
    maxResults: params.maxResults || 10,
  });

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
        labels: email.labels || [],
        folder: email.folder,
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
    .select("id, provider, email_address, last_sync_at")
    .eq("user_id", user.id)
    .in("provider", ["gmail", "outlook"]);

  return data;
}

export async function getSyncedEmailsAction(params?: {
  connectionId?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("synced_emails")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(params?.limit || 10);

  if (params?.connectionId) {
    query = query.eq("connection_id", params.connectionId);
  }

  const { data } = await query;
  return data;
}
```

### Step 2: Create Client Component

```typescript
// src/components/inbox/synced-emails-list.tsx
"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import {
  syncEmailsAction,
  getEmailConnectionsAction,
  getSyncedEmailsAction,
} from "@/actions/email/sync-emails-action";
import { formatDistanceToNow } from "date-fns";

export function SyncedEmailsList() {
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections } = useQuery({
    queryKey: ["email-connections"],
    queryFn: getEmailConnectionsAction,
  });

  const { data: emails, isLoading } = useQuery({
    queryKey: ["synced-emails", selectedConnection],
    queryFn: () => getSyncedEmailsAction({
      connectionId: selectedConnection || undefined,
      limit: 10,
    }),
  });

  const handleSync = () => {
    if (!selectedConnection) {
      toast({ title: "Please select an account", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        const result = await syncEmailsAction({
          connectionId: selectedConnection,
          maxResults: 10,
        });

        toast({
          title: "Sync Complete",
          description: `Synced ${result.synced.messages} emails`,
        });

        queryClient.invalidateQueries({ queryKey: ["synced-emails"] });
      } catch (error) {
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Synced Emails</CardTitle>
          <div className="flex gap-2">
            <select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select account...</option>
              {connections?.map(conn => (
                <option key={conn.id} value={conn.id}>
                  {conn.email_address}
                </option>
              ))}
            </select>
            <Button onClick={handleSync} disabled={isPending}>
              {isPending ? <Icons.Spinner className="animate-spin" /> : "Sync"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Icons.Spinner className="animate-spin" />
        ) : (
          <div className="space-y-3">
            {emails?.map(email => (
              <div key={email.id} className="border rounded p-4">
                <h4 className="font-medium">{email.subject || "(No Subject)"}</h4>
                <p className="text-sm text-muted-foreground">
                  From: {email.from_email}
                </p>
                {email.received_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 3: Add to Page

```typescript
// src/app/[locale]/(app)/(sidebar)/inbox/page.tsx
import { SyncedEmailsList } from "@/components/inbox/synced-emails-list";

export default async function InboxPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Inbox</h1>
      <SyncedEmailsList />
    </div>
  );
}
```

---

## Best Practices

### ✅ DO

1. **Use Server Actions for business logic**
   ```typescript
   "use server";
   export async function syncEmailsAction() { ... }
   ```

2. **Keep secrets on server**
   ```typescript
   // ✅ Good - server only
   clientSecret: process.env.GMAIL_CLIENT_SECRET
   ```

3. **Use React Query for data fetching**
   ```typescript
   const { data } = useQuery({ queryKey: ["emails"], queryFn: getEmails });
   ```

4. **Invalidate queries after mutations**
   ```typescript
   await syncEmailsAction();
   queryClient.invalidateQueries({ queryKey: ["emails"] });
   ```

5. **Use useTransition for loading states**
   ```typescript
   const [isPending, startTransition] = useTransition();
   ```

### ❌ DON'T

1. **Don't call providers from client**
   ```typescript
   // ❌ Bad - exposes secrets
   const provider = new GmailProvider({ clientSecret: "..." });
   ```

2. **Don't store secrets in client state**
   ```typescript
   // ❌ Bad - secrets in browser
   const [apiKey, setApiKey] = useState(process.env.API_KEY);
   ```

3. **Don't forget error handling**
   ```typescript
   // ❌ Bad - no error handling
   await syncEmailsAction();
   ```

4. **Don't use API routes unnecessarily**
   ```typescript
   // ❌ Bad - extra layer
   fetch("/api/sync-emails")

   // ✅ Good - direct server action
   syncEmailsAction()
   ```

---

## Summary

| Feature | Server Actions | Client Components |
|---------|---------------|-------------------|
| **Location** | `src/actions/` | `src/components/` |
| **Directive** | `"use server"` | `"use client"` |
| **Purpose** | Business logic | UI & interactions |
| **Can access** | DB, secrets, providers | Browser APIs, state |
| **Called from** | Client components | User interactions |
| **Returns** | Data, errors | JSX/UI |

**Flow**: User clicks button → Client component → Server action → Provider → Database → Revalidate → UI updates
