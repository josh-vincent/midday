import type { QueueManager } from "@midday/queue";
import { logger } from "@midday/logger";
import type {
  IAccountingProvider,
  AccountingSyncOptions,
  AccountingSyncResult,
  AccountingProvider,
  QuickBooksCredentials,
  XeroCredentials,
} from "./types";
import { QuickBooksProvider } from "./providers/quickbooks";
import { XeroProvider } from "./providers/xero";

/**
 * AccountingSyncManager orchestrates syncing data between accounting platforms
 * and your application database, with support for background job processing.
 */
export class AccountingSyncManager {
  private queueManager?: QueueManager;
  private providers: Map<string, IAccountingProvider> = new Map();

  constructor(queueManager?: QueueManager) {
    this.queueManager = queueManager;
  }

  /**
   * Initialize a provider for a team
   */
  async initializeProvider(
    teamId: string,
    userId: string,
    provider: AccountingProvider,
    credentials: QuickBooksCredentials | XeroCredentials
  ): Promise<void> {
    const key = `${teamId}_${provider}`;

    try {
      const providerInstance = this.createProvider(provider, credentials);
      this.providers.set(key, providerInstance);

      logger.info(`Accounting provider initialized: ${provider} for team ${teamId}`);
    } catch (error: any) {
      logger.error(`Failed to initialize ${provider} provider:`, error);
      throw new Error(`Failed to initialize ${provider}: ${error.message}`);
    }
  }

  /**
   * Get or create provider instance
   */
  getProvider(teamId: string, provider: AccountingProvider): IAccountingProvider {
    const key = `${teamId}_${provider}`;
    const providerInstance = this.providers.get(key);

    if (!providerInstance) {
      throw new Error(`Provider not initialized: ${provider} for team ${teamId}`);
    }

    return providerInstance;
  }

  /**
   * Create provider instance based on type
   */
  private createProvider(
    providerType: AccountingProvider,
    credentials: any
  ): IAccountingProvider {
    switch (providerType) {
      case "quickbooks":
        return new QuickBooksProvider(credentials as QuickBooksCredentials);
      case "xero":
        return new XeroProvider(credentials as XeroCredentials);
      default:
        throw new Error(`Unsupported provider: ${providerType}`);
    }
  }

  /**
   * Sync accounting data with optional queue support
   */
  async syncAll(
    options: AccountingSyncOptions,
    queueSync = true
  ): Promise<AccountingSyncResult | { jobId: string }> {
    const { teamId, userId, provider } = options;

    // If queue is enabled and available, queue the sync job
    if (queueSync && this.queueManager) {
      const job = await this.queueManager.addJob(
        "accounting",
        "accounting.sync",
        {
          id: `accounting_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "accounting.sync",
          timestamp: new Date(),
          teamId,
          userId,
          provider,
          entities: options.entities,
          modifiedSince: options.modifiedSince,
          maxResults: options.maxResults,
          credentials: options.credentials,
        }
      );

      logger.info("Accounting sync queued", { teamId, provider, jobId: job.id });
      return { jobId: job.id! };
    }

    // Otherwise perform sync directly
    return await this.performSync(options);
  }

  /**
   * Perform the actual sync operation
   */
  async performSync(options: AccountingSyncOptions): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      synced: {
        customers: 0,
        invoices: 0,
        payments: 0,
        accounts: 0,
        items: 0,
        vendors: 0,
        bills: 0,
      },
      errors: [],
    };

    const entities = options.entities || [
      "customers",
      "invoices",
      "payments",
      "accounts",
      "items",
      "vendors",
      "bills",
    ];

    logger.info("Starting accounting sync", {
      provider: options.provider,
      teamId: options.teamId,
      entities,
    });

    // Get or create provider
    let provider: IAccountingProvider;
    try {
      provider = this.getProvider(options.teamId, options.provider);
    } catch {
      // Provider not initialized, create it
      provider = this.createProvider(options.provider, options.credentials);
    }

    try {
      for (const entity of entities) {
        try {
          const count = await this.syncEntity(entity, options, provider);
          result.synced[entity] = count;
        } catch (error: any) {
          logger.error(`Failed to sync ${entity}`, { error, entity });
          result.errors.push({
            entity,
            error: error.message || String(error),
          });
          result.success = false;
        }
      }

      result.lastSyncTime = new Date();

      logger.info("Accounting sync completed", {
        provider: options.provider,
        teamId: options.teamId,
        result,
      });

      return result;
    } catch (error: any) {
      logger.error("Accounting sync failed", { error, options });
      result.success = false;
      result.errors.push({
        error: error.message || String(error),
      });
      return result;
    } finally {
      // Cleanup provider if not in providers map
      if (!this.providers.has(`${options.teamId}_${options.provider}`)) {
        await provider.disconnect();
      }
    }
  }

  /**
   * Sync a specific entity type
   */
  private async syncEntity(
    entity: string,
    options: AccountingSyncOptions,
    provider: IAccountingProvider
  ): Promise<number> {
    const syncOptions = {
      modifiedSince: options.modifiedSince,
      maxResults: options.maxResults,
    };

    switch (entity) {
      case "customers":
        return await this.syncCustomers(syncOptions, provider);
      case "invoices":
        return await this.syncInvoices(syncOptions, provider);
      case "payments":
        return await this.syncPayments(syncOptions, provider);
      case "accounts":
        return await this.syncAccounts(provider);
      case "items":
        return await this.syncItems(syncOptions, provider);
      case "vendors":
        return await this.syncVendors(syncOptions, provider);
      case "bills":
        return await this.syncBills(syncOptions, provider);
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private async syncCustomers(options: any, provider: IAccountingProvider): Promise<number> {
    const customers = await provider.getCustomers(options);
    logger.info(`Fetched ${customers.length} customers`);

    // TODO: Save customers to database
    // This would typically involve saving to your @midday/db package
    // For now, we're just counting them

    return customers.length;
  }

  private async syncInvoices(options: any, provider: IAccountingProvider): Promise<number> {
    const invoices = await provider.getInvoices(options);
    logger.info(`Fetched ${invoices.length} invoices`);

    // TODO: Save invoices to database

    return invoices.length;
  }

  private async syncPayments(options: any, provider: IAccountingProvider): Promise<number> {
    const payments = await provider.getPayments(options);
    logger.info(`Fetched ${payments.length} payments`);

    // TODO: Save payments to database

    return payments.length;
  }

  private async syncAccounts(provider: IAccountingProvider): Promise<number> {
    const accounts = await provider.getAccounts();
    logger.info(`Fetched ${accounts.length} accounts`);

    // TODO: Save accounts to database

    return accounts.length;
  }

  private async syncItems(options: any, provider: IAccountingProvider): Promise<number> {
    const items = await provider.getItems(options);
    logger.info(`Fetched ${items.length} items`);

    // TODO: Save items to database

    return items.length;
  }

  private async syncVendors(options: any, provider: IAccountingProvider): Promise<number> {
    const vendors = await provider.getVendors(options);
    logger.info(`Fetched ${vendors.length} vendors`);

    // TODO: Save vendors to database

    return vendors.length;
  }

  private async syncBills(options: any, provider: IAccountingProvider): Promise<number> {
    const bills = await provider.getBills(options);
    logger.info(`Fetched ${bills.length} bills`);

    // TODO: Save bills to database

    return bills.length;
  }

  /**
   * Test the connection to the accounting provider
   */
  async testConnection(
    teamId: string,
    provider: AccountingProvider
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const providerInstance = this.getProvider(teamId, provider);
      const companyInfo = await providerInstance.getCompanyInfo();

      return {
        success: true,
        message: `Successfully connected to ${provider}`,
        data: companyInfo,
      };
    } catch (error: any) {
      logger.error("Connection test failed", { error, provider });
      return {
        success: false,
        message: error.message || "Failed to connect to accounting provider",
      };
    }
  }

  /**
   * Disconnect from all accounting providers
   */
  async disconnectAll(): Promise<void> {
    for (const [key, provider] of this.providers.entries()) {
      try {
        await provider.disconnect();
        logger.info("Disconnected from accounting provider", { key });
      } catch (error) {
        logger.error("Failed to disconnect provider", { key, error });
      }
    }
    this.providers.clear();
  }

  /**
   * Disconnect from a specific provider
   */
  async disconnect(teamId: string, provider: AccountingProvider): Promise<void> {
    const key = `${teamId}_${provider}`;
    const providerInstance = this.providers.get(key);

    if (providerInstance) {
      await providerInstance.disconnect();
      this.providers.delete(key);
      logger.info("Disconnected from accounting provider", { teamId, provider });
    }
  }
}

/**
 * Create a new accounting sync manager instance
 */
export function createAccountingSyncManager(queueManager?: QueueManager): AccountingSyncManager {
  return new AccountingSyncManager(queueManager);
}

/**
 * Helper to sync accounting data for a team (with queue support)
 */
export async function syncTeamAccounting(
  options: AccountingSyncOptions,
  queueManager?: QueueManager
): Promise<AccountingSyncResult | { jobId: string }> {
  const manager = new AccountingSyncManager(queueManager);

  try {
    const result = await manager.syncAll(options, !!queueManager);
    await manager.disconnectAll();
    return result;
  } catch (error: any) {
    logger.error("Team accounting sync failed", { error, teamId: options.teamId });
    await manager.disconnectAll();
    throw error;
  }
}
