import type { 
  Message, 
  SendResult, 
  BatchSendResult,
  EmailMessage,
  SmsMessage,
  WhatsAppMessage,
  CommunicationChannel,
  EmailProvider,
  SmsProvider,
  WhatsAppProvider,
  ProviderConfig,
  NotificationPreferences
} from "./types/communication";
import { BaseProvider } from "./providers/base-provider";
import { ResendProvider } from "./providers/email/resend-provider";
import { SendGridProvider } from "./providers/email/sendgrid-provider";
import { TwilioSmsProvider } from "./providers/sms/twilio-provider";
import { TwilioWhatsAppProvider } from "./providers/whatsapp/twilio-whatsapp-provider";
import { QueueManager, MessageProvider } from "./queue/queue-manager";
import { TemplateManager, TemplateStore } from "./templates/template-manager";
import { WebhookHandler } from "./webhooks/webhook-handler";

export interface CommunicationManagerConfig {
  providers?: {
    email?: {
      default?: EmailProvider;
      configs: Record<EmailProvider, ProviderConfig>;
    };
    sms?: {
      default?: SmsProvider;
      configs: Record<SmsProvider, ProviderConfig>;
    };
    whatsapp?: {
      default?: WhatsAppProvider;
      configs: Record<WhatsAppProvider, ProviderConfig>;
    };
  };
  queue?: {
    enabled: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
  };
  templates?: {
    enabled: boolean;
    store?: TemplateStore;
  };
  webhooks?: {
    enabled: boolean;
  };
}

export class CommunicationManager implements MessageProvider {
  private providers: Map<string, BaseProvider> = new Map();
  private config: CommunicationManagerConfig;
  private queueManager?: QueueManager;
  private templateManager?: TemplateManager;
  private webhookHandlers: Map<string, WebhookHandler> = new Map();

  constructor(config: CommunicationManagerConfig) {
    this.config = config;
    this.initializeProviders();
    this.initializeQueue();
    this.initializeTemplates();
  }

  private initializeProviders(): void {
    // Initialize email providers
    if (this.config.providers?.email) {
      const emailConfigs = this.config.providers.email.configs;
      
      if (emailConfigs.resend) {
        this.providers.set("email:resend", new ResendProvider(emailConfigs.resend));
      }
      
      if (emailConfigs.sendgrid) {
        this.providers.set("email:sendgrid", new SendGridProvider(emailConfigs.sendgrid));
      }
    }

    // Initialize SMS providers
    if (this.config.providers?.sms) {
      const smsConfigs = this.config.providers.sms.configs;
      
      if (smsConfigs.twilio) {
        this.providers.set("sms:twilio", new TwilioSmsProvider(smsConfigs.twilio));
      }
    }

    // Initialize WhatsApp providers
    if (this.config.providers?.whatsapp) {
      const whatsappConfigs = this.config.providers.whatsapp.configs;
      
      if (whatsappConfigs.twilio) {
        this.providers.set("whatsapp:twilio", new TwilioWhatsAppProvider(whatsappConfigs.twilio));
      }
    }
  }

  private initializeQueue(): void {
    if (this.config.queue?.enabled && this.config.queue.redis) {
      this.queueManager = new QueueManager(
        {
          redis: this.config.queue.redis,
          maxConcurrency: 10,
        },
        this
      );
    }
  }

  private initializeTemplates(): void {
    if (this.config.templates?.enabled && this.config.templates.store) {
      this.templateManager = new TemplateManager(this.config.templates.store);
    }
  }

  getProvider(channel: string, provider?: string): BaseProvider | null {
    if (provider) {
      const key = `${channel}:${provider}`;
      return this.providers.get(key) || null;
    }

    // Get default provider for channel
    const defaultProvider = this.getDefaultProvider(channel as CommunicationChannel);
    if (defaultProvider) {
      const key = `${channel}:${defaultProvider}`;
      return this.providers.get(key) || null;
    }

    // Get first available provider for channel
    for (const [key, prov] of this.providers) {
      if (key.startsWith(`${channel}:`)) {
        return prov;
      }
    }

    return null;
  }

  private getDefaultProvider(channel: CommunicationChannel): string | undefined {
    switch (channel) {
      case "email":
        return this.config.providers?.email?.default;
      case "sms":
        return this.config.providers?.sms?.default;
      case "whatsapp":
        return this.config.providers?.whatsapp?.default;
      default:
        return undefined;
    }
  }

  async send(message: Message, options?: { queue?: boolean }): Promise<SendResult> {
    // Use queue if enabled and requested
    if (this.queueManager && (options?.queue || message.scheduledAt)) {
      const job = await this.queueManager.enqueue(message);
      return {
        success: true,
        messageId: job.id?.toString(),
        provider: "queue",
        timestamp: new Date(),
        details: { queued: true, jobId: job.id },
      };
    }

    // Apply template if specified
    if (message.templateId && this.templateManager) {
      message = await this.templateManager.applyTemplate(
        message.templateId,
        message,
        message.templateData || {}
      );
    }

    // Get provider
    const provider = this.getProvider(message.channel, (message as any).provider);
    if (!provider) {
      return {
        success: false,
        provider: "none",
        error: new Error(`No provider available for channel: ${message.channel}`),
        timestamp: new Date(),
      };
    }

    // Send message
    return provider.send(message as any);
  }

  async sendBatch(
    messages: Message[],
    options?: { queue?: boolean }
  ): Promise<BatchSendResult> {
    const results = await Promise.all(
      messages.map(msg => this.send(msg, options))
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      successful,
      failed,
      total: results.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  async sendToUser(
    userId: string,
    message: Partial<Message>,
    preferences?: NotificationPreferences
  ): Promise<SendResult[]> {
    if (!preferences) {
      throw new Error("User preferences required for sendToUser");
    }

    const results: SendResult[] = [];

    // Check quiet hours
    if (preferences.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      if (currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end) {
        // Schedule for after quiet hours
        const [endHour, endMinute] = preferences.quietHours.end.split(":").map(Number);
        const scheduledAt = new Date();
        scheduledAt.setHours(endHour, endMinute, 0, 0);
        
        if (scheduledAt < now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
        
        message.scheduledAt = scheduledAt;
      }
    }

    // Send to enabled channels
    for (const [channel, preference] of Object.entries(preferences.channels)) {
      if (preference?.enabled && preference.address) {
        const channelMessage: Message = {
          ...message,
          channel: channel as CommunicationChannel,
          recipient: preference.address,
        } as Message;

        const result = await this.send(channelMessage);
        results.push(result);
      }
    }

    return results;
  }

  registerWebhookHandler(
    provider: string,
    handler: WebhookHandler
  ): void {
    this.webhookHandlers.set(provider, handler);
  }

  getWebhookHandler(provider: string): WebhookHandler | undefined {
    return this.webhookHandlers.get(provider);
  }

  async handleWebhook(
    provider: string,
    headers: Record<string, string>,
    body: any,
    rawBody?: string | Buffer
  ): Promise<void> {
    const handler = this.webhookHandlers.get(provider);
    if (!handler) {
      throw new Error(`No webhook handler registered for provider: ${provider}`);
    }

    await handler.handle(headers, body, rawBody);
  }

  async getProviderStatus(
    channel: CommunicationChannel,
    provider?: string
  ): Promise<{ available: boolean; provider: string | null }> {
    const prov = this.getProvider(channel, provider);
    if (!prov) {
      return { available: false, provider: null };
    }

    const available = await prov.isAvailable();
    return { available, provider: prov.getName() };
  }

  async testProvider(
    channel: CommunicationChannel,
    provider?: string
  ): Promise<boolean> {
    const prov = this.getProvider(channel, provider);
    return prov ? prov.isAvailable() : false;
  }

  getTemplateManager(): TemplateManager | undefined {
    return this.templateManager;
  }

  getQueueManager(): QueueManager | undefined {
    return this.queueManager;
  }

  async shutdown(): Promise<void> {
    if (this.queueManager) {
      await this.queueManager.close();
    }
  }
}