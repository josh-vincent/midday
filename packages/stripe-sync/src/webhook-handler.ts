import Stripe from "stripe";
import { logger } from "@midday/logger";
import { QueueManager } from "@midday/queue";
import type { 
  StripeConfig, 
  WebhookHandlerOptions,
  WebhookEvent 
} from "./types";

export class StripeWebhookHandler {
  private stripe: Stripe;
  private webhookSecret: string;
  private queueManager?: QueueManager;
  private options: WebhookHandlerOptions;

  constructor(
    config: StripeConfig,
    queueManager?: QueueManager,
    options: WebhookHandlerOptions = {}
  ) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion as any,
    });
    this.webhookSecret = config.webhookSecret;
    this.queueManager = queueManager;
    this.options = {
      queueEnabled: true,
      maxRetries: 3,
      logLevel: "info",
      ...options,
    };
  }

  async handleWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const event = this.constructEvent(rawBody, signature);
      
      if (!event) {
        return { success: false, error: "Invalid webhook signature" };
      }

      logger.info(`Received Stripe webhook: ${event.type}`, { 
        eventId: event.id 
      });

      if (this.options.queueEnabled && this.queueManager) {
        await this.queueManager.addJob(
          "webhooks",
          "webhook.process",
          {
            id: `stripe_${event.id}`,
            type: "webhook.process",
            timestamp: new Date(),
            provider: "stripe",
            eventId: event.id,
            eventType: event.type,
            payload: event,
            signature,
            maxRetries: this.options.maxRetries,
          }
        );

        logger.info(`Webhook ${event.id} queued for processing`);
        return { success: true, eventId: event.id };
      } else {
        const processed = await this.processEventDirectly(event);
        return {
          success: processed,
          eventId: event.id,
          error: processed ? undefined : "Failed to process event",
        };
      }
    } catch (error: any) {
      logger.error("Webhook handler error:", error);
      return {
        success: false,
        error: error.message || "Webhook processing failed",
      };
    }
  }

  constructEvent(
    rawBody: string | Buffer,
    signature: string
  ): Stripe.Event | null {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );
    } catch (error: any) {
      logger.error("Failed to construct webhook event:", error);
      return null;
    }
  }

  async processEventDirectly(event: Stripe.Event): Promise<boolean> {
    try {
      const { StripeWebhookProcessor } = await import("@midday/queue/processors/stripe-processor");
      const processor = new StripeWebhookProcessor();
      await processor.process(event.type, event);
      return true;
    } catch (error: any) {
      logger.error(`Failed to process event ${event.id}:`, error);
      return false;
    }
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<boolean> {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  getSupportedEventTypes(): string[] {
    return [
      "customer.created",
      "customer.updated",
      "customer.deleted",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.subscription.paused",
      "customer.subscription.resumed",
      "customer.subscription.trial_will_end",
      "invoice.created",
      "invoice.finalized",
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.upcoming",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_method.attached",
      "payment_method.detached",
      "product.created",
      "product.updated",
      "price.created",
      "price.updated",
      "checkout.session.completed",
      "checkout.session.expired",
    ];
  }
}