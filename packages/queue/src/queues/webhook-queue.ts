import { Job } from "bullmq";
import { logger } from "@midday/logger";
import type { WebhookJobData, JobResult } from "../types";
import { QueueManager } from "../queue-manager";

export class WebhookQueue {
  private queueManager: QueueManager;
  private readonly queueName = "webhooks";

  constructor(queueManager: QueueManager) {
    this.queueManager = queueManager;
    this.initializeWorker();
  }

  /**
   * Initialize the webhook worker
   */
  private initializeWorker(): void {
    this.queueManager.createWorker(
      this.queueName,
      this.processWebhook.bind(this),
      {
        onCompleted: (job, result) => {
          logger.info(`Webhook ${job.id} processed successfully`, { 
            eventId: job.data.eventId,
            eventType: job.data.eventType,
            provider: job.data.provider,
          });
        },
        onFailed: (job, error) => {
          logger.error(`Webhook ${job?.id} failed`, {
            error: error.message,
            eventId: job?.data.eventId,
            eventType: job?.data.eventType,
            provider: job?.data.provider,
            retryCount: job?.data.retryCount,
          });
        },
        onActive: (job) => {
          logger.info(`Processing webhook ${job.id}`, {
            eventType: job.data.eventType,
            provider: job.data.provider,
          });
        },
      }
    );
  }

  /**
   * Process a webhook job
   */
  private async processWebhook(job: Job<WebhookJobData>): Promise<JobResult> {
    const { provider, eventType, payload, signature, retryCount = 0, maxRetries = 3 } = job.data;

    try {
      // Update progress
      await job.updateProgress(10);

      // Verify webhook signature if provided
      if (signature) {
        const isValid = await this.verifySignature(provider, payload, signature);
        if (!isValid) {
          throw new Error("Invalid webhook signature");
        }
      }

      await job.updateProgress(30);

      // Process based on provider
      let result: any;
      switch (provider) {
        case "stripe":
          result = await this.processStripeWebhook(job.data);
          break;
        case "gmail":
          result = await this.processGmailWebhook(job.data);
          break;
        case "outlook":
          result = await this.processOutlookWebhook(job.data);
          break;
        default:
          result = await this.processCustomWebhook(job.data);
      }

      await job.updateProgress(100);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable && retryCount < maxRetries) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000;
        
        await this.queueManager.addJob(
          this.queueName,
          "webhook.retry",
          {
            ...job.data,
            retryCount: retryCount + 1,
          },
          {
            delay: retryDelay,
            attempts: 1,
          }
        );

        logger.info(`Webhook ${job.id} scheduled for retry`, {
          retryCount: retryCount + 1,
          retryDelay,
        });
      } else {
        // Send to dead letter queue if max retries exceeded
        await this.sendToDeadLetterQueue(job.data, error);
      }

      return {
        success: false,
        error: error.message,
        retryable: isRetryable,
        nextRetryDelay: isRetryable ? Math.pow(2, retryCount) * 1000 : undefined,
      };
    }
  }

  /**
   * Process Stripe webhook
   */
  private async processStripeWebhook(data: WebhookJobData): Promise<any> {
    const { eventType, payload } = data;

    // Import Stripe processor dynamically to avoid circular dependencies
    const { StripeWebhookProcessor } = await import("../processors/stripe-processor");
    const processor = new StripeWebhookProcessor();

    return processor.process(eventType, payload);
  }

  /**
   * Process Gmail webhook
   */
  private async processGmailWebhook(data: WebhookJobData): Promise<any> {
    // Implement Gmail webhook processing
    logger.info("Processing Gmail webhook", { eventType: data.eventType });
    return { processed: true };
  }

  /**
   * Process Outlook webhook
   */
  private async processOutlookWebhook(data: WebhookJobData): Promise<any> {
    // Implement Outlook webhook processing
    logger.info("Processing Outlook webhook", { eventType: data.eventType });
    return { processed: true };
  }

  /**
   * Process custom webhook
   */
  private async processCustomWebhook(data: WebhookJobData): Promise<any> {
    logger.info("Processing custom webhook", { eventType: data.eventType });
    return { processed: true };
  }

  /**
   * Verify webhook signature
   */
  private async verifySignature(
    provider: string,
    payload: any,
    signature: string
  ): Promise<boolean> {
    switch (provider) {
      case "stripe":
        // Stripe signature verification will be handled by the processor
        return true;
      case "gmail":
        // Implement Gmail signature verification
        return true;
      case "outlook":
        // Implement Outlook signature verification
        return true;
      default:
        return true;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.statusCode) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.statusCode);
    }

    // Specific error messages
    const retryableMessages = [
      "timeout",
      "network",
      "connection",
      "ENOTFOUND",
      "rate limit",
    ];

    return retryableMessages.some((msg) => 
      error.message?.toLowerCase().includes(msg)
    );
  }

  /**
   * Send failed webhook to dead letter queue
   */
  private async sendToDeadLetterQueue(
    data: WebhookJobData,
    error: Error
  ): Promise<void> {
    await this.queueManager.addJob(
      "dead-letter-webhooks",
      "webhook.failed",
      {
        ...data,
        failedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    logger.error("Webhook sent to dead letter queue", {
      eventId: data.eventId,
      eventType: data.eventType,
      provider: data.provider,
      error: error.message,
    });
  }

  /**
   * Add webhook to queue
   */
  async addWebhook(data: Omit<WebhookJobData, "id" | "type" | "timestamp">): Promise<void> {
    await this.queueManager.addJob(
      this.queueName,
      "webhook.process",
      {
        ...data,
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "webhook.process",
        timestamp: new Date(),
      }
    );
  }

  /**
   * Get webhook queue metrics
   */
  async getMetrics() {
    return this.queueManager.getQueueMetrics(this.queueName);
  }

  /**
   * Retry all failed webhooks
   */
  async retryFailedWebhooks(): Promise<number> {
    const failedJobs = await this.queueManager.getJobs(this.queueName, "failed");
    
    for (const job of failedJobs) {
      await this.queueManager.retryJob(this.queueName, job.id!);
    }

    logger.info(`Retrying ${failedJobs.length} failed webhooks`);
    return failedJobs.length;
  }

  /**
   * Clean old completed webhooks
   */
  async cleanOldWebhooks(gracePeriod: number = 24 * 60 * 60 * 1000): Promise<void> {
    const removed = await this.queueManager.cleanQueue(
      this.queueName,
      gracePeriod,
      1000,
      "completed"
    );

    logger.info(`Cleaned ${removed.length} old webhooks`);
  }
}