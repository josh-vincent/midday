"use server";

import { createClient } from "@midday/supabase/server";
import { GmailProvider, OutlookProvider } from "@midday/email-providers";
import type { EmailSyncResult } from "@midday/email-providers";
import { revalidatePath } from "next/cache";

interface SyncEmailsParams {
  connectionId: string;
  maxResults?: number;
}

/**
 * Server Action: Sync emails from Gmail/Outlook
 *
 * @example
 * ```tsx
 * import { syncEmailsAction } from "@/actions/email/sync-emails-action";
 *
 * const result = await syncEmailsAction({
 *   connectionId: "connection-uuid",
 *   maxResults: 10,
 * });
 * ```
 */
export async function syncEmailsAction(
  params: SyncEmailsParams
): Promise<EmailSyncResult> {
  const { connectionId, maxResults = 10 } = params;

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get the OAuth connection
  const { data: connection, error: connectionError } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (connectionError || !connection) {
    throw new Error("Connection not found");
  }

  // Validate provider
  if (connection.provider !== "gmail" && connection.provider !== "outlook") {
    throw new Error("Invalid email provider");
  }

  // Calculate expiry date from expires_at timestamp
  const expiryDate = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : undefined;

  console.log("[Sync Emails] Provider credentials:", {
    hasAccessToken: !!connection.credentials.accessToken,
    hasRefreshToken: !!connection.credentials.refreshToken,
    expiryDate,
    expiresAt: connection.expires_at,
  });

  // Initialize the appropriate provider
  const provider =
    connection.provider === "gmail"
      ? new GmailProvider({
          type: "oauth2",
          accessToken: connection.credentials.accessToken,
          refreshToken: connection.credentials.refreshToken,
          expiryDate,
          clientId: process.env.GMAIL_CLIENT_ID!,
          clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        })
      : new OutlookProvider({
          type: "oauth2",
          accessToken: connection.credentials.accessToken,
          refreshToken: connection.credentials.refreshToken,
          expiryDate,
          clientId: process.env.OUTLOOK_CLIENT_ID!,
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
          tenantId: process.env.OUTLOOK_TENANT_ID || "common",
        });

  // Sync emails
  console.log("[Sync Emails] Starting sync with params:", {
    provider: connection.provider,
    maxResults,
    hasSyncToken: !!connection.sync_token,
  });

  const result = await provider.syncEmails({
    teamId: connection.team_id,
    userId: user.id,
    provider: connection.provider,
    credentials: connection.credentials,
    maxResults,
    syncToken: connection.sync_token || undefined,
    syncSent: true, // Include sent emails
    syncDrafts: false, // Exclude drafts
    syncTrash: false, // Exclude trash
  });

  console.log("[Sync Emails] Sync result:", {
    success: result.success,
    emailCount: result.emails?.length || 0,
    errorCount: result.errors?.length || 0,
    hasNextToken: !!result.nextSyncToken,
  });

  // Store synced emails in database if successful
  if (result.success && result.emails && result.emails.length > 0) {
    const emailsToInsert = result.emails.map((email) => ({
      connection_id: connection.id,
      message_id: email.id!,
      thread_id: email.threadId,
      subject: email.subject,
      from_email:
        typeof email.from === "string" ? email.from : email.from.email,
      to_emails: Array.isArray(email.to)
        ? email.to.map((t) => (typeof t === "string" ? t : t.email))
        : [typeof email.to === "string" ? email.to : email.to.email],
      received_at: email.receivedAt,
      has_attachments: email.hasAttachments || false,
      body_preview: email.bodyPreview,
      labels: email.labels || [],
      folder: email.folder,
      is_read: email.isRead || false,
    }));

    // Insert emails (ignore duplicates)
    console.log("[Sync Emails] Inserting emails:", emailsToInsert.length);

    const { error: insertError } = await supabase
      .from("synced_emails")
      .upsert(emailsToInsert, {
        onConflict: "connection_id,message_id",
      });

    if (insertError) {
      console.error("[Sync Emails] Error storing emails:", insertError);
    } else {
      console.log("[Sync Emails] Successfully stored emails");
    }

    // Update sync token and last sync time
    await supabase
      .from("oauth_connections")
      .update({
        sync_token: result.nextSyncToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
  }

  // Revalidate the inbox page
  revalidatePath("/inbox");

  return result;
}

/**
 * Server Action: Get all email connections for the current user
 */
export async function getEmailConnectionsAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: connections, error } = await supabase
    .from("oauth_connections")
    .select("id, provider, email_address, last_sync_at, sync_enabled")
    .eq("user_id", user.id)
    .in("provider", ["gmail", "outlook"]);

  if (error) {
    throw new Error(error.message);
  }

  return connections;
}

/**
 * Server Action: Get synced emails from database
 */
export async function getSyncedEmailsAction(params?: {
  connectionId?: string;
  limit?: number;
  isUnread?: boolean;
}) {
  const { connectionId, limit = 10, isUnread } = params || {};

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let query = supabase
    .from("synced_emails")
    .select(
      `
      *,
      connection:oauth_connections!inner(
        id,
        provider,
        email_address
      )
    `
    )
    .eq("oauth_connections.user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  if (isUnread !== undefined) {
    query = query.eq("is_read", !isUnread);
  }

  const { data: emails, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return emails;
}
