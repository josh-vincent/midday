import sgMail from "@sendgrid/mail";
import { BaseProvider } from "../base-provider";
import type { EmailMessage, SendResult, ProviderConfig } from "../../types/communication";
import { emailMessageSchema } from "../../types/communication";

export class SendGridProvider extends BaseProvider<EmailMessage> {
  protected initialize(): void {
    if (!this.config.apiKey) {
      throw new Error("SendGrid API key is required");
    }
    
    sgMail.setApiKey(this.config.apiKey);
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
        to,
        from: {
          email: message.from || this.config.from || "noreply@example.com",
          name: message.fromName || this.config.fromName,
        },
        subject: message.subject,
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        replyTo: message.replyTo,
        headers: message.headers,
        categories: message.tags,
        sendAt: message.scheduledAt ? Math.floor(message.scheduledAt.getTime() / 1000) : undefined,
      };

      // Handle template
      if (message.templateId) {
        emailData.templateId = message.templateId;
        emailData.dynamicTemplateData = message.templateData;
      }

      // Handle attachments
      if (message.attachments && message.attachments.length > 0) {
        emailData.attachments = message.attachments.map(att => ({
          filename: att.filename,
          content: att.content ? Buffer.from(att.content).toString("base64") : undefined,
          type: att.contentType,
          disposition: "attachment",
          contentId: att.cid,
        }));
      }

      // Custom tracking settings
      if (message.trackingEnabled !== undefined) {
        emailData.trackingSettings = {
          clickTracking: { enable: message.trackingEnabled },
          openTracking: { enable: message.trackingEnabled },
        };
      }

      // Send email
      this.debug("Sending email via SendGrid", { to, subject: message.subject });
      const [response] = await sgMail.send(emailData);

      return {
        success: true,
        messageId: response.headers["x-message-id"],
        provider: "sendgrid",
        timestamp: new Date(),
        details: {
          statusCode: response.statusCode,
          headers: response.headers,
        },
      };
    } catch (error: any) {
      this.debug("Failed to send email", error);
      
      return {
        success: false,
        provider: "sendgrid",
        error: this.formatError(error),
        timestamp: new Date(),
        details: error.response?.body,
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    try {
      // SendGrid supports batch sending with personalizations
      const batchData = {
        personalizations: messages.map(message => ({
          to: Array.isArray(message.recipient) 
            ? message.recipient.map(email => ({ email }))
            : [{ email: message.recipient }],
          cc: message.cc ? (Array.isArray(message.cc) 
            ? message.cc.map(email => ({ email }))
            : [{ email: message.cc }]) : undefined,
          bcc: message.bcc ? (Array.isArray(message.bcc)
            ? message.bcc.map(email => ({ email }))
            : [{ email: message.bcc }]) : undefined,
          subject: message.subject,
          dynamicTemplateData: message.templateData,
        })),
        from: {
          email: this.config.from || "noreply@example.com",
          name: this.config.fromName,
        },
        content: messages[0]?.html ? [{
          type: "text/html",
          value: messages[0].html,
        }] : undefined,
        templateId: messages[0]?.templateId,
      };

      const [response] = await sgMail.send(batchData as any);

      return messages.map(() => ({
        success: true,
        messageId: response.headers["x-message-id"],
        provider: "sendgrid",
        timestamp: new Date(),
        details: {
          statusCode: response.statusCode,
        },
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
    return "SendGrid";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the API key by checking account details
      const request = {
        url: "/v3/user/account",
        method: "GET" as const,
      };

      const [response] = await sgMail.request(request);
      return response.statusCode === 200;
    } catch {
      return false;
    }
  }
}