import type { Database } from "../client";
import { oauthConnections, syncedAccountingEntities } from "../schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Types for accounting connections
export type CreateAccountingConnectionParams = {
  teamId: string;
  userId: string;
  provider: "quickbooks" | "xero" | "sage" | "wave" | "freshbooks";
  companyName?: string;
  realmId?: string; // QuickBooks
  tenantId?: string; // Xero
  credentials: any; // Encrypted OAuth tokens
  expiresAt?: string;
  syncEnabled?: boolean;
  environment?: string;
  metadata?: any;
};

export type UpdateAccountingConnectionParams = Partial<
  CreateAccountingConnectionParams
> & {
  id: string;
  teamId: string;
};

export type GetAccountingConnectionParams = {
  id: string;
  teamId: string;
};

export type GetConnectionByProviderParams = {
  teamId: string;
  provider: "quickbooks" | "xero" | "sage" | "wave" | "freshbooks";
};

// Create a new accounting connection
export const createAccountingConnection = async (
  db: Database,
  data: CreateAccountingConnectionParams
) => {
  const id = uuidv4();

  const [result] = await db
    .insert(oauthConnections)
    .values({
      id,
      ...data,
      syncEnabled: data.syncEnabled ?? false,
      environment: data.environment || "production",
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return result;
};

// Update an existing accounting connection
export const updateAccountingConnection = async (
  db: Database,
  data: UpdateAccountingConnectionParams
) => {
  const { id, teamId, ...updateData } = data;

  const [result] = await db
    .update(oauthConnections)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(oauthConnections.id, id),
        eq(oauthConnections.teamId, teamId)
      )
    )
    .returning();

  return result;
};

// Get accounting connection by ID
export const getAccountingConnectionById = async (
  db: Database,
  params: GetAccountingConnectionParams
) => {
  const { id, teamId } = params;

  const [result] = await db
    .select()
    .from(oauthConnections)
    .where(
      and(
        eq(oauthConnections.id, id),
        eq(oauthConnections.teamId, teamId)
      )
    );

  return result;
};

// Get all accounting connections for a team
export const getAccountingConnectionsByTeamId = async (
  db: Database,
  teamId: string
) => {
  const results = await db
    .select()
    .from(oauthConnections)
    .where(eq(oauthConnections.teamId, teamId));

  return results;
};

// Get accounting connection by provider and team
export const getAccountingConnectionByProvider = async (
  db: Database,
  params: GetConnectionByProviderParams
) => {
  const { teamId, provider } = params;

  const [result] = await db
    .select()
    .from(oauthConnections)
    .where(
      and(
        eq(oauthConnections.teamId, teamId),
        eq(oauthConnections.provider, provider)
      )
    );

  return result;
};

// Delete an accounting connection
export const deleteAccountingConnection = async (
  db: Database,
  params: GetAccountingConnectionParams
) => {
  const { id, teamId } = params;

  const [result] = await db
    .delete(oauthConnections)
    .where(
      and(
        eq(oauthConnections.id, id),
        eq(oauthConnections.teamId, teamId)
      )
    )
    .returning();

  return result;
};

// Update last sync time
export const updateLastSyncTime = async (
  db: Database,
  connectionId: string,
  teamId: string
) => {
  const [result] = await db
    .update(oauthConnections)
    .set({
      lastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(oauthConnections.id, connectionId),
        eq(oauthConnections.teamId, teamId)
      )
    )
    .returning();

  return result;
};

// Get connections that need token refresh (expiring soon)
export const getConnectionsNeedingRefresh = async (
  db: Database,
  thresholdMinutes: number = 60
) => {
  const threshold = new Date();
  threshold.setMinutes(threshold.getMinutes() + thresholdMinutes);

  const results = await db
    .select()
    .from(oauthConnections)
    .where(eq(oauthConnections.expiresAt, threshold.toISOString()));

  return results;
};

// Synced entity operations
export type UpsertSyncedEntityParams = {
  connectionId: string;
  teamId: string;
  entityType: "customers" | "invoices" | "payments" | "accounts" | "items" | "vendors" | "bills";
  externalId: string;
  entityData: any;
  metadata?: any;
};

export const upsertSyncedEntity = async (
  db: Database,
  data: UpsertSyncedEntityParams
) => {
  const id = uuidv4();

  // Try to find existing entity first
  const [existing] = await db
    .select()
    .from(syncedAccountingEntities)
    .where(
      and(
        eq(syncedAccountingEntities.connectionId, data.connectionId),
        eq(syncedAccountingEntities.entityType, data.entityType),
        eq(syncedAccountingEntities.externalId, data.externalId)
      )
    );

  if (existing) {
    // Update existing
    const [result] = await db
      .update(syncedAccountingEntities)
      .set({
        entityData: data.entityData,
        metadata: data.metadata || existing.metadata,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(syncedAccountingEntities.id, existing.id))
      .returning();

    return result;
  } else {
    // Insert new
    const [result] = await db
      .insert(syncedAccountingEntities)
      .values({
        id,
        connectionId: data.connectionId,
        teamId: data.teamId,
        entityType: data.entityType,
        externalId: data.externalId,
        entityData: data.entityData,
        metadata: data.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }
};

// Get synced entities by connection
export const getSyncedEntitiesByConnection = async (
  db: Database,
  connectionId: string,
  entityType?: "customers" | "invoices" | "payments" | "accounts" | "items" | "vendors" | "bills"
) => {
  let query = db
    .select()
    .from(syncedAccountingEntities)
    .where(eq(syncedAccountingEntities.connectionId, connectionId));

  if (entityType) {
    query = query.where(
      and(
        eq(syncedAccountingEntities.connectionId, connectionId),
        eq(syncedAccountingEntities.entityType, entityType)
      )
    );
  }

  const results = await query;
  return results;
};

// Delete synced entity
export const deleteSyncedEntity = async (
  db: Database,
  id: string,
  teamId: string
) => {
  const [result] = await db
    .delete(syncedAccountingEntities)
    .where(
      and(
        eq(syncedAccountingEntities.id, id),
        eq(syncedAccountingEntities.teamId, teamId)
      )
    )
    .returning();

  return result;
};
