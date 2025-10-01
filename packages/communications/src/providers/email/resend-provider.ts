import { Resend } from "resend";
import { BaseProvider } from "../base-provider";
import type { EmailMessage, SendResult, ProviderConfig } from "../../types/communication";
import { emailMessageSchema } from "../../types/communication";

export class ResendProvider extends BaseProvider<EmailMessage> {
  private client: Resend;

  protected initialize(): void {
    if (!this.config.apiKey) {
      throw new Error("Resend API key is required");
    }
    
    this.client = new Resend(this.config.apiKey);
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      // Validate message
      if (!this.validate(message)) {
        throw new Error("Invalid email message");
      }

      // Prepare recipients
      const to = Array.isArray(message.recipient) ? message.recipient : [message.recipient];

      // Prepare email data
      const emailData: any = {
        from: message.from || this.config.from || "noreply@example.com",
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        reply_to: message.replyTo,
        headers: message.headers,
        tags: message.tags?.map(tag => ({ name: tag, value: tag })),
      };

      // Handle attachments
      if (message.attachments && message.attachments.length > 0) {
        emailData.attachments = message.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          content_type: att.contentType,
        }));
      }

      // Send email
      this.debug("Sending email via Resend", { to, subject: message.subject });
      const response = await this.client.emails.send(emailData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        messageId: response.data?.id,
        provider: "resend",
        timestamp: new Date(),
        details: response.data,
      };
    } catch (error) {
      this.debug("Failed to send email", error);
      
      return {
        success: false,
        provider: "resend",
        error: this.formatError(error),
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    // Resend supports batch sending
    try {
      const batchData = messages.map(message => {
        const to = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
        
        return {
          from: message.from || this.config.from || "noreply@example.com",
          to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          cc: message.cc,
          bcc: message.bcc,
          reply_to: message.replyTo,
          headers: message.headers,
        };
      });

      const response = await this.client.batch.send(batchData as any);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return (response.data || []).map((item: any) => ({
        success: true,
        messageId: item.id,
        provider: "resend",
        timestamp: new Date(),
        details: item,
      }));
    } catch (error) {
      // Fallback to individual sending
      return super.sendBatch(messages);
    }
  }

  validate(message: EmailMessage): boolean {
    try {
      emailMessageSchema.parse(message);
      
      // Additional validation
      if (!message.html && !message.text && !message.templateId) {
        console.error("Email must have either html, text, or templateId");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Email validation failed:", error);
      return false;
    }
  }

  getName(): string {
    return "Resend";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the connection by getting domains
      const response = await this.client.domains.list();
      return !response.error;
    } catch {
      return false;
    }
  }
}