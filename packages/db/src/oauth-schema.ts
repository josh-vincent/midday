/**
 * OAuth Connections Schema for Drizzle ORM
 *
 * Compatible with @midday/oauth-sync package
 * Run: bun run db:generate to create migration
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
  bigint,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const oauthProvider = pgEnum("oauth_provider", [
  "quickbooks",
  "xero",
  "gmail",
  "outlook",
]);

export const oauthAction = pgEnum("oauth_action", [
  "connect",
  "disconnect",
  "refresh",
  "transfer",
  "view",
  "sync",
]);

export const oauthOperation = pgEnum("oauth_operation", [
  "api_call",
  "sync",
  "data_transfer",
]);

// ============================================================================
// MAIN CONNECTIONS TABLE
// ============================================================================

export const oauthConnections = pgTable(
  "oauth_connections",
  {
    // Identity
    id: text().primaryKey().notNull(),

    // Hierarchy (at least one required)
    userId: text("user_id").notNull(),
    teamId: text("team_id"),
    orgId: text("org_id"),

    // Provider details
    provider: oauthProvider().notNull(),

    // OAuth tokens (JSONB for flexibility)
    // Structure: { accessToken, refreshToken, expiresIn, connectedAt, scope, tokenType }
    credentials: jsonb().notNull(),

    // Provider-specific IDs
    realmId: text("realm_id"), // QuickBooks Company ID
    tenantId: text("tenant_id"), // Xero Tenant ID

    // Connection metadata
    metadata: jsonb().default(sql`'{}'::jsonb`),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),

    // Status flags
    isPrimary: boolean("is_primary").default(false),
    isActive: boolean("is_active").default(true),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // User-level queries
    index("idx_oauth_connections_user_id").on(table.userId),

    // Team-level queries
    index("idx_oauth_connections_team_id").on(table.teamId),

    // Organization-level queries
    index("idx_oauth_connections_org_id").on(table.orgId),

    // Provider lookups
    index("idx_oauth_connections_provider").on(table.provider),

    // Composite indexes for common queries
    index("idx_oauth_connections_org_provider").on(table.orgId, table.provider),
    index("idx_oauth_connections_team_provider").on(table.teamId, table.provider),

    // Expiring connections (for background refresh jobs)
    index("idx_oauth_connections_expiring").on(table.expiresAt),

    // QuickBooks realm lookup
    index("idx_oauth_connections_realm_id").on(table.realmId),

    // Xero tenant lookup
    index("idx_oauth_connections_tenant_id").on(table.tenantId),

    // Only one primary connection per org/provider
    uniqueIndex("idx_one_primary_per_org_provider")
      .on(table.orgId, table.provider)
      .where(sql`${table.isPrimary} = true AND ${table.orgId} IS NOT NULL`),

    // Only one primary connection per team/provider
    uniqueIndex("idx_one_primary_per_team_provider")
      .on(table.teamId, table.provider)
      .where(sql`${table.isPrimary} = true AND ${table.teamId} IS NOT NULL`),
  ]
);

// ============================================================================
// DISTRIBUTED LOCKS TABLE (for token refresh)
// ============================================================================

export const oauthLocks = pgTable(
  "oauth_locks",
  {
    lockKey: text("lock_key").primaryKey().notNull(),
    connectionId: text("connection_id").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Index for cleanup of expired locks
    index("idx_oauth_locks_expires_at").on(table.expiresAt),
  ]
);

// ============================================================================
// AUDIT LOG TABLE (for compliance)
// ============================================================================

export const oauthAuditLogs = pgTable(
  "oauth_audit_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    // Context
    orgId: text("org_id"),
    teamId: text("team_id"),
    userId: text("user_id").notNull(),

    // Action details
    action: oauthAction().notNull(),
    connectionId: text("connection_id"),
    provider: oauthProvider(),

    // Metadata
    metadata: jsonb().default(sql`'{}'::jsonb`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Timestamp
    timestamp: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_oauth_audit_logs_org_id").on(table.orgId),
    index("idx_oauth_audit_logs_user_id").on(table.userId),
    index("idx_oauth_audit_logs_timestamp").on(table.timestamp),
    index("idx_oauth_audit_logs_action").on(table.action),
  ]
);

// ============================================================================
// OAUTH ADMINS TABLE (for admin delegation)
// ============================================================================

export const oauthAdmins = pgTable(
  "oauth_admins",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    userId: text("user_id").notNull(),
    orgId: text("org_id").notNull(),

    // Which providers this admin can manage
    providers: text().array().notNull(),

    // Delegation details
    delegatedBy: text("delegated_by").notNull(),
    delegatedAt: timestamp("delegated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),

    // Metadata
    metadata: jsonb().default(sql`'{}'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_oauth_admins_user_org").on(table.userId, table.orgId),
    index("idx_oauth_admins_org_id").on(table.orgId),
  ]
);

// ============================================================================
// USAGE METRICS TABLE (for billing)
// ============================================================================

export const oauthUsageMetrics = pgTable(
  "oauth_usage_metrics",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    orgId: text("org_id"),
    teamId: text("team_id"),
    provider: oauthProvider().notNull(),
    connectionId: text("connection_id").notNull(),

    operation: oauthOperation().notNull(),
    bytes: bigint({ mode: "number" }).default(0),

    timestamp: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_oauth_usage_metrics_org_timestamp").on(
      table.orgId,
      table.timestamp
    ),
    index("idx_oauth_usage_metrics_connection").on(table.connectionId),
  ]
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OAuthConnection = typeof oauthConnections.$inferSelect;
export type NewOAuthConnection = typeof oauthConnections.$inferInsert;

export type OAuthLock = typeof oauthLocks.$inferSelect;
export type NewOAuthLock = typeof oauthLocks.$inferInsert;

export type OAuthAuditLog = typeof oauthAuditLogs.$inferSelect;
export type NewOAuthAuditLog = typeof oauthAuditLogs.$inferInsert;

export type OAuthAdmin = typeof oauthAdmins.$inferSelect;
export type NewOAuthAdmin = typeof oauthAdmins.$inferInsert;

export type OAuthUsageMetric = typeof oauthUsageMetrics.$inferSelect;
export type NewOAuthUsageMetric = typeof oauthUsageMetrics.$inferInsert;
