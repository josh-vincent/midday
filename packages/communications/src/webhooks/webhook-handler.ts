import * as crypto from "crypto";
import type { 
  WebhookPayload, 
  WebhookEvent,
  EmailProvider,
  SmsProvider,
  WhatsAppProvider 
} from "../types/communication";

export interface WebhookConfig {
  provider: EmailProvider | SmsProvider | WhatsAppProvider;
  secret?: string;
  signatureHeader?: string;
  verifySignature?: boolean;
}

export interface WebhookEventHandler {
  (event: WebhookEvent, data: any): Promise<void>;
}

export class WebhookHandler {
  private config: WebhookConfig;
  private eventHandlers: Map<WebhookEvent, WebhookEventHandler[]> = new Map();

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  on(event: WebhookEvent, handler: WebhookEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  off(event: WebhookEvent, handler: WebhookEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  async handle(
    headers: Record<string, string>,
    body: string | Buffer | any,
    rawBody?: string | Buffer
  ): Promise<void> {
    // Verify signature if configured
    if (this.config.verifySignature && this.config.secret) {
      const signatureHeader = this.config.signatureHeader || this.getDefaultSignatureHeader();
      const signature = headers[signatureHeader.toLowerCase()];
      
      if (!signature) {
        throw new Error("Webhook signature header missing");
      }

      const isValid = this.verifySignature(signature, rawBody || body, this.config.secret);
      if (!isValid) {
        throw new Error("Invalid webhook signature");
      }
    }

    // Parse webhook data based on provider
    const { event, data } = await this.parseWebhook(headers, body);

    // Trigger event handlers
    await this.triggerHandlers(event, data);
  }

  private async parseWebhook(
    headers: Record<string, string>,
    body: any
  ): Promise<{ event: WebhookEvent; data: any }> {
    switch (this.config.provider) {
      case "sendgrid":
        return this.parseSendGridWebhook(body);
      
      case "resend":
        return this.parseResendWebhook(body);
      
      case "twilio":
        return this.parseTwilioWebhook(body);
      
      case "mailgun":
        return this.parseMailgunWebhook(body);
      
      default:
        throw new Error(`Unsupported webhook provider: ${this.config.provider}`);
    }
  }

  private parseSendGridWebhook(body: any): { event: WebhookEvent; data: any } {
    // SendGrid sends an array of events
    const events = Array.isArray(body) ? body : [body];
    
    // Process each event (for now, we'll handle the first one)
    const sgEvent = events[0];
    
    const eventMap: Record<string, WebhookEvent> = {
      "processed": "message.sent",
      "delivered": "message.delivered",
      "bounce": "message.bounced",
      "deferred": "message.failed",
      "dropped": "message.failed",
      "open": "message.opened",
      "click": "message.clicked",
      "spamreport": "message.complained",
      "unsubscribe": "message.unsubscribed",
    };

    const event = eventMap[sgEvent.event] || "message.sent";
    
    return {
      event,
      data: {
        messageId: sgEvent.sg_message_id,
        email: sgEvent.email,
        timestamp: new Date(sgEvent.timestamp * 1000),
        category: sgEvent.category,
        url: sgEvent.url,
        reason: sgEvent.reason,
        response: sgEvent.response,
        attempt: sgEvent.attempt,
        raw: sgEvent,
      },
    };
  }

  private parseResendWebhook(body: any): { event: WebhookEvent; data: any } {
    const eventMap: Record<string, WebhookEvent> = {
      "email.sent": "message.sent",
      "email.delivered": "message.delivered",
      "email.delivery_failed": "message.failed",
      "email.bounced": "message.bounced",
      "email.opened": "message.opened",
      "email.clicked": "message.clicked",
      "email.complained": "message.complained",
    };

    const event = eventMap[body.type] || "message.sent";
    
    return {
      event,
      data: {
        messageId: body.data.email_id,
        email: body.data.to?.[0],
        timestamp: new Date(body.created_at),
        subject: body.data.subject,
        from: body.data.from,
        raw: body,
      },
    };
  }

  private parseTwilioWebhook(body: any): { event: WebhookEvent; data: any } {
    const statusMap: Record<string, WebhookEvent> = {
      "sent": "message.sent",
      "delivered": "message.delivered",
      "failed": "message.failed",
      "undelivered": "message.failed",
    };

    const event = statusMap[body.MessageStatus] || "message.sent";
    
    return {
      event,
      data: {
        messageId: body.MessageSid,
        from: body.From,
        to: body.To,
        status: body.MessageStatus,
        timestamp: new Date(),
        errorCode: body.ErrorCode,
        errorMessage: body.ErrorMessage,
        price: body.Price,
        priceUnit: body.PriceUnit,
        raw: body,
      },
    };
  }

  private parseMailgunWebhook(body: any): { event: WebhookEvent; data: any } {
    const eventData = body["event-data"] || body;
    
    const eventMap: Record<string, WebhookEvent> = {
      "accepted": "message.sent",
      "delivered": "message.delivered",
      "failed": "message.failed",
      "rejected": "message.failed",
      "bounced": "message.bounced",
      "opened": "message.opened",
      "clicked": "message.clicked",
      "complained": "message.complained",
      "unsubscribed": "message.unsubscribed",
    };

    const event = eventMap[eventData.event] || "message.sent";
    
    return {
      event,
      data: {
        messageId: eventData.message?.headers?.["message-id"],
        email: eventData.recipient,
        timestamp: new Date(eventData.timestamp * 1000),
        tags: eventData.tags,
        url: eventData.url,
        reason: eventData.reason,
        description: eventData.description,
        raw: body,
      },
    };
  }

  private verifySignature(
    signature: string,
    payload: string | Buffer,
    secret: string
  ): boolean {
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    
    switch (this.config.provider) {
      case "sendgrid":
        return this.verifySendGridSignature(signature, payloadStr, secret);
      
      case "resend":
        return this.verifyResendSignature(signature, payloadStr, secret);
      
      case "twilio":
        return this.verifyTwilioSignature(signature, payloadStr, secret);
      
      case "mailgun":
        return this.verifyMailgunSignature(signature, payloadStr, secret);
      
      default:
        // Generic HMAC-SHA256 verification
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(payloadStr)
          .digest("hex");
        
        return signature === expectedSignature;
    }
  }

  private verifySendGridSignature(signature: string, payload: string, secret: string): boolean {
    const timestamp = signature.split(" t=")[1]?.split(" ")[0];
    const signatures = signature.split(" v1=")[1]?.split(" ")[0];
    
    if (!timestamp || !signatures) return false;
    
    const payloadToSign = timestamp + payload;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadToSign)
      .digest("hex");
    
    return signatures.includes(expectedSignature);
  }

  private verifyResendSignature(signature: string, payload: string, secret: string): boolean {
    const parts = signature.split(",");
    const timestamp = parts.find(p => p.startsWith("t="))?.substring(2);
    const sig = parts.find(p => p.startsWith("v1="))?.substring(3);
    
    if (!timestamp || !sig) return false;
    
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    
    return sig === expectedSignature;
  }

  private verifyTwilioSignature(signature: string, payload: string, authToken: string): boolean {
    // Twilio uses a different approach - requires URL and params
    // This is a simplified version - in production, you'd need the full URL
    const hash = crypto
      .createHmac("sha1", authToken)
      .update(payload)
      .digest("base64");
    
    return hash === signature;
  }

  private verifyMailgunSignature(signature: string, payload: string, apiKey: string): boolean {
    const data = JSON.parse(payload);
    const signingData = data.signature;
    
    if (!signingData) return false;
    
    const encodedToken = crypto
      .createHmac("sha256", apiKey)
      .update(signingData.timestamp + signingData.token)
      .digest("hex");
    
    return encodedToken === signingData.signature;
  }

  private getDefaultSignatureHeader(): string {
    const headerMap: Record<string, string> = {
      sendgrid: "x-twilio-email-event-webhook-signature",
      resend: "resend-signature",
      twilio: "x-twilio-signature",
      mailgun: "x-mailgun-signature",
    };
    
    return headerMap[this.config.provider] || "x-webhook-signature";
  }

  private async triggerHandlers(event: WebhookEvent, data: any): Promise<void> {
    const handlers = this.eventHandlers.get(event) || [];
    
    await Promise.all(
      handlers.map(handler => 
        handler(event, data).catch(error => 
          console.error(`Webhook handler error for ${event}:`, error)
        )
      )
    );
  }

  async testWebhook(event: WebhookEvent, testData?: any): Promise<void> {
    const data = testData || {
      messageId: "test-message-id",
      timestamp: new Date(),
      test: true,
    };
    
    await this.triggerHandlers(event, data);
  }
}