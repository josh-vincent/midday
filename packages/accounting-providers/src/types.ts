import { z } from "zod";

// Provider Configuration
export const accountingConfigSchema = z.object({
  provider: z.enum(["quickbooks", "xero", "sage", "wave", "freshbooks"]),
  credentials: z.record(z.any()),
  syncEnabled: z.boolean().default(false),
  webhookUrl: z.string().optional(),
  realmId: z.string().optional(), // QuickBooks specific
  tenantId: z.string().optional(), // Xero specific
});

export type AccountingConfig = z.infer<typeof accountingConfigSchema>;

// OAuth Credentials
export interface QuickBooksCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  realmId: string; // Company ID
  expiryDate?: number;
  environment?: "sandbox" | "production";
}

export interface XeroCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId: string; // Organization ID
  expiryDate?: number;
}

// Common Accounting Entities
export interface AccountingCustomer {
  id?: string;
  externalId?: string; // Provider's ID
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  taxNumber?: string;
  currencyCode?: string;
  balance?: number;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AccountingInvoice {
  id?: string;
  externalId?: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: Date;
  dueDate?: Date;
  status: "draft" | "sent" | "paid" | "overdue" | "void" | "partial";
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal?: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currencyCode: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  terms?: string;
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  accountCode?: string;
  itemCode?: string;
  metadata?: Record<string, any>;
}

export interface AccountingPayment {
  id?: string;
  externalId?: string;
  invoiceId: string;
  customerId: string;
  paymentDate: Date;
  amount: number;
  currencyCode: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountingAccount {
  id?: string;
  externalId?: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense" | "bank";
  classification?: string;
  description?: string;
  currencyCode?: string;
  balance?: number;
  taxType?: string;
  isActive?: boolean;
  parentAccountId?: string;
  metadata?: Record<string, any>;
}

export interface AccountingTaxRate {
  id?: string;
  externalId?: string;
  name: string;
  rate: number;
  taxType?: string;
  isCompound?: boolean;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface AccountingItem {
  id?: string;
  externalId?: string;
  name: string;
  sku?: string;
  description?: string;
  type: "inventory" | "service" | "non_inventory";
  unitPrice?: number;
  purchasePrice?: number;
  quantityOnHand?: number;
  incomeAccountId?: string;
  expenseAccountId?: string;
  assetAccountId?: string;
  taxable?: boolean;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface AccountingVendor {
  id?: string;
  externalId?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: Address;
  taxNumber?: string;
  currencyCode?: string;
  balance?: number;
  paymentTerms?: string;
  accountNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AccountingBill {
  id?: string;
  externalId?: string;
  billNumber?: string;
  vendorId: string;
  vendorName?: string;
  issueDate: Date;
  dueDate?: Date;
  status: "draft" | "open" | "paid" | "overdue" | "void";
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currencyCode: string;
  terms?: string;
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

// Sync Options and Results
export interface AccountingSyncOptions {
  teamId: string;
  userId: string;
  provider: "quickbooks" | "xero";
  credentials: QuickBooksCredentials | XeroCredentials;
  entities?: Array<"customers" | "invoices" | "payments" | "accounts" | "items" | "vendors" | "bills">;
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  modifiedSince?: Date;
}

export interface AccountingSyncResult {
  success: boolean;
  synced: {
    customers: number;
    invoices: number;
    payments: number;
    accounts: number;
    items: number;
    vendors: number;
    bills: number;
  };
  errors: Array<{
    entity?: string;
    entityId?: string;
    error: string;
  }>;
  lastSyncTime?: Date;
  nextSyncToken?: string;
}

// Webhook Payloads
export interface AccountingWebhookPayload {
  type: "invoice.created" | "invoice.updated" | "invoice.deleted" | "payment.created" | "customer.created" | "customer.updated";
  provider: "quickbooks" | "xero";
  teamId: string;
  realmId?: string;
  tenantId?: string;
  entityId: string;
  timestamp: Date;
  data?: any;
}

// Provider Interface
export interface IAccountingProvider {
  // Authentication
  getAuthUrl(redirectUri: string, state?: string): Promise<string>;
  exchangeCodeForToken(code: string, redirectUri: string): Promise<any>;
  refreshAccessToken(): Promise<void>;
  getCredentials(): QuickBooksCredentials | XeroCredentials;

  // Customers
  getCustomers(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingCustomer[]>;
  getCustomer(id: string): Promise<AccountingCustomer | null>;
  createCustomer(customer: AccountingCustomer): Promise<AccountingCustomer>;
  updateCustomer(id: string, customer: Partial<AccountingCustomer>): Promise<AccountingCustomer>;
  deleteCustomer(id: string): Promise<void>;

  // Invoices
  getInvoices(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingInvoice[]>;
  getInvoice(id: string): Promise<AccountingInvoice | null>;
  createInvoice(invoice: AccountingInvoice): Promise<AccountingInvoice>;
  updateInvoice(id: string, invoice: Partial<AccountingInvoice>): Promise<AccountingInvoice>;
  deleteInvoice(id: string): Promise<void>;
  sendInvoice(id: string, email?: string): Promise<void>;

  // Payments
  getPayments(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingPayment[]>;
  getPayment(id: string): Promise<AccountingPayment | null>;
  createPayment(payment: AccountingPayment): Promise<AccountingPayment>;

  // Accounts
  getAccounts(): Promise<AccountingAccount[]>;
  getAccount(id: string): Promise<AccountingAccount | null>;

  // Items/Products
  getItems(options?: { isActive?: boolean; maxResults?: number }): Promise<AccountingItem[]>;
  getItem(id: string): Promise<AccountingItem | null>;
  createItem(item: AccountingItem): Promise<AccountingItem>;
  updateItem(id: string, item: Partial<AccountingItem>): Promise<AccountingItem>;

  // Vendors
  getVendors(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingVendor[]>;
  getVendor(id: string): Promise<AccountingVendor | null>;
  createVendor(vendor: AccountingVendor): Promise<AccountingVendor>;
  updateVendor(id: string, vendor: Partial<AccountingVendor>): Promise<AccountingVendor>;

  // Bills
  getBills(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingBill[]>;
  getBill(id: string): Promise<AccountingBill | null>;
  createBill(bill: AccountingBill): Promise<AccountingBill>;
  updateBill(id: string, bill: Partial<AccountingBill>): Promise<AccountingBill>;

  // Utility
  getCompanyInfo(): Promise<any>;
  disconnect(): Promise<void>;
}

// Export types
export type AccountingProvider = "quickbooks" | "xero" | "sage" | "wave" | "freshbooks";
export type AccountingEntity = "customers" | "invoices" | "payments" | "accounts" | "items" | "vendors" | "bills";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void" | "partial";
export type BillStatus = "draft" | "open" | "paid" | "overdue" | "void";
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense" | "bank";
export type ItemType = "inventory" | "service" | "non_inventory";
