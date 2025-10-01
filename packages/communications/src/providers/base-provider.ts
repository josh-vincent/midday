import type { Message, SendResult, ProviderConfig } from "../types/communication";

export abstract class BaseProvider<T extends Message = Message> {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the provider (connect to service, validate credentials, etc.)
   */
  protected abstract initialize(): Promise<void> | void;

  /**
   * Send a message through the provider
   */
  abstract send(message: T): Promise<SendResult>;

  /**
   * Send multiple messages in batch
   */
  async sendBatch(messages: T[]): Promise<SendResult[]> {
    // Default implementation - override for providers that support batch sending
    return Promise.all(messages.map(msg => this.send(msg)));
  }

  /**
   * Validate a message before sending
   */
  abstract validate(message: T): boolean;

  /**
   * Get the provider name
   */
  abstract getName(): string;

  /**
   * Check if the provider is available and configured correctly
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Format error for consistent error handling
   */
  protected formatError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === "string") {
      return new Error(error);
    }
    
    if (error?.message) {
      return new Error(error.message);
    }
    
    return new Error("Unknown error occurred");
  }

  /**
   * Log debug information if in development mode
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${this.getName()}] ${message}`, data || "");
    }
  }
}