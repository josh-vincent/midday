import { logger } from "@midday/logger";
import { db } from "@midday/db";
import {
  stripeCustomers,
  stripeSubscriptions,
  stripeInvoices,
  stripePaymentMethods,
  stripeProducts,
  stripePrices,
  webhookEvents,
  teams,
} from "@midday/db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

export class StripeWebhookProcessor {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
    });
  }

  /**
   * Process Stripe webhook event
   */
  async process(eventType: string, payload: any): Promise<any> {
    logger.info(`Processing Stripe event: ${eventType}`);

    // Log webhook event
    await this.logWebhookEvent(eventType, payload);

    // Process based on event type
    switch (eventType) {
      // Customer events
      case "customer.created":
      case "customer.updated":
        return this.upsertCustomer(payload.object);
      
      case "customer.deleted":
        return this.deleteCustomer(payload.object.id);

      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated":
        return this.upsertSubscription(payload.object);
      
      case "customer.subscription.deleted":
        return this.deleteSubscription(payload.object.id);
      
      case "customer.subscription.paused":
        return this.pauseSubscription(payload.object);
      
      case "customer.subscription.resumed":
        return this.resumeSubscription(payload.object);

      // Invoice events
      case "invoice.created":
      case "invoice.updated":
        return this.upsertInvoice(payload.object);
      
      case "invoice.paid":
        return this.markInvoicePaid(payload.object);
      
      case "invoice.payment_failed":
        return this.handlePaymentFailed(payload.object);
      
      case "invoice.finalized":
        return this.finalizeInvoice(payload.object);

      // Payment method events
      case "payment_method.attached":
        return this.attachPaymentMethod(payload.object);
      
      case "payment_method.detached":
        return this.detachPaymentMethod(payload.object.id);
      
      case "payment_method.updated":
        return this.updatePaymentMethod(payload.object);

      // Product and pricing events
      case "product.created":
      case "product.updated":
        return this.upsertProduct(payload.object);
      
      case "product.deleted":
        return this.deleteProduct(payload.object.id);
      
      case "price.created":
      case "price.updated":
        return this.upsertPrice(payload.object);
      
      case "price.deleted":
        return this.deletePrice(payload.object.id);

      // Checkout session events
      case "checkout.session.completed":
        return this.handleCheckoutCompleted(payload.object);
      
      case "checkout.session.expired":
        return this.handleCheckoutExpired(payload.object);

      // Setup intent events
      case "setup_intent.succeeded":
        return this.handleSetupIntentSucceeded(payload.object);

      default:
        logger.warn(`Unhandled Stripe event type: ${eventType}`);
        return { processed: false, eventType };
    }
  }

  /**
   * Log webhook event to database
   */
  private async logWebhookEvent(eventType: string, payload: any): Promise<void> {
    try {
      await db.insert(webhookEvents).values({
        provider: "stripe",
        eventId: payload.id,
        eventType,
        payload,
        processed: true,
        processedAt: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: webhookEvents.eventId,
        set: {
          processed: true,
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Failed to log webhook event", error);
    }
  }

  /**
   * Upsert customer
   */
  private async upsertCustomer(customer: Stripe.Customer): Promise<void> {
    try {
      // Find team by email or metadata
      const teamId = await this.findTeamIdForCustomer(customer);
      
      if (!teamId) {
        logger.warn(`No team found for customer ${customer.id}`);
        return;
      }

      await db.insert(stripeCustomers).values({
        teamId,
        stripeCustomerId: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        currency: customer.currency || "USD",
        defaultPaymentMethod: customer.invoice_settings?.default_payment_method as string | undefined,
        invoicePrefix: customer.invoice_prefix || undefined,
        balance: customer.balance || 0,
        delinquent: customer.delinquent || false,
        metadata: customer.metadata || {},
      }).onConflictDoUpdate({
        target: stripeCustomers.stripeCustomerId,
        set: {
          email: customer.email || undefined,
          name: customer.name || undefined,
          currency: customer.currency || "USD",
          defaultPaymentMethod: customer.invoice_settings?.default_payment_method as string | undefined,
          invoicePrefix: customer.invoice_prefix || undefined,
          balance: customer.balance || 0,
          delinquent: customer.delinquent || false,
          metadata: customer.metadata || {},
          updatedAt: new Date().toISOString(),
        },
      });

      logger.info(`Customer ${customer.id} upserted`);
    } catch (error) {
      logger.error(`Failed to upsert customer ${customer.id}`, error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  private async deleteCustomer(customerId: string): Promise<void> {
    try {
      await db.delete(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, customerId));
      
      logger.info(`Customer ${customerId} deleted`);
    } catch (error) {
      logger.error(`Failed to delete customer ${customerId}`, error);
      throw error;
    }
  }

  /**
   * Upsert subscription
   */
  private async upsertSubscription(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customer = await db.query.stripeCustomers.findFirst({
        where: eq(stripeCustomers.stripeCustomerId, subscription.customer as string),
      });

      if (!customer) {
        logger.warn(`Customer not found for subscription ${subscription.id}`);
        // Try to sync customer first
        const stripeCustomer = await this.stripe.customers.retrieve(subscription.customer as string);
        await this.upsertCustomer(stripeCustomer as Stripe.Customer);
        return this.upsertSubscription(subscription); // Retry
      }

      // Get the first price from items (assuming single product subscriptions)
      const priceId = subscription.items.data[0]?.price.id;

      await db.insert(stripeSubscriptions).values({
        teamId: customer.teamId,
        stripeCustomerId: customer.stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status as any,
        quantity: subscription.items.data[0]?.quantity || 1,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : undefined,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : undefined,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : undefined,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
        metadata: subscription.metadata || {},
      }).onConflictDoUpdate({
        target: stripeSubscriptions.stripeSubscriptionId,
        set: {
          stripePriceId: priceId,
          status: subscription.status as any,
          quantity: subscription.items.data[0]?.quantity || 1,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : undefined,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : undefined,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : undefined,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
          metadata: subscription.metadata || {},
          updatedAt: new Date().toISOString(),
        },
      });

      logger.info(`Subscription ${subscription.id} upserted`);
    } catch (error) {
      logger.error(`Failed to upsert subscription ${subscription.id}`, error);
      throw error;
    }
  }

  /**
   * Delete subscription
   */
  private async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      await db.update(stripeSubscriptions)
        .set({
          status: "canceled",
          endedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(stripeSubscriptions.stripeSubscriptionId, subscriptionId));
      
      logger.info(`Subscription ${subscriptionId} canceled`);
    } catch (error) {
      logger.error(`Failed to cancel subscription ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Pause subscription
   */
  private async pauseSubscription(subscription: Stripe.Subscription): Promise<void> {
    try {
      await db.update(stripeSubscriptions)
        .set({
          status: "paused",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
      
      logger.info(`Subscription ${subscription.id} paused`);
    } catch (error) {
      logger.error(`Failed to pause subscription ${subscription.id}`, error);
      throw error;
    }
  }

  /**
   * Resume subscription
   */
  private async resumeSubscription(subscription: Stripe.Subscription): Promise<void> {
    try {
      await db.update(stripeSubscriptions)
        .set({
          status: "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
      
      logger.info(`Subscription ${subscription.id} resumed`);
    } catch (error) {
      logger.error(`Failed to resume subscription ${subscription.id}`, error);
      throw error;
    }
  }

  /**
   * Upsert invoice
   */
  private async upsertInvoice(invoice: Stripe.Invoice): Promise<void> {
    try {
      await db.insert(stripeInvoices).values({
        stripeInvoiceId: invoice.id!,
        stripeCustomerId: invoice.customer as string,
        stripeSubscriptionId: invoice.subscription as string | undefined,
        number: invoice.number || undefined,
        status: invoice.status || undefined,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        amountRemaining: invoice.amount_remaining,
        currency: invoice.currency,
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : undefined,
        paidAt: invoice.status === "paid" && invoice.status_transitions?.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
          : undefined,
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : undefined,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
        metadata: invoice.metadata || {},
      }).onConflictDoUpdate({
        target: stripeInvoices.stripeInvoiceId,
        set: {
          status: invoice.status || undefined,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          amountRemaining: invoice.amount_remaining,
          paidAt: invoice.status === "paid" && invoice.status_transitions?.paid_at 
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
            : undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
          metadata: invoice.metadata || {},
        },
      });

      logger.info(`Invoice ${invoice.id} upserted`);
    } catch (error) {
      logger.error(`Failed to upsert invoice ${invoice.id}`, error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  private async markInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    try {
      await db.update(stripeInvoices)
        .set({
          status: "paid",
          amountPaid: invoice.amount_paid,
          amountRemaining: 0,
          paidAt: new Date().toISOString(),
        })
        .where(eq(stripeInvoices.stripeInvoiceId, invoice.id!));
      
      logger.info(`Invoice ${invoice.id} marked as paid`);
    } catch (error) {
      logger.error(`Failed to mark invoice ${invoice.id} as paid`, error);
      throw error;
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      // Update invoice status
      await db.update(stripeInvoices)
        .set({
          status: "open",
        })
        .where(eq(stripeInvoices.stripeInvoiceId, invoice.id!));

      // Update subscription status if applicable
      if (invoice.subscription) {
        await db.update(stripeSubscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(stripeSubscriptions.stripeSubscriptionId, invoice.subscription as string));
      }
      
      logger.info(`Payment failed for invoice ${invoice.id}`);
    } catch (error) {
      logger.error(`Failed to handle payment failure for invoice ${invoice.id}`, error);
      throw error;
    }
  }

  /**
   * Finalize invoice
   */
  private async finalizeInvoice(invoice: Stripe.Invoice): Promise<void> {
    try {
      await db.update(stripeInvoices)
        .set({
          status: invoice.status || "open",
          number: invoice.number || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
        })
        .where(eq(stripeInvoices.stripeInvoiceId, invoice.id!));
      
      logger.info(`Invoice ${invoice.id} finalized`);
    } catch (error) {
      logger.error(`Failed to finalize invoice ${invoice.id}`, error);
      throw error;
    }
  }

  /**
   * Attach payment method
   */
  private async attachPaymentMethod(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    try {
      await db.insert(stripePaymentMethods).values({
        stripeCustomerId: paymentMethod.customer as string,
        stripePaymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
          fingerprint: paymentMethod.card.fingerprint,
        } : undefined,
        billingDetails: paymentMethod.billing_details || {},
        isDefault: false,
      }).onConflictDoNothing();

      logger.info(`Payment method ${paymentMethod.id} attached`);
    } catch (error) {
      logger.error(`Failed to attach payment method ${paymentMethod.id}`, error);
      throw error;
    }
  }

  /**
   * Detach payment method
   */
  private async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await db.delete(stripePaymentMethods)
        .where(eq(stripePaymentMethods.stripePaymentMethodId, paymentMethodId));
      
      logger.info(`Payment method ${paymentMethodId} detached`);
    } catch (error) {
      logger.error(`Failed to detach payment method ${paymentMethodId}`, error);
      throw error;
    }
  }

  /**
   * Update payment method
   */
  private async updatePaymentMethod(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    try {
      await db.update(stripePaymentMethods)
        .set({
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            fingerprint: paymentMethod.card.fingerprint,
          } : undefined,
          billingDetails: paymentMethod.billing_details || {},
        })
        .where(eq(stripePaymentMethods.stripePaymentMethodId, paymentMethod.id));
      
      logger.info(`Payment method ${paymentMethod.id} updated`);
    } catch (error) {
      logger.error(`Failed to update payment method ${paymentMethod.id}`, error);
      throw error;
    }
  }

  /**
   * Upsert product
   */
  private async upsertProduct(product: Stripe.Product): Promise<void> {
    try {
      await db.insert(stripeProducts).values({
        stripeProductId: product.id,
        name: product.name,
        description: product.description || undefined,
        active: product.active,
        features: product.features?.map(f => f.name) || [],
        metadata: product.metadata || {},
      }).onConflictDoUpdate({
        target: stripeProducts.stripeProductId,
        set: {
          name: product.name,
          description: product.description || undefined,
          active: product.active,
          features: product.features?.map(f => f.name) || [],
          metadata: product.metadata || {},
          updatedAt: new Date().toISOString(),
        },
      });

      logger.info(`Product ${product.id} upserted`);
    } catch (error) {
      logger.error(`Failed to upsert product ${product.id}`, error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  private async deleteProduct(productId: string): Promise<void> {
    try {
      await db.update(stripeProducts)
        .set({
          active: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(stripeProducts.stripeProductId, productId));
      
      logger.info(`Product ${productId} deactivated`);
    } catch (error) {
      logger.error(`Failed to deactivate product ${productId}`, error);
      throw error;
    }
  }

  /**
   * Upsert price
   */
  private async upsertPrice(price: Stripe.Price): Promise<void> {
    try {
      await db.insert(stripePrices).values({
        stripePriceId: price.id,
        stripeProductId: price.product as string,
        active: price.active,
        unitAmount: price.unit_amount || undefined,
        currency: price.currency,
        type: price.type,
        interval: price.recurring?.interval as any,
        intervalCount: price.recurring?.interval_count,
        trialPeriodDays: price.recurring?.trial_period_days,
        metadata: price.metadata || {},
      }).onConflictDoUpdate({
        target: stripePrices.stripePriceId,
        set: {
          active: price.active,
          metadata: price.metadata || {},
        },
      });

      logger.info(`Price ${price.id} upserted`);
    } catch (error) {
      logger.error(`Failed to upsert price ${price.id}`, error);
      throw error;
    }
  }

  /**
   * Delete price
   */
  private async deletePrice(priceId: string): Promise<void> {
    try {
      await db.update(stripePrices)
        .set({
          active: false,
        })
        .where(eq(stripePrices.stripePriceId, priceId));
      
      logger.info(`Price ${priceId} deactivated`);
    } catch (error) {
      logger.error(`Failed to deactivate price ${priceId}`, error);
      throw error;
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      logger.info(`Checkout session ${session.id} completed`);
      
      // If subscription was created, it will be handled by subscription.created event
      // If payment was made, it will be handled by payment_intent.succeeded event
      
      // You can add custom logic here if needed
    } catch (error) {
      logger.error(`Failed to handle checkout completion ${session.id}`, error);
      throw error;
    }
  }

  /**
   * Handle checkout session expired
   */
  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    try {
      logger.info(`Checkout session ${session.id} expired`);
      // Add any cleanup logic here if needed
    } catch (error) {
      logger.error(`Failed to handle checkout expiration ${session.id}`, error);
      throw error;
    }
  }

  /**
   * Handle setup intent succeeded
   */
  private async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
    try {
      logger.info(`Setup intent ${setupIntent.id} succeeded`);
      
      // Update default payment method if needed
      if (setupIntent.payment_method && setupIntent.customer) {
        await db.update(stripeCustomers)
          .set({
            defaultPaymentMethod: setupIntent.payment_method as string,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(stripeCustomers.stripeCustomerId, setupIntent.customer as string));
      }
    } catch (error) {
      logger.error(`Failed to handle setup intent ${setupIntent.id}`, error);
      throw error;
    }
  }

  /**
   * Find team ID for a Stripe customer
   */
  private async findTeamIdForCustomer(customer: Stripe.Customer): Promise<string | null> {
    // First check if customer already exists in our database
    const existingCustomer = await db.query.stripeCustomers.findFirst({
      where: eq(stripeCustomers.stripeCustomerId, customer.id),
    });

    if (existingCustomer) {
      return existingCustomer.teamId;
    }

    // Try to find team by metadata
    if (customer.metadata?.teamId) {
      return customer.metadata.teamId;
    }

    // Try to find team by email
    if (customer.email) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.email, customer.email),
      });

      if (team) {
        return team.id;
      }
    }

    return null;
  }
}