import Stripe from "stripe";
import { db } from "@midday/db";
import { 
  stripeCustomers,
  stripeSubscriptions,
  stripeProducts,
  stripePrices,
  stripeInvoices,
  stripePaymentMethods,
} from "@midday/db/schema";
import { logger } from "@midday/logger";
import { eq } from "drizzle-orm";
import type { 
  StripeConfig,
  CreateCheckoutOptions,
  CreatePortalOptions,
  UpdateSubscriptionOptions,
  CancelSubscriptionOptions,
} from "./types";

export class StripeSubscriptionManager {
  private stripe: Stripe;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion as any,
    });
  }

  async createCheckoutSession(options: CreateCheckoutOptions): Promise<string> {
    const {
      teamId,
      priceId,
      customerId,
      quantity = 1,
      successUrl,
      cancelUrl,
      metadata = {},
      allowPromoCodes = false,
      trialPeriodDays,
    } = options;

    try {
      let stripeCustomerId = customerId;

      if (!stripeCustomerId) {
        const customer = await this.createCustomer(teamId, metadata);
        stripeCustomerId = customer.id;
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: allowPromoCodes,
        metadata: {
          teamId,
          ...metadata,
        },
        subscription_data: {
          metadata: {
            teamId,
            ...metadata,
          },
        },
      };

      if (trialPeriodDays) {
        sessionParams.subscription_data!.trial_period_days = trialPeriodDays;
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      logger.info(`Checkout session created: ${session.id}`, { 
        teamId, 
        customerId: stripeCustomerId 
      });

      return session.url!;
    } catch (error: any) {
      logger.error("Failed to create checkout session:", error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async createBillingPortalSession(
    options: CreatePortalOptions
  ): Promise<string> {
    const { customerId, returnUrl, flowData } = options;

    try {
      const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
        customer: customerId,
        return_url: returnUrl,
      };

      if (flowData) {
        sessionParams.flow_data = flowData as any;
      }

      const session = await this.stripe.billingPortal.sessions.create(
        sessionParams
      );

      logger.info(`Billing portal session created for customer: ${customerId}`);

      return session.url;
    } catch (error: any) {
      logger.error("Failed to create billing portal session:", error);
      throw new Error(`Failed to create billing portal session: ${error.message}`);
    }
  }

  async updateSubscription(
    options: UpdateSubscriptionOptions
  ): Promise<Stripe.Subscription> {
    const {
      subscriptionId,
      items,
      metadata,
      cancelAtPeriodEnd,
      trialEnd,
      prorationBehavior = "create_prorations",
    } = options;

    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        proration_behavior: prorationBehavior,
      };

      if (items) {
        updateParams.items = items.map(item => ({
          id: item.id,
          price: item.priceId,
          quantity: item.quantity,
        }));
      }

      if (metadata) {
        updateParams.metadata = metadata;
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = cancelAtPeriodEnd;
      }

      if (trialEnd !== undefined) {
        updateParams.trial_end = trialEnd;
      }

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateParams
      );

      await this.syncSubscriptionToDatabase(subscription);

      logger.info(`Subscription updated: ${subscriptionId}`);

      return subscription;
    } catch (error: any) {
      logger.error(`Failed to update subscription ${subscriptionId}:`, error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(
    options: CancelSubscriptionOptions
  ): Promise<Stripe.Subscription> {
    const {
      subscriptionId,
      immediately = false,
      feedback,
      cancellationReason,
    } = options;

    try {
      const cancelParams: Stripe.SubscriptionCancelParams = {};

      if (feedback || cancellationReason) {
        cancelParams.cancellation_details = {
          comment: feedback,
          feedback: cancellationReason,
        };
      }

      const subscription = immediately
        ? await this.stripe.subscriptions.cancel(subscriptionId, cancelParams)
        : await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            cancellation_details: cancelParams.cancellation_details,
          });

      await this.syncSubscriptionToDatabase(subscription);

      logger.info(`Subscription cancelled: ${subscriptionId}`, {
        immediately,
        feedback,
      });

      return subscription;
    } catch (error: any) {
      logger.error(`Failed to cancel subscription ${subscriptionId}:`, error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: "mark_uncollectible",
        },
      });

      await this.syncSubscriptionToDatabase(subscription);

      logger.info(`Subscription paused: ${subscriptionId}`);

      return subscription;
    } catch (error: any) {
      logger.error(`Failed to pause subscription ${subscriptionId}:`, error);
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        pause_collection: null as any,
      });

      await this.syncSubscriptionToDatabase(subscription);

      logger.info(`Subscription resumed: ${subscriptionId}`);

      return subscription;
    } catch (error: any) {
      logger.error(`Failed to resume subscription ${subscriptionId}:`, error);
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["customer", "default_payment_method", "latest_invoice"],
      });
    } catch (error: any) {
      logger.error(`Failed to get subscription ${subscriptionId}:`, error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        expand: ["data.default_payment_method"],
      });

      return subscriptions.data;
    } catch (error: any) {
      logger.error(`Failed to get customer subscriptions:`, error);
      throw new Error(`Failed to get customer subscriptions: ${error.message}`);
    }
  }

  async createCustomer(
    teamId: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        metadata: {
          teamId,
          ...metadata,
        },
      });

      await db.insert(stripeCustomers).values({
        teamId,
        stripeCustomerId: customer.id,
        email: customer.email || null,
        name: customer.name || null,
        metadata: customer.metadata,
        createdAt: new Date(customer.created * 1000),
      }).onConflictDoNothing();

      logger.info(`Customer created: ${customer.id}`, { teamId });

      return customer;
    } catch (error: any) {
      logger.error("Failed to create customer:", error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async updateCustomerPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const [dbCustomer] = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, customerId))
        .limit(1);

      if (dbCustomer) {
        await db
          .update(stripeCustomers)
          .set({
            defaultPaymentMethod: paymentMethodId,
            updatedAt: new Date(),
          })
          .where(eq(stripeCustomers.id, dbCustomer.id));
      }

      logger.info(`Customer payment method updated: ${customerId}`);

      return customer;
    } catch (error: any) {
      logger.error("Failed to update customer payment method:", error);
      throw new Error(`Failed to update payment method: ${error.message}`);
    }
  }

  private async syncSubscriptionToDatabase(
    subscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

      const [customer] = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, customerId))
        .limit(1);

      if (!customer) {
        logger.warn(`Customer not found in database: ${customerId}`);
        return;
      }

      const defaultPaymentMethod = subscription.default_payment_method
        ? typeof subscription.default_payment_method === "string"
          ? subscription.default_payment_method
          : subscription.default_payment_method.id
        : null;

      await db
        .insert(stripeSubscriptions)
        .values({
          teamId: customer.teamId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          metadata: subscription.metadata,
          defaultPaymentMethod,
          createdAt: new Date(subscription.created * 1000),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stripeSubscriptions.stripeSubscriptionId,
          set: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            canceledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            metadata: subscription.metadata,
            defaultPaymentMethod,
            updatedAt: new Date(),
          },
        });
    } catch (error: any) {
      logger.error("Failed to sync subscription to database:", error);
      throw error;
    }
  }
}