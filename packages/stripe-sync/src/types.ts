import { z } from "zod";
import type Stripe from "stripe";

export const stripeConfigSchema = z.object({
  secretKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  apiVersion: z.string().default("2024-11-20.acacia"),
});

export type StripeConfig = z.infer<typeof stripeConfigSchema>;

export interface WebhookHandlerOptions {
  queueEnabled?: boolean;
  maxRetries?: number;
  logLevel?: "info" | "debug" | "error";
}

export interface SubscriptionSyncOptions {
  teamId: string;
  customerId?: string;
  subscriptionId?: string;
  syncProducts?: boolean;
  syncInvoices?: boolean;
  syncPaymentMethods?: boolean;
}

export interface SyncResult {
  success: boolean;
  synced: {
    customers: number;
    subscriptions: number;
    products: number;
    prices: number;
    invoices: number;
    paymentMethods: number;
  };
  errors: Array<{
    type: string;
    id?: string;
    error: string;
  }>;
}

export interface CreateCheckoutOptions {
  teamId: string;
  priceId: string;
  customerId?: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  allowPromoCodes?: boolean;
  trialPeriodDays?: number;
}

export interface CreatePortalOptions {
  customerId: string;
  returnUrl: string;
  flowData?: {
    type: "subscription_cancel" | "subscription_update" | "subscription_update_confirm";
    subscriptionId?: string;
  };
}

export interface UpdateSubscriptionOptions {
  subscriptionId: string;
  items?: Array<{
    id?: string;
    priceId?: string;
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: number | "now";
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
}

export interface CancelSubscriptionOptions {
  subscriptionId: string;
  immediately?: boolean;
  feedback?: string;
  cancellationReason?: Stripe.SubscriptionCancelParams.CancellationDetails.Feedback;
}

export interface WebhookEvent {
  id: string;
  type: string;
  created: Date;
  data: any;
  request?: {
    id?: string | null;
    idempotencyKey?: string | null;
  };
  processed?: boolean;
  error?: string;
}

export type StripeEventType = 
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.paused"
  | "customer.subscription.resumed"
  | "customer.subscription.pending_update_applied"
  | "customer.subscription.pending_update_expired"
  | "customer.subscription.trial_will_end"
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "invoice.marked_uncollectible"
  | "invoice.payment_action_required"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_method.attached"
  | "payment_method.detached"
  | "payment_method.updated"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "price.created"
  | "price.updated"
  | "price.deleted"
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "billing_portal.session.created";