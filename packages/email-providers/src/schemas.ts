import { z } from "zod";

/**
 * Zod Schemas for Email Provider Results
 * Use these to validate API responses and ensure type safety
 */

// Email Address Schema
export const emailAddressSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

// Email Attachment Schema
export const emailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]).optional(),
  path: z.string().optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  encoding: z.string().optional(),
  size: z.number().optional(),
});

// Email Message Schema
export const emailMessageSchema = z.object({
  id: z.string().optional(),
  from: z.union([z.string(), emailAddressSchema]),
  to: z.union([
    z.string(),
    z.array(z.string()),
    emailAddressSchema,
    z.array(emailAddressSchema),
  ]),
  cc: z
    .union([
      z.string(),
      z.array(z.string()),
      emailAddressSchema,
      z.array(emailAddressSchema),
    ])
    .optional(),
  bcc: z
    .union([
      z.string(),
      z.array(z.string()),
      emailAddressSchema,
      z.array(emailAddressSchema),
    ])
    .optional(),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(emailAttachmentSchema).optional(),
  headers: z.record(z.string()).optional(),
  inReplyTo: z.string().optional(),
  references: z.union([z.string(), z.array(z.string())]).optional(),
  priority: z.enum(["high", "normal", "low"]).optional(),
  metadata: z.record(z.any()).optional(),
  // Additional fields returned by providers
  threadId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  folder: z.string().optional(),
  isRead: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),
  receivedAt: z.union([z.date(), z.string().datetime()]).optional(),
  bodyPreview: z.string().optional(),
});

// Email Sync Options Schema
export const emailSyncOptionsSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(["gmail", "outlook"]),
  credentials: z.any(),
  folders: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  maxResults: z.number().min(1).max(500).optional(),
  syncAttachments: z.boolean().optional(),
  syncDrafts: z.boolean().optional(),
  syncSent: z.boolean().optional(),
  syncTrash: z.boolean().optional(),
  syncToken: z.string().optional(),
});

// Email Sync Result Schema
export const emailSyncResultSchema = z.object({
  success: z.boolean(),
  synced: z.object({
    messages: z.number(),
    attachments: z.number(),
    folders: z.number(),
  }),
  errors: z.array(
    z.object({
      messageId: z.string().optional(),
      error: z.string(),
    })
  ),
  nextSyncToken: z.string().optional(),
  emails: z.array(emailMessageSchema).optional(),
});


// Email Folder Schema
export const emailFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["inbox", "sent", "drafts", "trash", "spam", "custom"]).optional(),
  messageCount: z.number().optional(),
  unreadCount: z.number().optional(),
  parentId: z.string().optional(),
});


// Email Thread Schema
export const emailThreadSchema = z.object({
  id: z.string(),
  subject: z.string().optional(),
  snippet: z.string().optional(),
  messageIds: z.array(z.string()),
  participantEmails: z.array(z.string()),
  lastMessageDate: z.date(),
  unread: z.boolean(),
  important: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
});


// Email Search Options Schema
export const emailSearchOptionsSchema = z.object({
  query: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  isUnread: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  folders: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  maxResults: z.number().min(1).max(500).optional(),
  pageToken: z.string().optional(),
});


// Email Batch Operation Schema
export const emailBatchOperationSchema = z.object({
  operation: z.enum([
    "archive",
    "delete",
    "markRead",
    "markUnread",
    "addLabel",
    "removeLabel",
    "move",
  ]),
  messageIds: z.array(z.string()),
  targetFolder: z.string().optional(),
  labels: z.array(z.string()).optional(),
});


// Email Watch Options Schema
export const emailWatchOptionsSchema = z.object({
  provider: z.enum(["gmail", "outlook"]),
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  credentials: z.any(),
  topicName: z.string().optional(),
  webhookUrl: z.string().url(),
  labelIds: z.array(z.string()).optional(),
  folderIds: z.array(z.string()).optional(),
  expirationTime: z.number().optional(),
});


// Email Watch Result Schema
export const emailWatchResultSchema = z.object({
  historyId: z.string(),
  expiration: z.number(),
});

export type EmailWatchResult = z.infer<typeof emailWatchResultSchema>;

// Gmail Credentials Schema
export const gmailCredentialsSchema = z.object({
  type: z.enum(["oauth2", "service_account"]).optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  refreshToken: z.string().optional(),
  accessToken: z.string().optional(),
  expiryDate: z.number().optional(),
  serviceAccountKey: z.any().optional(),
});


// Outlook Credentials Schema
export const outlookCredentialsSchema = z.object({
  type: z.enum(["oauth2", "delegated"]).optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  refreshToken: z.string().optional(),
  accessToken: z.string().optional(),
  expiryDate: z.number().optional(),
});


// Synced Email (Database) Schema
export const syncedEmailSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  messageId: z.string(),
  threadId: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  fromEmail: z.string().optional().nullable(),
  toEmails: z.array(z.string()).default([]),
  receivedAt: z.string().optional().nullable(),
  hasAttachments: z.boolean().default(false),
  bodyPreview: z.string().optional().nullable(),
  labels: z.array(z.string()).default([]),
  folder: z.string().optional().nullable(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
});

export type SyncedEmail = z.infer<typeof syncedEmailSchema>;

/**
 * Example Usage:
 *
 * // Validate sync result
 * const result = await gmailProvider.syncEmails(options);
 * const validated = emailSyncResultSchema.parse(result);
 *
 * // Validate search options
 * const searchOptions = emailSearchOptionsSchema.parse({
 *   query: "invoice",
 *   hasAttachments: true,
 *   maxResults: 50,
 * });
 *
 * // Validate individual email
 * const email = emailMessageSchema.parse(rawEmailData);
 */
