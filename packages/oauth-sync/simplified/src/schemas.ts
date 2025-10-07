/**
 * Zod Schemas for OAuth Sync
 *
 * Type-safe credentials and data transformation using Zod schemas.
 */

import { z } from "zod";
import type { SyncEntity } from "./provider-endpoints";

// ============================================================================
// Provider Credential Schemas
// ============================================================================

/**
 * Base provider credentials schema
 */
export const ProviderCredentialsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  environment: z.enum(["production", "sandbox"]).optional().default("production"),
});

/**
 * QuickBooks-specific credentials
 */
export const QuickBooksCredentialsSchema = ProviderCredentialsSchema.extend({
  realmId: z.string().optional(), // Can be set after OAuth
});

/**
 * Xero-specific credentials
 */
export const XeroCredentialsSchema = ProviderCredentialsSchema.extend({
  tenantId: z.string().optional(), // Can be set after OAuth
});

/**
 * Outlook-specific credentials
 */
export const OutlookCredentialsSchema = ProviderCredentialsSchema.extend({
  tenantId: z.string().optional(),
});

/**
 * Gmail-specific credentials
 */
export const GmailCredentialsSchema = ProviderCredentialsSchema.extend({
  // Gmail uses standard OAuth
});

// ============================================================================
// Common Entity Schemas
// ============================================================================

/**
 * Customer schema (common fields across providers)
 */
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  external_id: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Invoice schema (common fields across providers)
 */
export const InvoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  customer_id: z.string().optional().nullable(),
  amount: z.number(),
  tax: z.number().optional().nullable(),
  total: z.number(),
  date: z.string().datetime().or(z.date()),
  due_date: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(["draft", "sent", "paid", "overdue", "void"]).optional(),
  external_id: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Transaction schema (common fields across providers)
 */
export const TransactionSchema = z.object({
  id: z.string(),
  date: z.string().datetime().or(z.date()),
  amount: z.number(),
  description: z.string().optional().nullable(),
  account_id: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  external_id: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Account schema (common fields across providers)
 */
export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  code: z.string().optional().nullable(),
  balance: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  external_id: z.string(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Provider-Specific Field Mappings
// ============================================================================

/**
 * Field mappings for transforming provider data to common schema
 */
export const PROVIDER_FIELD_MAPPINGS: Record<
  string, // provider
  Record<SyncEntity, Record<string, string>> // entity -> field mappings
> = {
  xero: {
    customers: {
      id: "ContactID",
      name: "Name",
      email: "EmailAddress",
      phone: "Phones[0].PhoneNumber",
      address: "Addresses[0].AddressLine1",
      external_id: "ContactID",
    },
    invoices: {
      id: "InvoiceID",
      number: "InvoiceNumber",
      customer_id: "Contact.ContactID",
      amount: "SubTotal",
      tax: "TotalTax",
      total: "Total",
      date: "Date",
      due_date: "DueDate",
      status: "Status",
      external_id: "InvoiceID",
    },
    transactions: {
      id: "BankTransactionID",
      date: "Date",
      amount: "Total",
      description: "Reference",
      account_id: "BankAccount.AccountID",
      type: "Type",
      external_id: "BankTransactionID",
    },
    accounts: {
      id: "AccountID",
      name: "Name",
      type: "Type",
      code: "Code",
      balance: "Balance",
      external_id: "AccountID",
    },
    items: {},
    bills: {},
    payments: {},
    vendors: {},
    employees: {},
  },
  quickbooks: {
    customers: {
      id: "Id",
      name: "DisplayName",
      email: "PrimaryEmailAddr.Address",
      phone: "PrimaryPhone.FreeFormNumber",
      address: "BillAddr.Line1",
      external_id: "Id",
    },
    invoices: {
      id: "Id",
      number: "DocNumber",
      customer_id: "CustomerRef.value",
      amount: "TotalAmt",
      tax: "TxnTaxDetail.TotalTax",
      total: "TotalAmt",
      date: "TxnDate",
      due_date: "DueDate",
      status: "Status",
      external_id: "Id",
    },
    transactions: {
      id: "Id",
      date: "TxnDate",
      amount: "Amount",
      description: "Description",
      account_id: "AccountRef.value",
      type: "Type",
      external_id: "Id",
    },
    accounts: {
      id: "Id",
      name: "Name",
      type: "AccountType",
      code: "AcctNum",
      balance: "CurrentBalance",
      external_id: "Id",
    },
    items: {},
    bills: {},
    payments: {},
    vendors: {},
    employees: {},
  },
  outlook: {
    customers: {},
    invoices: {},
    transactions: {},
    accounts: {},
    items: {},
    bills: {},
    payments: {},
    vendors: {},
    employees: {},
  },
  gmail: {
    customers: {},
    invoices: {},
    transactions: {},
    accounts: {},
    items: {},
    bills: {},
    payments: {},
    vendors: {},
    employees: {},
  },
};

/**
 * Default entity schemas
 */
export const DEFAULT_ENTITY_SCHEMAS: Record<SyncEntity, z.ZodSchema> = {
  customers: CustomerSchema,
  invoices: InvoiceSchema,
  transactions: TransactionSchema,
  accounts: AccountSchema,
  items: z.object({ id: z.string(), external_id: z.string() }),
  bills: z.object({ id: z.string(), external_id: z.string() }),
  payments: z.object({ id: z.string(), external_id: z.string() }),
  vendors: z.object({ id: z.string(), external_id: z.string() }),
  employees: z.object({ id: z.string(), external_id: z.string() }),
};

/**
 * Get nested property value from object using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  // Handle array notation like "Phones[0].PhoneNumber"
  const arrayMatch = path.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
  if (arrayMatch) {
    const [, arrayPath, index, rest] = arrayMatch;
    const array = getNestedValue(obj, arrayPath);
    if (Array.isArray(array) && array.length > parseInt(index, 10)) {
      return getNestedValue(array[parseInt(index, 10)], rest);
    }
    return null;
  }

  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined || value === null) {
      return null;
    }
  }

  return value;
}

/**
 * Transform provider data to match schema using field mappings
 */
export function transformWithMapping<T>(
  data: any,
  provider: string,
  entity: SyncEntity,
  schema: z.ZodSchema<T>
): T {
  const mappings = PROVIDER_FIELD_MAPPINGS[provider]?.[entity] || {};

  // Build the transformed object
  const transformed: any = {};

  for (const [targetField, sourcePath] of Object.entries(mappings)) {
    transformed[targetField] = getNestedValue(data, sourcePath);
  }

  // Validate and parse with Zod schema
  return schema.parse(transformed);
}

/**
 * Transform array of provider data
 */
export function transformArrayWithMapping<T>(
  dataArray: any[],
  provider: string,
  entity: SyncEntity,
  schema: z.ZodSchema<T>
): T[] {
  return dataArray
    .map((item) => {
      try {
        return transformWithMapping(item, provider, entity, schema);
      } catch (error) {
        console.error("Transform error:", error);
        return null;
      }
    })
    .filter((item): item is T => item !== null);
}
