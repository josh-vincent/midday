// Export providers
export { QuickBooksProvider } from "./providers/quickbooks";
export { XeroProvider } from "./providers/xero";

// Export manager
export {
  AccountingSyncManager,
  createAccountingSyncManager,
  syncTeamAccounting,
} from "./accounting-sync-manager";

// Export types
export type {
  // Configuration
  AccountingConfig,
  QuickBooksCredentials,
  XeroCredentials,

  // Entities
  AccountingCustomer,
  AccountingInvoice,
  AccountingPayment,
  AccountingAccount,
  AccountingTaxRate,
  AccountingItem,
  AccountingVendor,
  AccountingBill,
  Address,
  InvoiceLineItem,

  // Sync
  AccountingSyncOptions,
  AccountingSyncResult,

  // Webhook
  AccountingWebhookPayload,

  // Provider Interface
  IAccountingProvider,

  // Type Unions
  AccountingProvider,
  AccountingEntity,
  InvoiceStatus,
  BillStatus,
  AccountType,
  ItemType,
} from "./types";

// Re-export the schema for validation
export { accountingConfigSchema } from "./types";
