import twilio from "twilio";
import { BaseProvider } from "../base-provider";
import type { WhatsAppMessage, SendResult } from "../../types/communication";
import { whatsappMessageSchema } from "../../types/communication";

export class TwilioWhatsAppProvider extends BaseProvider<WhatsAppMessage> {
  private client: twilio.Twilio;

  protected initialize(): void {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error("Twilio Account SID and Auth Token are required");
    }
    
    this.client = twilio(this.config.accountSid, this.config.authToken);
  }

  async send(message: WhatsAppMessage): Promise<SendResult> {
    try {
      // Validate message
      if (!this.validate(message)) {
        throw new Error("Invalid WhatsApp message");
      }

      // Prepare recipients
      const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
      
      // Format phone numbers for WhatsApp (add whatsapp: prefix)
      const formattedRecipients = recipients.map(phone => 
        phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`
      );

      const from = message.from || this.config.from;
      const formattedFrom = from?.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

      // Send to each recipient
      const results = await Promise.all(
        formattedRecipients.map(async (to) => {
          try {
            const messageData: any = {
              to,
              from: formattedFrom,
            };

            // Handle template messages
            if (message.templateName) {
              // Twilio WhatsApp templates use content SID
              messageData.contentSid = message.templateName;
              
              // Add template variables if provided
              if (message.templateData) {
                messageData.contentVariables = JSON.stringify(message.templateData);
              }
            } else if (message.body) {
              // Regular text message
              messageData.body = message.body;
            }

            // Handle media
            if (message.mediaUrl) {
              messageData.mediaUrl = [message.mediaUrl];
            }

            // Handle interactive buttons (Twilio uses persistent actions)
            if (message.buttons && message.buttons.length > 0) {
              const persistentAction = {
                actions: message.buttons.map(button => {
                  if (button.type === "reply") {
                    return {
                      type: "reply",
                      reply: {
                        id: button.payload || button.text.toLowerCase().replace(/\s/g, "_"),
                        title: button.text,
                      },
                    };
                  } else if (button.type === "url") {
                    return {
                      type: "url",
                      url: {
                        displayText: button.text,
                        url: button.url,
                      },
                    };
                  } else if (button.type === "call") {
                    return {
                      type: "phone_number",
                      phone_number: {
                        displayText: button.text,
                        phone_number: button.phoneNumber,
                      },
                    };
                  }
                  return null;
                }).filter(Boolean),
              };

              messageData.persistentAction = JSON.stringify(persistentAction);
            }

            // Handle scheduled sending
            if (message.scheduledAt) {
              messageData.sendAt = message.scheduledAt.toISOString();
              messageData.scheduleType = "fixed";
            }

            this.debug("Sending WhatsApp message via Twilio", { to, from: formattedFrom });
            
            const response = await this.client.messages.create(messageData);
            
            return {
              success: true,
              messageId: response.sid,
              provider: "twilio-whatsapp",
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
              provider: "twilio-whatsapp",
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
        provider: "twilio-whatsapp",
        timestamp: new Date(),
        details: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          results,
        },
      };
    } catch (error) {
      this.debug("Failed to send WhatsApp message", error);
      
      return {
        success: false,
        provider: "twilio-whatsapp",
        error: this.formatError(error),
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(messages: WhatsAppMessage[]): Promise<SendResult[]> {
    // Twilio doesn't have native batch support for WhatsApp
    // Use parallel sending for better performance
    return Promise.all(messages.map(msg => this.send(msg)));
  }

  validate(message: WhatsAppMessage): boolean {
    try {
      whatsappMessageSchema.parse(message);
      
      // Additional validation
      if (!message.body && !message.templateName) {
        console.error("WhatsApp message must have either body or templateName");
        return false;
      }

      // Validate phone number format
      const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
      for (const recipient of recipients) {
        // Remove whatsapp: prefix if present for validation
        const phone = recipient.replace(/^whatsapp:/, "");
        // Basic phone number validation (starts with + and has digits)
        if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-()]/g, ""))) {
          console.error(`Invalid WhatsApp phone number format: ${recipient}`);
          return false;
        }
      }
      
      // Validate buttons
      if (message.buttons && message.buttons.length > 3) {
        console.error("WhatsApp messages can have maximum 3 buttons");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("WhatsApp message validation failed:", error);
      return false;
    }
  }

  getName(): string {
    return "Twilio WhatsApp";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the connection by fetching account info
      const account = await this.client.api.accounts(this.config.accountSid!).fetch();
      
      // Check if WhatsApp is enabled (requires approved WhatsApp sender)
      if (this.config.sandbox) {
        // In sandbox mode, just check if account is active
        return account.status === "active";
      }
      
      // In production, verify WhatsApp sender exists
      const senders = await this.client.messaging.v1
        .services("MG" + this.config.accountSid?.substring(2))
        .phoneNumbers
        .list({ limit: 1 });
      
      return senders.length > 0;
    } catch {
      return false;
    }
  }
}