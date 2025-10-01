import twilio from "twilio";
import { BaseProvider } from "../base-provider";
import type { SmsMessage, SendResult } from "../../types/communication";
import { smsMessageSchema } from "../../types/communication";

export class TwilioSmsProvider extends BaseProvider<SmsMessage> {
  private client: twilio.Twilio;

  protected initialize(): void {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error("Twilio Account SID and Auth Token are required");
    }
    
    this.client = twilio(this.config.accountSid, this.config.authToken);
  }

  async send(message: SmsMessage): Promise<SendResult> {
    try {
      // Validate message
      if (!this.validate(message)) {
        throw new Error("Invalid SMS message");
      }

      // Prepare recipients
      const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
      
      // Send to each recipient (Twilio doesn't support batch SMS directly)
      const results = await Promise.all(
        recipients.map(async (to) => {
          try {
            const smsData: any = {
              body: message.body,
              to,
              from: message.from || this.config.from,
            };

            // Add media URLs for MMS
            if (message.mediaUrls && message.mediaUrls.length > 0) {
              smsData.mediaUrl = message.mediaUrls;
            }

            // Handle scheduled sending
            if (message.scheduledAt) {
              smsData.sendAt = message.scheduledAt.toISOString();
              smsData.scheduleType = "fixed";
            }

            this.debug("Sending SMS via Twilio", { to, from: smsData.from });
            
            const response = await this.client.messages.create(smsData);
            
            return {
              success: true,
              messageId: response.sid,
              provider: "twilio",
              timestamp: new Date(),
              details: {
                status: response.status,
                price: response.price,
                priceUnit: response.priceUnit,
                direction: response.direction,
                numSegments: response.numSegments,
              },
            };
          } catch (error: any) {
            return {
              success: false,
              provider: "twilio",
              error: this.formatError(error),
              timestamp: new Date(),
              details: error.response?.data,
            };
          }
        })
      );

      // Return the first result for single recipient, or aggregate for multiple
      if (results.length === 1) {
        return results[0];
      }

      // For multiple recipients, return success if at least one succeeded
      const successCount = results.filter(r => r.success).length;
      return {
        success: successCount > 0,
        provider: "twilio",
        timestamp: new Date(),
        details: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          results,
        },
      };
    } catch (error) {
      this.debug("Failed to send SMS", error);
      
      return {
        success: false,
        provider: "twilio",
        error: this.formatError(error),
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(messages: SmsMessage[]): Promise<SendResult[]> {
    // Twilio doesn't have native batch support for SMS
    // Use parallel sending for better performance
    return Promise.all(messages.map(msg => this.send(msg)));
  }

  validate(message: SmsMessage): boolean {
    try {
      smsMessageSchema.parse(message);
      
      // Additional Twilio-specific validation
      if (!message.body || message.body.trim().length === 0) {
        console.error("SMS body cannot be empty");
        return false;
      }
      
      // Check SMS length limits
      if (message.body.length > 1600) {
        console.error("SMS body exceeds maximum length of 1600 characters");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("SMS validation failed:", error);
      return false;
    }
  }

  getName(): string {
    return "Twilio SMS";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the connection by fetching account info
      const account = await this.client.api.accounts(this.config.accountSid!).fetch();
      return account.status === "active";
    } catch {
      return false;
    }
  }
}