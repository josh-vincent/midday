import { z } from "zod";

// QuickBooks webhook job schemas
export const syncQuickBooksEntitySchema = z.object({
  integrationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  entityType: z.enum([
    "invoice",
    "customer",
    "payment",
    "item",
    "estimate",
    "vendor",
    "account",
  ]),
  entityId: z.string(),
  operation: z.enum(["create", "update", "delete", "sync_all"]),
  realmId: z.string(),
  lastUpdated: z.string(),
});

export type SyncQuickBooksEntityPayload = z.infer<
  typeof syncQuickBooksEntitySchema
>;

export const initialQuickBooksSetupSchema = z.object({
  integrationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  realmId: z.string(),
});

export type InitialQuickBooksSetupPayload = z.infer<
  typeof initialQuickBooksSetupSchema
>;

// Xero webhook job schemas
export const syncXeroEntitySchema = z.object({
  integrationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  entityType: z.enum([
    "invoice",
    "contact",
    "payment",
    "banktransaction",
    "item",
  ]),
  entityId: z.string(),
  operation: z.enum(["create", "update", "delete", "sync_all"]),
  xeroTenantId: z.string(),
  resourceUrl: z.string(),
  eventDateUtc: z.string(),
});

export type SyncXeroEntityPayload = z.infer<typeof syncXeroEntitySchema>;

export const initialXeroSetupSchema = z.object({
  integrationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  xeroTenantId: z.string(),
});

export type InitialXeroSetupPayload = z.infer<typeof initialXeroSetupSchema>;

// Legacy stub interfaces for compatibility
export interface ProcessAttachmentPayload {}
export interface SyncConnectionPayload {}
export interface OnboardTeamPayload {}

export default {};
