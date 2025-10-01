// Export types
export * from "./types/communication";

// Export providers
export { BaseProvider } from "./providers/base-provider";
export { ResendProvider } from "./providers/email/resend-provider";
export { SendGridProvider } from "./providers/email/sendgrid-provider";
export { TwilioSmsProvider } from "./providers/sms/twilio-provider";
export { TwilioWhatsAppProvider } from "./providers/whatsapp/twilio-whatsapp-provider";

// Export communication manager
export { CommunicationManager } from "./communication-manager";

// Export queue manager
export { QueueManager } from "./queue/queue-manager";

// Export template manager
export { TemplateManager } from "./templates/template-manager";

// Export webhook handler
export { WebhookHandler } from "./webhooks/webhook-handler";