import { syncQuickBooksEntitySchema } from "@jobs/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { createClient } from "@midday/supabase/job";
import { QuickBooksProvider } from "@midday/accounting-providers";
import { refreshTokenIfNeeded } from "../../oauth/shared-token-refresh";
import { upsertSyncedEntity } from "@midday/db/queries";
import { createClient as createDbClient } from "@midday/db/client";

// This task syncs specific entities from QuickBooks based on webhook events
export const syncQuickBooksEntity = schemaTask({
  id: "sync-quickbooks-entity",
  schema: syncQuickBooksEntitySchema,
  maxDuration: 180, // 3 minutes
  queue: {
    concurrencyLimit: 20,
  },
  run: async (payload) => {
    const {
      integrationId,
      tenantId,
      entityType,
      entityId,
      operation,
      realmId,
      lastUpdated,
    } = payload;

    logger.info("Starting QuickBooks sync", {
      integrationId,
      tenantId,
      entityType,
      entityId,
      operation,
    });

    const supabase = createClient();
    const db = createDbClient();

    try {
      // Get the integration details
      logger.info("Fetching integration from apps table", { integrationId });
      const { data: integration, error: integrationError } = await supabase
        .from("apps")
        .select("*")
        .eq("id", integrationId)
        .single();

      if (integrationError || !integration) {
        logger.error("Integration not found", { integrationId, error: integrationError });
        throw new Error(`Integration not found: ${integrationId}`);
      }

      const config =
        typeof integration.config === "string"
          ? JSON.parse(integration.config)
          : integration.config;

      logger.info("Tokens extracted", {
        hasAccessToken: !!config.access_token,
        hasRealmId: !!config.realm_id,
      });

      if (!config.access_token || !config.realm_id) {
        throw new Error("Missing QuickBooks access token or realm ID");
      }

      // Refresh tokens if needed using shared OAuth logic
      const updatedConfig = await refreshTokenIfNeeded(
        config,
        "quickbooks",
        integrationId,
      );

      // Initialize QuickBooks provider with current tokens
      logger.info("Creating QuickBooks provider", {
        realmId: updatedConfig.realm_id,
      });

      const qbProvider = new QuickBooksProvider({
        clientId: process.env.QUICKBOOKS_CLIENT_ID || "",
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
        accessToken: updatedConfig.access_token,
        refreshToken: updatedConfig.refresh_token,
        realmId: updatedConfig.realm_id,
        expiryDate: new Date(updatedConfig.connected_at).getTime() + updatedConfig.expires_in * 1000,
        environment: process.env.QUICKBOOKS_SANDBOX === "true" ? "sandbox" : "production",
      });

      let syncResult;
      let syncedCount = 0;

      logger.info("Starting entity sync", { entityType, entityId, operation });

      // Handle different entity types and operations
      try {
        switch (entityType) {
          case "customer": {
            if (entityId === "all") {
              const customers = await qbProvider.getCustomers();
              for (const customer of customers) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "customers",
                  externalId: customer.externalId || customer.id || "",
                  entityData: customer,
                });
                syncedCount++;
              }
            } else {
              const customer = await qbProvider.getCustomer(entityId);
              if (customer) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "customers",
                  externalId: customer.externalId || customer.id || "",
                  entityData: customer,
                });
                syncedCount = 1;
              }
            }
            break;
          }

          case "invoice": {
            if (entityId === "all") {
              const invoices = await qbProvider.getInvoices();
              for (const invoice of invoices) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "invoices",
                  externalId: invoice.externalId || invoice.id || "",
                  entityData: invoice,
                });
                syncedCount++;
              }
            } else {
              const invoice = await qbProvider.getInvoice(entityId);
              if (invoice) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "invoices",
                  externalId: invoice.externalId || invoice.id || "",
                  entityData: invoice,
                });
                syncedCount = 1;
              }
            }
            break;
          }

          case "payment": {
            if (entityId === "all") {
              const payments = await qbProvider.getPayments();
              for (const payment of payments) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "payments",
                  externalId: payment.externalId || payment.id || "",
                  entityData: payment,
                });
                syncedCount++;
              }
            } else {
              const payment = await qbProvider.getPayment(entityId);
              if (payment) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "payments",
                  externalId: payment.externalId || payment.id || "",
                  entityData: payment,
                });
                syncedCount = 1;
              }
            }
            break;
          }

          case "item": {
            if (entityId === "all") {
              const items = await qbProvider.getItems();
              for (const item of items) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "items",
                  externalId: item.externalId || item.id || "",
                  entityData: item,
                });
                syncedCount++;
              }
            } else {
              const item = await qbProvider.getItem(entityId);
              if (item) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "items",
                  externalId: item.externalId || item.id || "",
                  entityData: item,
                });
                syncedCount = 1;
              }
            }
            break;
          }

          case "vendor": {
            if (entityId === "all") {
              const vendors = await qbProvider.getVendors();
              for (const vendor of vendors) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "vendors",
                  externalId: vendor.externalId || vendor.id || "",
                  entityData: vendor,
                });
                syncedCount++;
              }
            } else {
              const vendor = await qbProvider.getVendor(entityId);
              if (vendor) {
                await upsertSyncedEntity(db, {
                  connectionId: integrationId,
                  teamId: tenantId,
                  entityType: "vendors",
                  externalId: vendor.externalId || vendor.id || "",
                  entityData: vendor,
                });
                syncedCount = 1;
              }
            }
            break;
          }

          case "account": {
            const accounts = await qbProvider.getAccounts();
            for (const account of accounts) {
              await upsertSyncedEntity(db, {
                connectionId: integrationId,
                teamId: tenantId,
                entityType: "accounts",
                externalId: account.externalId || account.id || "",
                entityData: account,
              });
              syncedCount++;
            }
            break;
          }

          default:
            logger.error("Unsupported entity type", { entityType });
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        syncResult = {
          entityType,
          syncedCount,
          lastUpdated: new Date().toISOString(),
        };

        logger.info("Entity sync completed", { syncResult });

        // Update integration's last sync timestamp
        await supabase
          .from("apps")
          .update({
            config: {
              ...updatedConfig,
              last_sync_at: new Date().toISOString(),
              sync_status: "connected",
            },
          })
          .eq("id", integrationId);

        // Cleanup
        await qbProvider.disconnect();

        return {
          success: true,
          entityType,
          entityId,
          operation,
          syncResult,
        };
      } catch (syncError) {
        // Cleanup on error
        await qbProvider.disconnect();
        throw syncError;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("QuickBooks sync error", {
        error: errorMessage,
        integrationId,
        entityType,
      });

      // Update integration with error status
      try {
        const { data: integration } = await supabase
          .from("apps")
          .select("config")
          .eq("id", integrationId)
          .single();

        if (integration) {
          const config =
            typeof integration.config === "string"
              ? JSON.parse(integration.config)
              : integration.config;

          await supabase
            .from("apps")
            .update({
              config: {
                ...config,
                sync_status: "error",
                last_error: errorMessage,
                last_error_at: new Date().toISOString(),
              },
            })
            .eq("id", integrationId);
        }
      } catch (updateError) {
        logger.error("Failed to update integration error status", {
          error: updateError,
        });
      }

      throw error;
    }
  },
});
