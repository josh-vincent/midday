import { type SQL, relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import tsvector from "./tsvector";

// Custom types
export const numericCasted = customType<{
  data: number;
  driverData: string;
  config?: { precision?: number; scale?: number };
}>({
  dataType: (config) => {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision}, ${config.scale})`;
    }
    return "numeric";
  },
  fromDriver: (value: string) => Number.parseFloat(value),
  toDriver: (value: number) => value.toString(),
});
export const plans = pgEnum("plans", ["trial", "free", "pro", "enterprise"]);
// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "unpaid", 
  "paid",
  "canceled",
  "overdue",
  "partially_paid",
  "scheduled",
]);
export const teamRolesEnum = pgEnum("teamRoles", ["owner", "member"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "credit_card",
  "cash",
  "check",
  "other",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "invoice_created",
  "invoice_paid",
  "invoice_overdue",
  "invoice_reminder",
  "payment_received",
  "payment_failed",
]);

export const teamRoleEnum = pgEnum("team_role", ["owner", "member"]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const currencyEnum = pgEnum("currency", [
  "USD",
  "EUR",
  "GBP", 
  "AUD",
  "CAD",
  "NZD",
  "JPY",
  "CNY",
  "INR",
]);

export const documentProcessingStatusEnum = pgEnum(
  "document_processing_status",
  ["pending", "processing", "completed", "failed"],
);


// Tables

export const usersInAuth = pgTable(
  "auth.users",
  {
    instanceId: uuid("instance_id"),
    id: uuid("id").notNull(),
    aud: varchar("aud", { length: 255 }),
    role: varchar("role", { length: 255 }),
    email: varchar("email", { length: 255 }),
    encryptedPassword: varchar("encrypted_password", { length: 255 }),
    emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    confirmationToken: varchar("confirmation_token", { length: 255 }),
    confirmationSentAt: timestamp("confirmation_sent_at", {
      withTimezone: true,
    }),
    recoveryToken: varchar("recovery_token", { length: 255 }),
    recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true }),
    emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
    emailChange: varchar("email_change", { length: 255 }),
    emailChangeSentAt: timestamp("email_change_sent_at", {
      withTimezone: true,
    }),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    rawAppMetaData: jsonb("raw_app_meta_data"),
    rawUserMetaData: jsonb("raw_user_meta_data"),
    isSuperAdmin: boolean("is_super_admin"),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    phone: text("phone").default(sql`null::character varying`),
    phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true }),
    phoneChange: text("phone_change").default(sql`''::character varying`),
    phoneChangeToken: varchar("phone_change_token", { length: 255 }).default(
      sql`''::character varying`,
    ),
    phoneChangeSentAt: timestamp("phone_change_sent_at", {
      withTimezone: true,
    }),
    // Drizzle ORM does not support .stored() for generated columns, so we omit it
    confirmedAt: timestamp("confirmed_at", {
      withTimezone: true,
      mode: "string",
    }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
    emailChangeTokenCurrent: varchar("email_change_token_current", {
      length: 255,
    }).default(sql`''::character varying`),
    emailChangeConfirmStatus: smallint("email_change_confirm_status").default(
      0,
    ),
    bannedUntil: timestamp("banned_until", { withTimezone: true }),
    reauthenticationToken: varchar("reauthentication_token", {
      length: 255,
    }).default(sql`''::character varying`),
    reauthenticationSentAt: timestamp("reauthentication_sent_at", {
      withTimezone: true,
    }),
    isSsoUser: boolean("is_sso_user").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "users_pkey" }),
    unique("users_phone_key").on(table.phone),
    unique("confirmation_token_idx").on(table.confirmationToken),
    unique("email_change_token_current_idx").on(table.emailChangeTokenCurrent),
    unique("email_change_token_new_idx").on(table.emailChangeTokenNew),
    unique("reauthentication_token_idx").on(table.reauthenticationToken),
    unique("recovery_token_idx").on(table.recoveryToken),
    unique("users_email_partial_key").on(table.email),
    index("users_instance_id_email_idx").on(
      table.instanceId,
      sql`lower((email)::text)`,
    ),
    index("users_instance_id_idx").on(table.instanceId),
    index("users_is_anonymous_idx").on(table.isAnonymous),
    // Check constraint for email_change_confirm_status
    {
      kind: "check",
      name: "users_email_change_confirm_status_check",
      expression: sql`((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))`,
    },
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    email: text(),
    teamId: uuid("team_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    locale: text().default("en"),
    timezone: text(),
    timeFormat: numericCasted("time_format").default(24),
    dateFormat: text("date_format"),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("users_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [table.id],
      name: "users_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_team_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Users can insert their own profile.", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(auth.uid() = id)`,
    }),
    pgPolicy("Users can select their own profile.", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Users can select users if they are in the same team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users can update own profile.", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    logoUrl: text("logo_url"),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 50 }),
    website: varchar({ length: 255 }),
    address: text(),
    plan: plans("plan").default("trial").notNull(),
    inboxId: varchar("inbox_id", { length: 255 }),
    inboxEmail: varchar("inbox_email", { length: 255 }),
    inboxForwarding: boolean("inbox_forwarding").default(true),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    country: varchar({ length: 100 }),
    countryCode: varchar("country_code", { length: 2 }),
    postalCode: varchar("postal_code", { length: 20 }),
    taxNumber: varchar("tax_number", { length: 50 }),
    baseCurrency: currencyEnum("base_currency").default("AUD").notNull(),
    invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV"),
    nextInvoiceNumber: integer("next_invoice_number").default(1).notNull(),
    paymentTerms: integer("payment_terms").default(30), // days
    invoiceNotes: text("invoice_notes"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("teams_name_idx").on(table.name),
  ]
);

export const usersOnTeam = pgTable(
  "users_on_team",
  {
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    id: uuid().defaultRandom().notNull(),
    role: teamRolesEnum(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("users_on_team_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("users_on_team_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_on_team_team_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "users_on_team_user_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.userId, table.teamId, table.id],
      name: "members_pkey",
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable updates for users on team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
    pgPolicy("Select for current user teams", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users on team can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
  ],
);

export const userInvites = pgTable(
  "user_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 10 }).notNull(),
    role: teamRoleEnum().default("member").notNull(),
    status: inviteStatusEnum().default("pending").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.teamId, table.email),
    index("user_invites_email_idx").on(table.email),
    index("user_invites_code_idx").on(table.code),
  ]
);

export const customers = pgTable(
  "customers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 50 }),
    website: varchar({ length: 255 }),
    contactName: varchar("contact_name", { length: 255 }),
    address: text(),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    country: varchar({ length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    taxNumber: varchar("tax_number", { length: 50 }),
    currency: currencyEnum().default("AUD"),
    note: text(),
    tags: jsonb().default([]),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("customers_team_idx").on(table.teamId),
    index("customers_name_idx").on(table.name),
    index("customers_email_idx").on(table.email),
  ]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "restrict" })
      .notNull(),
    templateId: uuid("template_id").references(() => invoiceTemplates.id),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    paidDate: date("paid_date", { mode: "string" }),
    status: invoiceStatusEnum().default("draft").notNull(),
    currency: currencyEnum().default("AUD").notNull(),
    exchangeRate: numericCasted("exchange_rate", { precision: 10, scale: 4 }).default(1),
    
    // Amounts
    subtotal: integer().default(0).notNull(), // in cents
    taxRate: numericCasted("tax_rate", { precision: 5, scale: 2 }).default(0),
    taxAmount: integer("tax_amount").default(0).notNull(), // in cents
    discountRate: numericCasted("discount_rate", { precision: 5, scale: 2 }).default(0),
    discountAmount: integer("discount_amount").default(0).notNull(), // in cents
    totalAmount: integer("total_amount").default(0).notNull(), // in cents
    paidAmount: integer("paid_amount").default(0).notNull(), // in cents
    
    // Content
    lineItems: jsonb("line_items").default([]).notNull(),
    note: text(),
    terms: text(),
    paymentDetails: text("payment_details"),
    
    // Metadata
    sentAt: timestamp("sent_at", { mode: "string" }),
    reminderSentAt: timestamp("reminder_sent_at", { mode: "string" }),
    viewedAt: timestamp("viewed_at", { mode: "string" }),
    downloadedAt: timestamp("downloaded_at", { mode: "string" }),
    metadata: jsonb().default({}),
    
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.teamId, table.invoiceNumber),
    index("invoices_team_idx").on(table.teamId),
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_status_idx").on(table.status),
    index("invoices_due_date_idx").on(table.dueDate),
  ]
);

export const invoiceTemplates = pgTable(
  "invoice_templates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    isDefault: boolean("is_default").default(false).notNull(),
    
    // Template settings
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }).default("#000000"),
    includeQr: boolean("include_qr").default(false),
    includeTaxNumber: boolean("include_tax_number").default(true),
    includePaymentDetails: boolean("include_payment_details").default(true),
    
    // Content templates
    paymentTerms: integer("payment_terms"), // days
    note: text(),
    terms: text(),
    paymentDetails: text("payment_details"),
    
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("invoice_templates_team_idx").on(table.teamId),
  ]
);

export const invoiceComments = pgTable(
  "invoice_comments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("invoice_comments_invoice_idx").on(table.invoiceId),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer().notNull(), // in cents
    currency: currencyEnum().default("AUD").notNull(),
    paymentDate: date("payment_date", { mode: "string" }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    reference: varchar({ length: 255 }),
    note: text(),
    created_by: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_invoice_idx").on(table.invoiceId),
    index("payments_date_idx").on(table.paymentDate),
  ]
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum().notNull(),
    enabled: boolean().default(true).notNull(),
    email: boolean().default(true).notNull(),
    inApp: boolean("in_app").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.userId, table.teamId, table.type),
    index("notification_settings_user_team_idx").on(table.userId, table.teamId),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar({ length: 50 }).notNull(),
    entity: varchar({ length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb().default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("activities_team_idx").on(table.teamId),
    index("activities_entity_idx").on(table.entity, table.entityId),
    index("activities_created_idx").on(table.createdAt),
  ]
);

// Jobs table for dirt receiving tracking
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "in_progress", 
  "completed",
  "invoiced",
  "cancelled"
]);

export const dirtTypeEnum = pgEnum("dirt_type", [
  "clean_fill",
  "topsoil",
  "contaminated",
  "mixed",
  "clay",
  "sand",
  "gravel",
  "concrete",
  "asphalt",
  "other"
]);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "restrict" })
      .notNull(),
    jobNumber: varchar("job_number", { length: 50 }).notNull(),
    
    // Location details
    sourceLocation: varchar("source_location", { length: 255 }).notNull(), // Where dirt is coming from
    sourceAddress: text("source_address"),
    destinationSite: varchar("destination_site", { length: 255 }), // Where it's being deposited
    
    // Dirt details
    dirtType: dirtTypeEnum("dirt_type").notNull(),
    quantityCubicMeters: numericCasted("quantity_cubic_meters", { precision: 10, scale: 2 }).notNull(), // m³
    weightKg: numericCasted("weight_kg", { precision: 12, scale: 2 }), // kg (optional)
    pricePerCubicMeter: integer("price_per_cubic_meter").notNull(), // cents per m³
    totalAmount: integer("total_amount").notNull(), // total in cents
    
    // Tracking
    status: jobStatusEnum().default("pending").notNull(),
    scheduledDate: date("scheduled_date", { mode: "string" }),
    arrivalTime: timestamp("arrival_time", { mode: "string" }),
    completedTime: timestamp("completed_time", { mode: "string" }),
    
    // Linking
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    
    // Additional info
    truckNumber: varchar("truck_number", { length: 50 }),
    driverName: varchar("driver_name", { length: 255 }),
    notes: text(),
    photos: jsonb().default([]), // Array of photo URLs
    
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.teamId, table.jobNumber),
    index("jobs_team_idx").on(table.teamId),
    index("jobs_customer_idx").on(table.customerId),
    index("jobs_status_idx").on(table.status),
    index("jobs_invoice_idx").on(table.invoiceId),
    index("jobs_scheduled_date_idx").on(table.scheduledDate),
  ]
);


export const documents = pgTable(
  "documents",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    metadata: jsonb(),
    pathTokens: text("path_tokens").array(),
    teamId: uuid("team_id"),
    parentId: text("parent_id"),
    objectId: uuid("object_id"),
    ownerId: uuid("owner_id"),
    tag: text(),
    title: text(),
    body: text(),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`to_tsvector('english'::regconfig, ((title || ' '::text) || body))`,
      ),
    summary: text(),
    content: text(),
    date: date(),
    language: text(),
    processingStatus:
      documentProcessingStatusEnum("processing_status").default("pending"),
    ftsSimple: tsvector("fts_simple"),
    ftsEnglish: tsvector("fts_english"),
    ftsLanguage: tsvector("fts_language"),
  },
  (table) => [
    index("documents_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("documents_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("documents_team_id_parent_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("text_ops"),
      table.parentId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_documents_fts_english").using(
      "gin",
      table.ftsEnglish.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_documents_fts_language").using(
      "gin",
      table.ftsLanguage.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_documents_fts_simple").using(
      "gin",
      table.ftsSimple.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_gin_documents_title").using(
      "gin",
      table.title.asc().nullsLast().op("gin_trgm_ops"),
    ),
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
      name: "documents_created_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "storage_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Documents can be deleted by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Documents can be selected by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
    }),
    pgPolicy("Documents can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
    }),
  ],
);


export const documentTagAssignments = pgTable(
  "document_tag_assignments",
  {
    documentId: uuid("document_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    index("idx_document_tag_assignments_document_id").using(
      "btree",
      table.documentId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_document_tag_assignments_tag_id").using(
      "btree",
      table.tagId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.id],
      name: "document_tag_assignments_document_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [documentTags.id],
      name: "document_tag_assignments_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "document_tag_assignments_team_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.documentId, table.tagId],
      name: "document_tag_assignments_pkey",
    }),
    unique("document_tag_assignments_unique").on(table.documentId, table.tagId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "document_tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_slug_per_team").on(table.slug, table.teamId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);


export const shortLinks = pgTable(
  "short_links",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    shortId: text("short_id").notNull(),
    url: text().notNull(),
    type: text("type"),
    size: numericCasted("size", { precision: 10, scale: 2 }),
    mimeType: text("mime_type"),
    fileName: text("file_name"),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("short_links_short_id_idx").using(
      "btree",
      table.shortId.asc().nullsLast().op("text_ops"),
    ),
    index("short_links_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("short_links_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "short_links_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "short_links_team_id_fkey",
    }).onDelete("cascade"),
    unique("short_links_short_id_unique").on(table.shortId),
    pgPolicy("Short links can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [users.id],
    references: [usersInAuth.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  usersOnTeams: many(usersOnTeam),
  invoices: many(invoices),
  invoicesCreated: many(invoices),
  comments: many(invoiceComments),
  activities: many(activities),
  notificationSettings: many(notificationSettings),
  jobsCreated: many(jobs),
  documents: many(documents),
}));

export const shortLinksRelations = relations(shortLinks, ({ one }) => ({
  user: one(users, {
    fields: [shortLinks.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [shortLinks.teamId],
    references: [teams.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [documents.teamId],
    references: [teams.id],
  }),
  documentTagAssignments: many(documentTagAssignments),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  usersOnTeams: many(usersOnTeam),
  invites: many(userInvites),
  customers: many(customers),
  invoices: many(invoices),
  templates: many(invoiceTemplates),
  activities: many(activities),
  jobs: many(jobs),
  documents: many(documents),
}));

export const usersOnTeamRelations = relations(usersOnTeam, ({ one }) => ({
  user: one(users, {
    fields: [usersOnTeam.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [usersOnTeam.teamId],
    references: [teams.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  team: one(teams, {
    fields: [customers.teamId],
    references: [teams.id],
  }),
  invoices: many(invoices),
  jobs: many(jobs),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  template: one(invoiceTemplates, {
    fields: [invoices.templateId],
    references: [invoiceTemplates.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  comments: many(invoiceComments),
  payments: many(payments),
  jobs: many(jobs),
}));

export const invoiceTemplatesRelations = relations(invoiceTemplates, ({ one, many }) => ({
  team: one(teams, {
    fields: [invoiceTemplates.teamId],
    references: [teams.id],
  }),
  invoices: many(invoices),
}));

export const invoiceCommentsRelations = relations(invoiceComments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceComments.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [invoiceComments.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  team: one(teams, {
    fields: [jobs.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [jobs.invoiceId],
    references: [invoices.id],
  }),
  creator: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
}));