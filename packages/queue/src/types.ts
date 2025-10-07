import { z } from "zod";
import type { Job, JobsOptions, Queue, Worker, QueueEvents } from "bullmq";

// Job Types
export type JobType =
  | "webhook.process"
  | "webhook.retry"
  | "email.send"
  | "email.sync"
  | "stripe.sync"
  | "stripe.webhook"
  | "invoice.generate"
  | "subscription.renew"
  | "subscription.cancel"
  | "payment.process"
  | "data.sync"
  | "report.generate"
  | "accounting.sync"
  | "accounting.token.refresh";

// Base job data interface
export interface BaseJobData {
  id: string;
  type: JobType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Webhook job data
export interface WebhookJobData extends BaseJobData {
  type: "webhook.process" | "webhook.retry";
  provider: "stripe" | "gmail" | "outlook" | "custom";
  eventId: string;
  eventType: string;
  payload: any;
  signature?: string;
  retryCount?: number;
  maxRetries?: number;
}

// Email job data
export interface EmailJobData extends BaseJobData {
  type: "email.send" | "email.sync";
  provider?: "gmail" | "outlook" | "sendgrid" | "resend";
  to?: string | string[];
  from?: string;
  subject?: string;
  body?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  templateId?: string;
  templateData?: Record<string, any>;
}

// Stripe job data
export interface StripeJobData extends BaseJobData {
  type: "stripe.sync" | "stripe.webhook";
  stripeEventId?: string;
  stripeEventType?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  payload: any;
}

// Subscription job data
export interface SubscriptionJobData extends BaseJobData {
  type: "subscription.renew" | "subscription.cancel";
  subscriptionId: string;
  teamId: string;
  customerId: string;
  action: "renew" | "cancel" | "pause" | "resume";
  scheduledFor?: Date;
}

// Payment job data
export interface PaymentJobData extends BaseJobData {
  type: "payment.process";
  paymentMethodId: string;
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Accounting job data
export interface AccountingJobData extends BaseJobData {
  type: "accounting.sync" | "accounting.token.refresh";
  teamId: string;
  userId: string;
  provider: "quickbooks" | "xero" | "sage" | "wave" | "freshbooks";
  connectionId?: string;
  entities?: Array<"customers" | "invoices" | "payments" | "accounts" | "items" | "vendors" | "bills">;
  modifiedSince?: Date;
  maxResults?: number;
  credentials?: {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string; // QuickBooks
    tenantId?: string; // Xero
    expiresAt?: number;
    environment?: string;
  };
}

// Union type for all job data
export type JobData =
  | WebhookJobData
  | EmailJobData
  | StripeJobData
  | SubscriptionJobData
  | PaymentJobData
  | AccountingJobData;

// Queue configuration
export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
  };
  defaultJobOptions?: JobsOptions;
  workers?: {
    concurrency?: number;
    maxStalledCount?: number;
    stalledInterval?: number;
  };
}

// Job processor function type
export type JobProcessor<T extends JobData = JobData> = (
  job: Job<T>
) => Promise<any>;

// Job result types
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  retryable?: boolean;
  nextRetryDelay?: number;
}

// Retry strategy configuration
export interface RetryStrategy {
  maxRetries: number;
  backoffType: "exponential" | "linear" | "fixed";
  backoffDelay: number;
  maxBackoffDelay?: number;
  retryableErrors?: string[];
  nonRetryableErrors?: string[];
}

// Dead letter queue configuration
export interface DeadLetterConfig {
  enabled: boolean;
  maxRetries: number;
  queueName?: string;
  ttl?: number; // Time to live in seconds
}

// Queue metrics
export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  lastJobCompletedAt?: Date;
  lastJobFailedAt?: Date;
  avgProcessingTime?: number;
  successRate?: number;
}

// Event types for queue monitoring
export interface QueueEventHandlers {
  onCompleted?: (job: Job, result: any) => void | Promise<void>;
  onFailed?: (job: Job, error: Error) => void | Promise<void>;
  onProgress?: (job: Job, progress: number | object) => void | Promise<void>;
  onActive?: (job: Job) => void | Promise<void>;
  onStalled?: (job: Job) => void | Promise<void>;
  onRemoved?: (job: Job) => void | Promise<void>;
}

// Webhook validation schemas
export const webhookJobSchema = z.object({
  id: z.string(),
  type: z.enum(["webhook.process", "webhook.retry"]),
  timestamp: z.date(),
  provider: z.enum(["stripe", "gmail", "outlook", "custom"]),
  eventId: z.string(),
  eventType: z.string(),
  payload: z.any(),
  signature: z.string().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  metadata: z.record(z.any()).optional(),
});

export const stripeJobSchema = z.object({
  id: z.string(),
  type: z.enum(["stripe.sync", "stripe.webhook"]),
  timestamp: z.date(),
  stripeEventId: z.string().optional(),
  stripeEventType: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripePriceId: z.string().optional(),
  payload: z.any(),
  metadata: z.record(z.any()).optional(),
});

// Priority levels for jobs
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 5,
  NORMAL = 10,
  LOW = 20,
}

// Job status for tracking
export enum JobStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  DELAYED = "delayed",
  WAITING = "waiting",
  PAUSED = "paused",
}

// Bulk job operations
export interface BulkJobOptions {
  jobs: Array<{
    name: string;
    data: JobData;
    opts?: JobsOptions;
  }>;
  batchSize?: number;
  parallel?: boolean;
}