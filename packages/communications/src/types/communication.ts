import { z } from "zod";

// Base communication types
export type CommunicationChannel = "email" | "sms" | "whatsapp" | "push" | "webhook";
export type CommunicationStatus = "pending" | "queued" | "sending" | "sent" | "failed" | "bounced" | "delivered" | "read";
export type Priority = "low" | "normal" | "high" | "urgent";

// Provider types
export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "ses" | "postmark";
export type SmsProvider = "twilio" | "vonage" | "messagebird" | "sns";
export type WhatsAppProvider = "twilio" | "meta" | "messagebird";

// Base message interface
export interface BaseMessage {
  id?: string;
  channel: CommunicationChannel;
  recipient: string | string[];
  subject?: string;
  priority?: Priority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
  tags?: string[];
  trackingEnabled?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// Email specific
export interface EmailMessage extends BaseMessage {
  channel: "email";
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
  templateId?: string;
  templateData?: Record<string, any>;
  provider?: EmailProvider;
}

// SMS specific
export interface SmsMessage extends BaseMessage {
  channel: "sms";
  from?: string;
  body: string;
  mediaUrls?: string[];
  provider?: SmsProvider;
}

// WhatsApp specific
export interface WhatsAppMessage extends BaseMessage {
  channel: "whatsapp";
  from?: string;
  body?: string;
  templateName?: string;
  templateLanguage?: string;
  templateData?: Record<string, any>;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "document";
  buttons?: WhatsAppButton[];
  provider?: WhatsAppProvider;
}

// Push notification specific
export interface PushMessage extends BaseMessage {
  channel: "push";
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  clickAction?: string;
}

// Webhook specific
export interface WebhookMessage extends BaseMessage {
  channel: "webhook";
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  secret?: string;
  signatureHeader?: string;
  timeout?: number;
}

export type Message = EmailMessage | SmsMessage | WhatsAppMessage | PushMessage | WebhookMessage;

// Attachment interface
export interface Attachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string; // Content ID for inline attachments
}

// WhatsApp button
export interface WhatsAppButton {
  type: "reply" | "url" | "call";
  text: string;
  payload?: string;
  url?: string;
  phoneNumber?: string;
}

// Send result
export interface SendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: Error;
  details?: any;
  timestamp?: Date;
}

// Batch send result
export interface BatchSendResult {
  successful: SendResult[];
  failed: SendResult[];
  total: number;
  successCount: number;
  failureCount: number;
}

// Template interface
export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  variables?: TemplateVariable[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array" | "object";
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

// Notification preferences
export interface NotificationPreferences {
  userId: string;
  channels: {
    email?: ChannelPreference;
    sms?: ChannelPreference;
    whatsapp?: ChannelPreference;
    push?: ChannelPreference;
  };
  categories?: Record<string, CategoryPreference>;
  timezone?: string;
  language?: string;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface ChannelPreference {
  enabled: boolean;
  address?: string;
  verified?: boolean;
  frequency?: "immediate" | "hourly" | "daily" | "weekly";
}

export interface CategoryPreference {
  enabled: boolean;
  channels: CommunicationChannel[];
  frequency?: "immediate" | "hourly" | "daily" | "weekly";
}

// Queue job data
export interface QueueJobData {
  message: Message;
  attempts?: number;
  delay?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

// Webhook payload
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: Date;
  data: any;
  signature?: string;
}

export type WebhookEvent = 
  | "message.sent"
  | "message.delivered"
  | "message.failed"
  | "message.bounced"
  | "message.clicked"
  | "message.opened"
  | "message.unsubscribed"
  | "message.complained";

// Provider configuration
export interface ProviderConfig {
  provider: EmailProvider | SmsProvider | WhatsAppProvider;
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string;
  authToken?: string;
  from?: string;
  fromName?: string;
  region?: string;
  endpoint?: string;
  sandbox?: boolean;
}

// Schemas for validation
export const emailMessageSchema = z.object({
  channel: z.literal("email"),
  recipient: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.union([z.string(), z.instanceof(Buffer)]).optional(),
    path: z.string().optional(),
    contentType: z.string().optional(),
  })).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const smsMessageSchema = z.object({
  channel: z.literal("sms"),
  recipient: z.union([z.string(), z.array(z.string())]),
  from: z.string().optional(),
  body: z.string().max(1600), // SMS character limit
  mediaUrls: z.array(z.string().url()).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const whatsappMessageSchema = z.object({
  channel: z.literal("whatsapp"),
  recipient: z.union([z.string(), z.array(z.string())]),
  from: z.string().optional(),
  body: z.string().optional(),
  templateName: z.string().optional(),
  templateLanguage: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video", "audio", "document"]).optional(),
  buttons: z.array(z.object({
    type: z.enum(["reply", "url", "call"]),
    text: z.string(),
    payload: z.string().optional(),
    url: z.string().url().optional(),
    phoneNumber: z.string().optional(),
  })).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const webhookMessageSchema = z.object({
  channel: z.literal("webhook"),
  recipient: z.string().url(), // URL as recipient
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  secret: z.string().optional(),
  signatureHeader: z.string().optional(),
  timeout: z.number().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  retryCount: z.number().optional(),
  maxRetries: z.number().optional(),
});