import { getBillingOrdersSchema } from "@api/schemas/billing";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { api } from "@api/utils/polar";
import { z } from "zod";

export const billingRouter = createTRPCRouter({
  orders: protectedProcedure
    .input(getBillingOrdersSchema)
    .query(async ({ input, ctx: { teamId } }) => {
      try {
        const customer = await api.customers.getExternal({
          externalId: teamId!,
        });

        const ordersResult = await api.orders.list({
          customerId: customer.id,
          page: input.cursor ? Number(input.cursor) : 1,
          limit: input.pageSize,
        });

        const orders = ordersResult.result.items;
        const pagination = ordersResult.result.pagination;

        // Filter orders to only include those where metadata.teamId matches teamId
        const filteredOrders = orders.filter((order) => {
          const organizationId = order.metadata?.teamId;
          return organizationId === teamId;
        });

        return {
          data: filteredOrders.map((order) => ({
            id: order.id,
            createdAt: order.createdAt,
            amount: {
              amount: order.totalAmount,
              currency: order.currency,
            },
            status: order.status,
            product: {
              name: order.product.name,
            },
            invoiceId: order.isInvoiceGenerated ? order.id : null,
          })),
          meta: {
            hasNextPage:
              (input.cursor ? Number(input.cursor) : 1) < pagination.maxPage,
            cursor:
              (input.cursor ? Number(input.cursor) : 1) < pagination.maxPage
                ? ((input.cursor ? Number(input.cursor) : 1) + 1).toString()
                : undefined,
          },
        };
      } catch (error) {
        console.error("Failed to fetch billing orders:", error);
        return {
          data: [],
          meta: {
            hasNextPage: false,
            cursor: undefined,
          },
        };
      }
    }),

  getInvoice: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx: { teamId } }) => {
      try {
        const order = await api.orders.get({
          id: orderId,
        });

        // Verify the order belongs to the team's customer
        if (order.customer.externalId !== teamId) {
          throw new Error("Order not found or not authorized");
        }

        // If invoice doesn't exist, generate it
        if (!order.isInvoiceGenerated) {
          await api.orders.generateInvoice({
            id: orderId,
          });

          // Return status indicating generation is in progress
          return {
            status: "generating",
          };
        }

        // Try to get the invoice
        try {
          const invoice = await api.orders.invoice({
            id: orderId,
          });

          return {
            status: "ready",
            downloadUrl: invoice.url,
          };
        } catch (invoiceError) {
          // Invoice might still be generating
          return {
            status: "generating",
          };
        }
      } catch (error) {
        console.error("Failed to get invoice download URL:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to download invoice",
        );
      }
    }),

  checkInvoiceStatus: protectedProcedure
    .input(z.string())
    .query(async ({ input: orderId, ctx: { teamId } }) => {
      try {
        const order = await api.orders.get({
          id: orderId,
        });

        // Verify the order belongs to the team's customer
        if (order.customer.externalId !== teamId) {
          throw new Error("Order not found or not authorized");
        }

        if (!order.isInvoiceGenerated) {
          return {
            status: "not_generated",
          };
        }

        try {
          const invoice = await api.orders.invoice({
            id: orderId,
          });

          return {
            status: "ready",
            downloadUrl: invoice.url,
          };
        } catch (invoiceError) {
          return {
            status: "generating",
          };
        }
      } catch (error) {
        console.error("Failed to check invoice status:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to check invoice status",
        );
      }
    }),

  getProducts: protectedProcedure.query(async () => {
    try {
      const products = await api.products.list({
        isArchived: false,
        limit: 100,
      });

      // Filter for products with metered (usage-based) pricing
      const meteredProducts = products.result.items.filter((product) =>
        product.prices.some((price) => price.type === "recurring")
      );

      // Log all products for debugging
      console.log("All products:", products.result.items.map(p => ({
        id: p.id,
        name: p.name,
        prices: p.prices.map(pr => ({ type: pr.type, id: pr.id }))
      })));

      return meteredProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        prices: product.prices.map((price) => ({
          id: price.id,
          amount: price.priceAmount,
          currency: price.priceCurrency,
          recurringInterval: price.recurringInterval,
          type: price.type,
        })),
      }));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      return [];
    }
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        successUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx: { teamId, user } }) => {
      try {
        if (!teamId) {
          throw new Error("No team ID found");
        }

        console.log("Creating checkout with params:", {
          productId: input.productId,
          teamId,
          userId: user?.id,
        });

        // Build metadata object, only including userId if it exists
        const metadata: Record<string, string | number | boolean> = {
          teamId: teamId,
        };
        if (user?.id) {
          metadata.userId = user.id;
        }

        // Create a checkout session with the customer's external ID
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3333';
        const checkout = await api.checkouts.create({
          products: [input.productId],
          successUrl: input.successUrl || `${dashboardUrl}/settings/billing`,
          externalCustomerId: teamId,
          customerEmail: user?.email || undefined,
          metadata,
          customerMetadata: {
            externalId: teamId,
          },
        });

        console.log("Checkout created successfully:", checkout.id);

        return {
          url: checkout.url,
        };
      } catch (error) {
        console.error("Failed to create checkout - Full error:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
        );
      }
    }),

  getSubscriptions: protectedProcedure.query(async ({ ctx: { teamId } }) => {
    try {
      if (!teamId) {
        console.log("No teamId provided for subscriptions");
        return [];
      }

      console.log("Fetching customer with externalId:", teamId);
      const customer = await api.customers.getExternal({
        externalId: teamId,
      });

      console.log("Customer found:", customer.id);

      const subscriptions = await api.subscriptions.list({
        customerId: customer.id,
        limit: 100,
      });

      console.log("Subscriptions found:", subscriptions.result.items.length);

      return subscriptions.result.items.map((subscription) => ({
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        product: {
          name: subscription.product.name,
        },
        price: {
          amount: subscription.price.priceAmount,
          currency: subscription.price.priceCurrency,
          recurringInterval: subscription.price.recurringInterval,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch subscriptions for teamId", teamId, ":", error.message || error);
      return [];
    }
  }),

  getCustomerPortalUrl: protectedProcedure
    .input(z.void().optional())
    .mutation(async ({ ctx: { teamId } }) => {
      try {
        if (!teamId) {
          throw new Error("No team ID found");
        }

        const customer = await api.customers.getExternal({
          externalId: teamId,
        });

        const session = await api.customerSessions.create({
          customerId: customer.id,
        });

        return {
          url: session.customerPortalUrl,
        };
      } catch (error) {
        console.error("Failed to create customer portal session:", error);

        // Check if it's a customer not found error
        const errorMessage = error instanceof Error ? error.message : "";
        if (
          errorMessage.includes("404") ||
          errorMessage.includes("ResourceNotFound") ||
          errorMessage.includes("Not found")
        ) {
          throw new Error(
            "No billing account found. Please make a purchase first to access the customer portal.",
          );
        }

        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to create customer portal session",
        );
      }
    }),
});
