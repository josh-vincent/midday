import { QueueManager } from "@midday/queue";
import { logger } from "@midday/logger";
import { GmailProvider } from "./providers/gmail";
import { OutlookProvider } from "./providers/outlook";
import type {
  EmailMessage,
  EmailSyncOptions,
  EmailSyncResult,
  EmailSearchOptions,
  EmailFolder,
  EmailThread,
  EmailBatchOperation,
  EmailWatchOptions,
  GmailCredentials,
  OutlookCredentials,
} from "./types";

export class EmailSyncManager {
  private queueManager?: QueueManager;
  private providers: Map<string, GmailProvider | OutlookProvider> = new Map();

  constructor(queueManager?: QueueManager) {
    this.queueManager = queueManager;
  }

  async initializeProvider(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    credentials: GmailCredentials | OutlookCredentials
  ): Promise<void> {
    const key = `${teamId}_${userId}_${provider}`;
    
    try {
      if (provider === "gmail") {
        this.providers.set(key, new GmailProvider(credentials as GmailCredentials));
      } else if (provider === "outlook") {
        this.providers.set(key, new OutlookProvider(credentials as OutlookCredentials));
      }
      
      logger.info(`Email provider initialized: ${provider} for team ${teamId}, user ${userId}`);
    } catch (error: any) {
      logger.error(`Failed to initialize ${provider} provider:`, error);
      throw new Error(`Failed to initialize ${provider}: ${error.message}`);
    }
  }

  getProvider(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook"
  ): GmailProvider | OutlookProvider {
    const key = `${teamId}_${userId}_${provider}`;
    const providerInstance = this.providers.get(key);
    
    if (!providerInstance) {
      throw new Error(`Provider not initialized: ${provider} for team ${teamId}, user ${userId}`);
    }
    
    return providerInstance;
  }

  async sendEmail(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    message: EmailMessage,
    queueDelivery = false
  ): Promise<{ messageId: string; queued?: boolean }> {
    if (queueDelivery && this.queueManager) {
      await this.queueManager.addJob(
        "emails",
        "email.send",
        {
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "email.send",
          timestamp: new Date(),
          teamId,
          userId,
          provider,
          message,
        }
      );
      
      logger.info("Email queued for delivery", { teamId, userId, provider });
      return { messageId: "queued", queued: true };
    }

    const providerInstance = this.getProvider(teamId, userId, provider);
    return await providerInstance.sendEmail(message);
  }

  async syncEmails(
    options: EmailSyncOptions,
    queueSync = true
  ): Promise<EmailSyncResult | { jobId: string }> {
    const { teamId, userId, provider } = options;

    if (queueSync && this.queueManager) {
      const job = await this.queueManager.addJob(
        "email-sync",
        "email.sync",
        {
          id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "email.sync",
          timestamp: new Date(),
          ...options,
        }
      );
      
      logger.info("Email sync queued", { 
        teamId, 
        userId, 
        provider, 
        jobId: job.id 
      });
      
      return { jobId: job.id! };
    }

    const providerInstance = this.getProvider(teamId, userId, provider);
    const result = await providerInstance.syncEmails(options);
    
    await this.saveSync(teamId, userId, provider, result);
    
    return result;
  }

  async searchEmails(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    options: EmailSearchOptions
  ): Promise<EmailMessage[]> {
    const providerInstance = this.getProvider(teamId, userId, provider);
    return await providerInstance.searchEmails(options);
  }

  async getFolders(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook"
  ): Promise<EmailFolder[]> {
    const providerInstance = this.getProvider(teamId, userId, provider);
    return await providerInstance.getFolders();
  }

  async getThreads(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    maxResults = 50
  ): Promise<EmailThread[]> {
    const providerInstance = this.getProvider(teamId, userId, provider);
    return await providerInstance.getThreads(maxResults);
  }

  async batchOperation(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    operation: EmailBatchOperation,
    queue = false
  ): Promise<void> {
    if (queue && this.queueManager) {
      await this.queueManager.addJob(
        "email-operations",
        "email.batch",
        {
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "email.batch" as any,
          timestamp: new Date(),
          teamId,
          userId,
          provider,
          operation,
        }
      );
      
      logger.info("Batch operation queued", { 
        teamId, 
        userId, 
        provider, 
        operation: operation.operation 
      });
      return;
    }

    const providerInstance = this.getProvider(teamId, userId, provider);
    await providerInstance.batchOperation(operation);
  }

  async setupWebhook(
    options: EmailWatchOptions
  ): Promise<{ watchId: string; expiration: number }> {
    const { provider, teamId, userId, credentials } = options;
    
    await this.initializeProvider(teamId, userId, provider, credentials);
    const providerInstance = this.getProvider(teamId, userId, provider);
    
    const result = await providerInstance.watchEmails(options);
    
    if (this.queueManager) {
      await this.queueManager.addJob(
        "webhooks",
        "webhook.register",
        {
          id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "webhook.register" as any,
          timestamp: new Date(),
          provider,
          teamId,
          userId,
          watchData: result,
          expirationTime: result.expiration || 
            (result as any).historyId ? (result as any).expiration : 0,
        }
      );
    }
    
    return {
      watchId: (result as any).subscriptionId || (result as any).historyId,
      expiration: result.expiration || (result as any).expiration,
    };
  }

  async stopWebhook(
    teamId: string,
    userId: string,
    provider: "gmail" | "outlook",
    watchId?: string
  ): Promise<void> {
    const providerInstance = this.getProvider(teamId, userId, provider);
    
    if (provider === "gmail") {
      await (providerInstance as GmailProvider).stopWatch();
    } else if (provider === "outlook" && watchId) {
      await (providerInstance as OutlookProvider).stopWatch(watchId);
    }
    
    logger.info(`Email webhook stopped for ${provider}`, { teamId, userId });
  }

  async processWebhook(
    provider: "gmail" | "outlook",
    payload: any,
    signature?: string
  ): Promise<void> {
    if (this.queueManager) {
      await this.queueManager.addJob(
        "webhooks",
        "webhook.process",
        {
          id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "webhook.process",
          timestamp: new Date(),
          provider,
          eventId: payload.id || payload.message?.id,
          eventType: `${provider}.message`,
          payload,
          signature,
        }
      );
      
      logger.info(`Email webhook queued for processing: ${provider}`);
    }
  }

  private async saveSync(
    teamId: string,
    userId: string,
    provider: string,
    result: EmailSyncResult
  ): Promise<void> {
    logger.info("Email sync completed", {
      teamId,
      userId,
      provider,
      synced: result.synced,
      errors: result.errors.length,
    });
  }

  async cleanupProviders(): Promise<void> {
    this.providers.clear();
    logger.info("All email providers cleaned up");
  }
}