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
import { eq, and, inArray } from "drizzle-orm";
import type { StripeConfig, SubscriptionSyncOptions, SyncResult } from "./types";

export class StripeSyncService {
  private stripe: Stripe;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion as any,
    });
  }

  async syncTeamData(options: SubscriptionSyncOptions): Promise<SyncResult> {
    const {
      teamId,
      customerId,
      subscriptionId,
      syncProducts = true,
      syncInvoices = true,
      syncPaymentMethods = true,
    } = options;

    const result: SyncResult = {
      success: true,
      synced: {
        customers: 0,
        subscriptions: 0,
        products: 0,
        prices: 0,
        invoices: 0,
        paymentMethods: 0,
      },
      errors: [],
    };

    try {
      if (customerId) {
        await this.syncCustomer(customerId, teamId, result);
        
        if (syncPaymentMethods) {
          await this.syncCustomerPaymentMethods(customerId, teamId, result);
        }

        if (syncInvoices) {
          await this.syncCustomerInvoices(customerId, teamId, result);
        }
      }

      if (subscriptionId) {
        await this.syncSubscription(subscriptionId, teamId, result);
      } else if (customerId) {
        await this.syncCustomerSubscriptions(customerId, teamId, result);
      } else {
        await this.syncAllTeamSubscriptions(teamId, result);
      }

      if (syncProducts) {
        await this.syncAllProducts(result);
      }

      logger.info("Stripe sync completed", { teamId, result });
    } catch (error: any) {
      logger.error("Stripe sync failed", { teamId, error });
      result.success = false;
      result.errors.push({
        type: "general",
        error: error.message,
      });
    }

    return result;
  }

  private async syncCustomer(
    customerId: string,
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        await db
          .delete(stripeCustomers)
          .where(eq(stripeCustomers.stripeCustomerId, customerId));
        return;
      }

      await db
        .insert(stripeCustomers)
        .values({
          teamId,
          stripeCustomerId: customer.id,
          email: customer.email || null,
          name: customer.name || null,
          phone: customer.phone || null,
          metadata: customer.metadata,
          createdAt: new Date(customer.created * 1000),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stripeCustomers.stripeCustomerId,
          set: {
            email: customer.email || null,
            name: customer.name || null,
            phone: customer.phone || null,
            metadata: customer.metadata,
            updatedAt: new Date(),
          },
        });

      result.synced.customers++;
    } catch (error: any) {
      logger.error(`Failed to sync customer ${customerId}:`, error);
      result.errors.push({
        type: "customer",
        id: customerId,
        error: error.message,
      });
    }
  }

  private async syncSubscription(
    subscriptionId: string,
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["customer", "items.data.price.product"],
        }
      );

      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

      const defaultPaymentMethod = subscription.default_payment_method
        ? typeof subscription.default_payment_method === "string"
          ? subscription.default_payment_method
          : subscription.default_payment_method.id
        : null;

      await db
        .insert(stripeSubscriptions)
        .values({
          teamId,
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
            metadata: subscription.metadata,
            defaultPaymentMethod,
            updatedAt: new Date(),
          },
        });

      for (const item of subscription.items.data) {
        if (item.price.product && typeof item.price.product !== "string") {
          await this.syncProduct(item.price.product, result);
        }
        await this.syncPrice(item.price, result);
      }

      result.synced.subscriptions++;
    } catch (error: any) {
      logger.error(`Failed to sync subscription ${subscriptionId}:`, error);
      result.errors.push({
        type: "subscription",
        id: subscriptionId,
        error: error.message,
      });
    }
  }

  private async syncCustomerSubscriptions(
    customerId: string,
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        expand: ["data.items.data.price.product"],
      });

      for (const subscription of subscriptions.data) {
        await this.syncSubscription(subscription.id, teamId, result);
      }
    } catch (error: any) {
      logger.error(`Failed to sync customer subscriptions:`, error);
      result.errors.push({
        type: "subscriptions",
        id: customerId,
        error: error.message,
      });
    }
  }

  private async syncAllTeamSubscriptions(
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const customers = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.teamId, teamId));

      for (const customer of customers) {
        if (customer.stripeCustomerId) {
          await this.syncCustomerSubscriptions(
            customer.stripeCustomerId,
            teamId,
            result
          );
        }
      }
    } catch (error: any) {
      logger.error(`Failed to sync team subscriptions:`, error);
      result.errors.push({
        type: "team_subscriptions",
        error: error.message,
      });
    }
  }

  private async syncCustomerPaymentMethods(
    customerId: string,
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      for (const paymentMethod of paymentMethods.data) {
        await db
          .insert(stripePaymentMethods)
          .values({
            teamId,
            stripePaymentMethodId: paymentMethod.id,
            stripeCustomerId: customerId,
            type: paymentMethod.type,
            brand: paymentMethod.card?.brand || null,
            last4: paymentMethod.card?.last4 || null,
            expMonth: paymentMethod.card?.exp_month || null,
            expYear: paymentMethod.card?.exp_year || null,
            metadata: paymentMethod.metadata,
            createdAt: new Date(paymentMethod.created * 1000),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: stripePaymentMethods.stripePaymentMethodId,
            set: {
              brand: paymentMethod.card?.brand || null,
              last4: paymentMethod.card?.last4 || null,
              expMonth: paymentMethod.card?.exp_month || null,
              expYear: paymentMethod.card?.exp_year || null,
              metadata: paymentMethod.metadata,
              updatedAt: new Date(),
            },
          });

        result.synced.paymentMethods++;
      }
    } catch (error: any) {
      logger.error(`Failed to sync payment methods:`, error);
      result.errors.push({
        type: "payment_methods",
        id: customerId,
        error: error.message,
      });
    }
  }

  private async syncCustomerInvoices(
    customerId: string,
    teamId: string,
    result: SyncResult
  ): Promise<void> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });

      for (const invoice of invoices.data) {
        await db
          .insert(stripeInvoices)
          .values({
            teamId,
            stripeInvoiceId: invoice.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: invoice.subscription as string || null,
            status: invoice.status || "draft",
            amountDue: invoice.amount_due,
            amountPaid: invoice.amount_paid,
            amountRemaining: invoice.amount_remaining,
            currency: invoice.currency,
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            paidAt: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000)
              : null,
            hostedInvoiceUrl: invoice.hosted_invoice_url || null,
            invoicePdf: invoice.invoice_pdf || null,
            metadata: invoice.metadata,
            createdAt: new Date(invoice.created * 1000),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: stripeInvoices.stripeInvoiceId,
            set: {
              status: invoice.status || "draft",
              amountDue: invoice.amount_due,
              amountPaid: invoice.amount_paid,
              amountRemaining: invoice.amount_remaining,
              paidAt: invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000)
                : null,
              hostedInvoiceUrl: invoice.hosted_invoice_url || null,
              invoicePdf: invoice.invoice_pdf || null,
              metadata: invoice.metadata,
              updatedAt: new Date(),
            },
          });

        result.synced.invoices++;
      }
    } catch (error: any) {
      logger.error(`Failed to sync invoices:`, error);
      result.errors.push({
        type: "invoices",
        id: customerId,
        error: error.message,
      });
    }
  }

  private async syncProduct(product: Stripe.Product, result: SyncResult): Promise<void> {
    try {
      await db
        .insert(stripeProducts)
        .values({
          stripeProductId: product.id,
          name: product.name,
          description: product.description || null,
          active: product.active,
          metadata: product.metadata,
          createdAt: new Date(product.created * 1000),
          updatedAt: new Date(product.updated * 1000),
        })
        .onConflictDoUpdate({
          target: stripeProducts.stripeProductId,
          set: {
            name: product.name,
            description: product.description || null,
            active: product.active,
            metadata: product.metadata,
            updatedAt: new Date(product.updated * 1000),
          },
        });

      result.synced.products++;
    } catch (error: any) {
      logger.error(`Failed to sync product ${product.id}:`, error);
      result.errors.push({
        type: "product",
        id: product.id,
        error: error.message,
      });
    }
  }

  private async syncPrice(price: Stripe.Price, result: SyncResult): Promise<void> {
    try {
      const productId = typeof price.product === "string" 
        ? price.product 
        : price.product.id;

      await db
        .insert(stripePrices)
        .values({
          stripePriceId: price.id,
          stripeProductId: productId,
          active: price.active,
          currency: price.currency,
          type: price.type,
          unitAmount: price.unit_amount || null,
          recurringInterval: price.recurring?.interval || null,
          recurringIntervalCount: price.recurring?.interval_count || null,
          metadata: price.metadata,
          createdAt: new Date(price.created * 1000),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stripePrices.stripePriceId,
          set: {
            active: price.active,
            metadata: price.metadata,
            updatedAt: new Date(),
          },
        });

      result.synced.prices++;
    } catch (error: any) {
      logger.error(`Failed to sync price ${price.id}:`, error);
      result.errors.push({
        type: "price",
        id: price.id,
        error: error.message,
      });
    }
  }

  private async syncAllProducts(result: SyncResult): Promise<void> {
    try {
      const products = await this.stripe.products.list({
        active: true,
        limit: 100,
      });

      for (const product of products.data) {
        await this.syncProduct(product, result);
      }

      const prices = await this.stripe.prices.list({
        active: true,
        limit: 100,
      });

      for (const price of prices.data) {
        await this.syncPrice(price, result);
      }
    } catch (error: any) {
      logger.error("Failed to sync all products:", error);
      result.errors.push({
        type: "all_products",
        error: error.message,
      });
    }
  }
}