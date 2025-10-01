import { z } from "zod";

export const emailConfigSchema = z.object({
  provider: z.enum(["gmail", "outlook", "smtp"]),
  credentials: z.record(z.any()),
  syncEnabled: z.boolean().default(false),
  webhookUrl: z.string().optional(),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export interface EmailMessage {
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

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  contentId?: string;
  encoding?: string;
  size?: number;
}

export interface EmailSyncOptions {
  teamId: string;
  userId: string;
  provider: "gmail" | "outlook";
  credentials: any;
  folders?: string[];
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  syncAttachments?: boolean;
  syncDrafts?: boolean;
  syncSent?: boolean;
  syncTrash?: boolean;
}

export interface EmailSyncResult {
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
  nextSyncToken?: string;
}

export interface EmailWebhookPayload {
  type: "message.received" | "message.sent" | "message.deleted" | "message.updated";
  provider: "gmail" | "outlook";
  teamId: string;
  userId: string;
  messageId: string;
  timestamp: Date;
  data?: any;
}

export interface GmailCredentials {
  type?: "oauth2" | "service_account";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  expiryDate?: number;
  serviceAccountKey?: any;
}

export interface OutlookCredentials {
  type?: "oauth2" | "delegated";
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  refreshToken?: string;
  accessToken?: string;
  expiryDate?: number;
}

export interface EmailFolder {
  id: string;
  name: string;
  type?: "inbox" | "sent" | "drafts" | "trash" | "spam" | "custom";
  messageCount?: number;
  unreadCount?: number;
  parentId?: string;
}

export interface EmailThread {
  id: string;
  subject?: string;
  snippet?: string;
  messageIds: string[];
  participantEmails: string[];
  lastMessageDate: Date;
  unread: boolean;
  important?: boolean;
  labels?: string[];
}

export interface EmailSearchOptions {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachments?: boolean;
  isUnread?: boolean;
  isImportant?: boolean;
  labels?: string[];
  folders?: string[];
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  pageToken?: string;
}

export interface EmailBatchOperation {
  operation: "archive" | "delete" | "markRead" | "markUnread" | "addLabel" | "removeLabel" | "move";
  messageIds: string[];
  targetFolder?: string;
  labels?: string[];
}

export interface EmailQuota {
  used: number;
  total: number;
  unit: "bytes" | "messages";
}

export interface EmailWatchOptions {
  provider: "gmail" | "outlook";
  teamId: string;
  userId: string;
  credentials: any;
  topicName?: string;
  webhookUrl: string;
  labelIds?: string[];
  folderIds?: string[];
  expirationTime?: number;
}