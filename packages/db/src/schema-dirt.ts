import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
  jsonb,
  index,
  foreignKey,
  numeric,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { customers, invoices, teams, users } from "./schema";

// Enums
export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "validating", 
  "validated",
  "processing",
  "processed",
  "failed",
]);

export const importRowStatusEnum = pgEnum("import_row_status", [
  "valid",
  "error",
  "duplicate",
  "processed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "credit_card",
  "cash",
  "check",
  "other",
]);

export const reminderChannelEnum = pgEnum("reminder_channel", [
  "email",
  "sms",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "sent",
  "delivered",
  "opened",
  "bounced",
  "failed",
]);

// Import tracking tables
export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    filename: text().notNull(),
    status: importStatusEnum().default("pending").notNull(),
    totalRows: integer("total_rows"),
    validRows: integer("valid_rows"),
    errorRows: integer("error_rows"),
    mappingTemplateId: uuid("mapping_template_id"),
    errorLog: jsonb("error_log"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("import_batches_team_id_idx").using("btree", table.teamId),
    index("import_batches_created_at_idx").using("btree", table.createdAt),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const importRows = pgTable(
  "import_rows",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    batchId: uuid("batch_id").notNull(),
    rowNumber: integer("row_number").notNull(),
    rawData: jsonb("raw_data").notNull(),
    parsedData: jsonb("parsed_data"),
    validationErrors: jsonb("validation_errors"),
    invoiceId: uuid("invoice_id"),
    status: importRowStatusEnum().default("valid").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("import_rows_batch_id_idx").using("btree", table.batchId),
    index("import_rows_status_idx").using("btree", table.status),
    foreignKey({
      columns: [table.batchId],
      foreignColumns: [importBatches.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete("set null"),
  ]
);

export const mappingTemplates = pgTable(
  "mapping_templates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    customerId: uuid("customer_id"),
    name: text().notNull(),
    columnMappings: jsonb("column_mappings").notNull(),
    validationRules: jsonb("validation_rules"),
    groupingRules: jsonb("grouping_rules"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
  },
  (table) => [
    index("mapping_templates_team_id_idx").using("btree", table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
  ]
);

// Payment tracking tables
export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id").notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default("AUD").notNull(),
    paymentDate: date("payment_date", { mode: "string" }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    reference: text(),
    notes: text(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_invoice_id_idx").using("btree", table.invoiceId),
    index("payments_payment_date_idx").using("btree", table.paymentDate),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id").notNull(),
    paymentId: uuid("payment_id"),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default("AUD").notNull(),
    reason: text(),
    refundDate: date("refund_date", { mode: "string" }).notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("refunds_invoice_id_idx").using("btree", table.invoiceId),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payments.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// Reminder and scheduling tables
export const invoiceReminderPolicies = pgTable(
  "invoice_reminder_policies",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    isDefault: boolean("is_default").default(false),
    reminders: jsonb().notNull(), // Array of {days_offset: -3, channel: 'email', template: 'reminder_1'}
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
  },
  (table) => [
    index("invoice_reminder_policies_team_id_idx").using("btree", table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
  ]
);

export const scheduledJobs = pgTable(
  "scheduled_jobs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    type: text().notNull(), // 'send_invoice', 'send_reminder'
    payload: jsonb().notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: "string" }).notNull(),
    status: jobStatusEnum().default("pending").notNull(),
    attempts: integer().default(0).notNull(),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("scheduled_jobs_scheduled_for_idx").using("btree", table.scheduledFor),
    index("scheduled_jobs_status_idx").using("btree", table.status),
  ]
);

// Email tracking
export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    type: text().notNull(), // 'invoice', 'reminder_1', 'reminder_2', etc
    status: emailStatusEnum().default("sent").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "string" }),
    openedAt: timestamp("opened_at", { withTimezone: true, mode: "string" }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true, mode: "string" }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("email_deliveries_invoice_id_idx").using("btree", table.invoiceId),
    index("email_deliveries_status_idx").using("btree", table.status),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete("cascade"),
  ]
);

// Attachments for line items
export const attachments = pgTable(
  "attachments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    invoiceId: uuid("invoice_id"),
    filename: text().notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    storageUrl: text("storage_url").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    metadata: jsonb(), // Can store line item association, type (docket/photo), etc.
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("attachments_team_id_idx").using("btree", table.teamId),
    index("attachments_invoice_id_idx").using("btree", table.invoiceId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ]
);

// Accounting connections
export const accountingConnections = pgTable(
  "accounting_connections",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    provider: text().notNull(), // 'xero', 'quickbooks', 'myob'
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    config: jsonb(), // Provider-specific configuration
    isActive: boolean("is_active").default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
  },
  (table) => [
    index("accounting_connections_team_id_idx").using("btree", table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
  ]
);

export const accountingLinks = pgTable(
  "accounting_links",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    entityType: text("entity_type").notNull(), // 'invoice', 'customer', 'payment'
    entityId: uuid("entity_id").notNull(),
    provider: text().notNull(),
    externalId: text("external_id").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("accounting_links_entity_idx").using("btree", table.entityType, table.entityId),
    index("accounting_links_provider_idx").using("btree", table.provider, table.externalId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
  ]
);

// Audit log for compliance
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id"),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text().notNull(), // 'create', 'update', 'delete', 'send', 'view', etc.
    changes: jsonb(),
    metadata: jsonb(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_log_entity_idx").using("btree", table.entityType, table.entityId),
    index("audit_log_team_id_idx").using("btree", table.teamId),
    index("audit_log_created_at_idx").using("btree", table.createdAt),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("set null"),
  ]
);