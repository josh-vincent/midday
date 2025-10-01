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
export const reportTypesEnum = pgEnum("reportTypes", [
  "profit",
  "revenue",
  "burn_rate",
  "expense",
]);

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
export const invoiceDeliveryTypeEnum = pgEnum("invoice_delivery_type", [
  "create",
  "create_and_send",
  "scheduled",
]);

export const invoiceSizeEnum = pgEnum("invoice_size", ["a4", "letter"]);

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
    // primaryKey({ columns: [table.id], name: "users_pkey" }),
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
      table.teamId.asc().nullsLast(),
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
      table.teamId.asc().nullsLast(),
    ),
    index("users_on_team_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast(),
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
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    country: text(),
    countryCode: text("country_code").default("AU"),
    postalCode: varchar("postal_code", { length: 20 }),
    taxNumber: varchar("tax_number", { length: 50 }),
    abn: varchar("abn", { length: 50 }),
    currency: currencyEnum().default("AUD"),
    token: text().default("").notNull(),
    note: text(),
    tags: jsonb().default([]),
    contact: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
				to_tsvector(
					'english'::regconfig,
					COALESCE(name, ''::text) || ' ' ||
					COALESCE(contact, ''::text) || ' ' ||
					COALESCE(phone, ''::text) || ' ' ||
					COALESCE(email, ''::text) || ' ' ||
					COALESCE(address_line_1, ''::text) || ' ' ||
					COALESCE(address_line_2, ''::text) || ' ' ||
					COALESCE(city, ''::text) || ' ' ||
					COALESCE(state, ''::text) || ' ' ||
					COALESCE(postal_code, ''::text) || ' ' ||
					COALESCE(country, ''::text)
				)
			`,
      ),
  },
  (table) => [
    index("customers_team_idx").on(table.teamId),
    index("customers_name_idx").on(table.name),
    index("customers_email_idx").on(table.email),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar({ length: 100 }).notNull(),
    color: varchar({ length: 7 }), // Hex color code
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.teamId, table.name), // Unique tag name per team
    index("tags_team_idx").on(table.teamId),
    index("tags_name_idx").on(table.name),
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
      .references(() => customers.id, { onDelete: "restrict" }),
    templateId: uuid("template_id").references(() => invoiceTemplates.id),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    paidDate: date("paid_date", { mode: "string" }),
    status: invoiceStatusEnum().default("draft").notNull(),
    currency: currencyEnum().default("AUD").notNull(),
    exchangeRate: numericCasted("exchange_rate", { precision: 10, scale: 4 }).default(1),
    
    // Amounts
    subtotal: numericCasted("subtotal", { precision: 10, scale: 2 }).default(0).notNull(), // in cents
    taxRate: numericCasted("tax_rate", { precision: 5, scale: 2 }).default(0),
    taxAmount: numericCasted("tax_amount", { precision: 10, scale: 2 }).default(0).notNull(), // in cents
    discountRate: numericCasted("discount_rate", { precision: 5, scale: 2 }).default(0),
    discountAmount: integer("discount_amount").default(0).notNull(), // in cents
    totalAmount: numericCasted("total_amount", { precision: 10, scale: 2 }).default(0).notNull(), // in cents
    paidAmount: numericCasted("paid_amount", { precision: 10, scale: 2 }).default(0).notNull(), // in cents
    
    // Content
    lineItems: jsonb("line_items").default([]).notNull(),
    note: text(),
    terms: text(),
    paymentDetails: text("payment_details"),
    fromDetails: text("from_details"),
    customerDetails: text("customer_details"),
    noteDetails: text("note_details"),
    template: jsonb(),
    token: text(),
    amount: numericCasted("amount", { precision: 10, scale: 2 }).default(0),
    userId: uuid("user_id").references(() => users.id),
    customerName: text("customer_name"),
    invoiceDate: date("invoice_date", { mode: "string" }),
    tax: numericCasted("tax", { precision: 10, scale: 2 }).default(0),
    vat: numericCasted("vat", { precision: 10, scale: 2 }).default(0),
    discount: numericCasted("discount", { precision: 10, scale: 2 }).default(0),
    topBlock: text("top_block"),
    bottomBlock: text("bottom_block"),
    scheduledAt: timestamp("scheduled_at", { mode: "string" }),
    scheduledJobId: text("scheduled_job_id"),
    logoUrl: text("logo_url"),
    

    invoiceNoLabel: text("invoice_no_label"),
    issueDateLabel: text("issue_date_label"),
    dueDateLabel: text("due_date_label"),
    descriptionLabel: text("description_label"),
    priceLabel: text("price_label"),
    quantityLabel: text("quantity_label"),
    totalLabel: text("total_label"),
    vatLabel: text("vat_label"),
    taxLabel: text("tax_label"),
    paymentLabel: text("payment_label"),
    noteLabel: text("note_label"),
    size: invoiceSizeEnum().default("a4"),
    dateFormat: text("date_format"),
    includeVat: boolean("include_vat"),
    includeTax: boolean("include_tax"),
    deliveryType: invoiceDeliveryTypeEnum("delivery_type")
      .default("create")
      .notNull(),
    discountLabel: text("discount_label"),
    includeDiscount: boolean("include_discount"),
    includeDecimals: boolean("include_decimals"),
    totalSummaryLabel: text("total_summary_label"),
    title: text(),
    vatRate: numericCasted("vat_rate", { precision: 10, scale: 2 }),
    includeUnits: boolean("include_units"),
    subtotalLabel: text("subtotal_label"),
    includePdf: boolean("include_pdf"),
    sendCopy: boolean("send_copy"),

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

// Invoice Products - reusable product catalog for line items
export const invoiceProducts = pgTable(
  "invoice_products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    description: text(),
    price: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    unit: text(),
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Full-text search for product names and descriptions
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
          to_tsvector(
            'english',
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        `,
      ),
  },
  (table) => [
    index("invoice_products_team_id_idx").on(table.teamId),
    index("invoice_products_created_by_idx").on(table.createdBy),
    index("invoice_products_fts_idx").using("gin", table.fts),
    index("invoice_products_name_idx").on(table.name),
    index("invoice_products_usage_count_idx").on(table.usageCount),
    index("invoice_products_last_used_at_idx").on(table.lastUsedAt),
    // Composite index for team + active status for fast filtering
    index("invoice_products_team_active_idx").on(table.teamId, table.isActive),
    // Unique constraint for upsert operations (team + name + currency + price combination)
    unique("invoice_products_team_name_currency_price_unique").on(
      table.teamId,
      table.name,
      table.currency,
      table.price,
    ),
    pgPolicy("Enable read access for team members", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable insert access for team members", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable update access for team members", {
      as: "permissive",
      for: "update",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable delete access for team members", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
  ]
);

export const invoiceTemplates = pgTable(
  "invoice_templates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull().default("Default Template"),
    description: text(),
    isDefault: boolean("is_default").default(false).notNull(),
    customerLabel: text("customer_label"),
    fromLabel: text("from_label"),
    invoiceNoLabel: text("invoice_no_label"),
    issueDateLabel: text("issue_date_label"),
    dueDateLabel: text("due_date_label"),
    descriptionLabel: text("description_label"),
    priceLabel: text("price_label"),
    quantityLabel: text("quantity_label"),
    totalLabel: text("total_label"),
    vatLabel: text("vat_label"),
    taxLabel: text("tax_label"),
    paymentLabel: text("payment_label"),
    noteLabel: text("note_label"),
    logoUrl: text("logo_url"),
    currency: text(),
    paymentDetails: jsonb("payment_details"),
    fromDetails: jsonb("from_details"),
    size: invoiceSizeEnum().default("a4"),
    dateFormat: text("date_format"),
    includeVat: boolean("include_vat"),
    includeTax: boolean("include_tax"),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    deliveryType: invoiceDeliveryTypeEnum("delivery_type")
      .default("create")
      .notNull(),
    discountLabel: text("discount_label"),
    includeDiscount: boolean("include_discount"),
    includeDecimals: boolean("include_decimals"),
    includeQr: boolean("include_qr"),
    totalSummaryLabel: text("total_summary_label"),
    title: text(),
    vatRate: numericCasted("vat_rate", { precision: 10, scale: 2 }),
    includeUnits: boolean("include_units"),
    subtotalLabel: text("subtotal_label"),
    includePdf: boolean("include_pdf"),
    sendCopy: boolean("send_copy"),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "invoice_settings_team_id_fkey",
    }).onDelete("cascade"),
    // Removed unique constraint on teamId to allow multiple templates per team
    // unique("invoice_templates_team_id_key").on(table.teamId),
    // Ensure template names are unique within a team
    unique("invoice_templates_team_name_key").on(table.teamId, table.name),
    // pgPolicy("Invoice templates can be handled by a member of the team", {
    //   as: "permissive",
    //   for: "all",
    //   to: ["public"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
  ],
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
    amount: numericCasted("amount", { precision: 10, scale: 2 }).notNull(), // in cents
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
  "delivered",
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
      .references(() => customers.id, { onDelete: "restrict" }),
    jobNumber: varchar("job_number", { length: 50 }),
    
    // Contact details
    contactPerson: varchar("contact_person", { length: 255 }),
    contactNumber: varchar("contact_number", { length: 50 }),
    
    // Vehicle details
    rego: varchar("rego", { length: 20 }), // Vehicle registration
    loadNumber: integer("load_number").default(1), // Load count for the day
    
    // Company/Job details
    companyName: varchar("company_name", { length: 255 }), // Company/customer name
    addressSite: text("address_site"), // Full address/site description
    
    // Equipment and material
    equipmentType: varchar("equipment_type", { length: 100 }), // Truck & Trailer 22m3, Tandem 10m3, etc.
    materialType: varchar("material_type", { length: 100 }), // Dry Clean Fill, etc.
    pricePerUnit: numericCasted("price_per_unit", { precision: 10, scale: 2 }), // Price per cubic metre
    cubicMetreCapacity: numericCasted("cubic_metre_capacity", { precision: 10, scale: 2 }), // Load capacity in m3
    
    // Date tracking
    jobDate: date("job_date", { mode: "string" }), // Date of the job
    
    // Legacy fields (kept for compatibility, now optional)
    sourceLocation: varchar("source_location", { length: 255 }), // Where dirt is coming from
    sourceAddress: text("source_address"),
    destinationSite: varchar("destination_site", { length: 255 }), // Where it's being deposited
    dirtType: dirtTypeEnum("dirt_type"),
    quantityCubicMeters: numericCasted("quantity_cubic_meters", { precision: 10, scale: 2 }), // m³
    weightKg: numericCasted("weight_kg", { precision: 12, scale: 2 }), // kg (optional)
    pricePerCubicMeter: numericCasted("price_per_cubic_meter", { precision: 10, scale: 2 }), // cents per m³
    totalAmount: numericCasted("total_amount", { precision: 10, scale: 2 }), // total in cents
    
    // Tracking
    status: jobStatusEnum().default("pending").notNull(),
    scheduledDate: date("scheduled_date", { mode: "string" }),
    arrivalTime: timestamp("arrival_time", { mode: "string" }),
    completedTime: timestamp("completed_time", { mode: "string" }),
    
    // Linking - invoiceId for relationship, invoiceNumber for quick display
    // invoiceStatus is NOT stored - always derived from invoice table to stay in sync
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    invoiceNumber: varchar("invoice_number", { length: 50 }), // Store for display without join
    
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
    index("jobs_contact_person_idx").on(table.contactPerson),
    index("jobs_rego_idx").on(table.rego),
    index("jobs_company_name_idx").on(table.companyName),
    index("jobs_job_date_idx").on(table.jobDate),
  ]
);


export const apps = pgTable(
  "apps",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").defaultRandom(),
    config: jsonb(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    appId: text("app_id").notNull(),
    createdBy: uuid("created_by").defaultRandom(),
    settings: jsonb(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "apps_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "integrations_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_app_id_team_id").on(table.teamId, table.appId),
    // pgPolicy("Apps can be deleted by a member of the team", {
    //   as: "permissive",
    //   for: "delete",
    //   to: ["public"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    pgPolicy("Apps can be inserted by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Apps can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Apps can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
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
    // pgPolicy("Tags can be handled by a member of the team", {
    //   as: "permissive",
    //   for: "all",
    //   to: ["public"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
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
      table.shortId.asc().nullsLast(),
    ),
    index("short_links_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast(),
    ),
    index("short_links_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast(),
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
    // pgPolicy("Short links can be created by a member of the team", {
    //   as: "permissive",
    //   for: "insert",
    //   to: ["authenticated"],
    //   withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    // pgPolicy("Short links can be selected by a member of the team", {
    //   as: "permissive",
    //   for: "select",
    //   to: ["authenticated"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    // pgPolicy("Short links can be updated by a member of the team", {
    //   as: "permissive",
    //   for: "update",
    //   to: ["authenticated"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    // pgPolicy("Short links can be deleted by a member of the team", {
    //   as: "permissive",
    //   for: "delete",
    //   to: ["authenticated"],
    //   using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    linkId: text("link_id"),
    teamId: uuid("team_id"),
    shortLink: text("short_link"),
    from: timestamp({ withTimezone: true, mode: "string" }),
    to: timestamp({ withTimezone: true, mode: "string" }),
    type: reportTypesEnum(),
    expireAt: timestamp("expire_at", { withTimezone: true, mode: "string" }),
    currency: text(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("reports_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast(),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "public_reports_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "reports_team_id_fkey",
    }).onDelete("cascade"),
  ]
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
  shortLinks: many(shortLinks),
  reports: many(reports),
  notificationSettings: many(notificationSettings),
  jobsCreated: many(jobs),
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

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  usersOnTeams: many(usersOnTeam),
  invites: many(userInvites),
  customers: many(customers),
  invoices: many(invoices),
  templates: many(invoiceTemplates),
  activities: many(activities),
  jobs: many(jobs)
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

export const invoiceProductsRelations = relations(invoiceProducts, ({ one }) => ({
  team: one(teams, {
    fields: [invoiceProducts.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [invoiceProducts.createdBy],
    references: [users.id],
  }),
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

// ============================================
// Stripe Integration Tables
// ============================================

// Stripe-specific enums
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active", 
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused"
]);

export const intervalEnum = pgEnum("interval", [
  "day",
  "week",
  "month",
  "year"
]);

// Stripe Customer table - links teams to Stripe customers
export const stripeCustomers = pgTable(
  "stripe_customers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
      .unique()
      .notNull(),
    email: varchar({ length: 255 }),
    name: varchar({ length: 255 }),
    currency: varchar({ length: 3 }).default("USD"),
    defaultPaymentMethod: varchar("default_payment_method", { length: 255 }),
    invoicePrefix: varchar("invoice_prefix", { length: 10 }),
    balance: integer().default(0), // In cents
    delinquent: boolean().default(false),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_customers_team_idx").on(table.teamId),
    index("stripe_customers_stripe_id_idx").on(table.stripeCustomerId),
  ]
);

// Stripe Products - your subscription products
export const stripeProducts = pgTable(
  "stripe_products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stripeProductId: varchar("stripe_product_id", { length: 255 })
      .unique()
      .notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    active: boolean().default(true).notNull(),
    features: jsonb(), // Array of feature strings
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_products_stripe_id_idx").on(table.stripeProductId),
    index("stripe_products_active_idx").on(table.active),
  ]
);

// Stripe Prices - pricing for your products
export const stripePrices = pgTable(
  "stripe_prices",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 })
      .unique()
      .notNull(),
    stripeProductId: varchar("stripe_product_id", { length: 255 })
      .references(() => stripeProducts.stripeProductId, { onDelete: "cascade" })
      .notNull(),
    active: boolean().default(true).notNull(),
    unitAmount: integer("unit_amount"), // In cents, null for custom pricing
    currency: varchar({ length: 3 }).default("USD").notNull(),
    type: varchar({ length: 20 }).notNull(), // 'recurring' or 'one_time'
    interval: intervalEnum(),
    intervalCount: integer("interval_count"),
    trialPeriodDays: integer("trial_period_days"),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_prices_stripe_id_idx").on(table.stripePriceId),
    index("stripe_prices_product_idx").on(table.stripeProductId),
    index("stripe_prices_active_idx").on(table.active),
  ]
);

// Stripe Subscriptions - active subscriptions
export const stripeSubscriptions = pgTable(
  "stripe_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
      .references(() => stripeCustomers.stripeCustomerId, { onDelete: "cascade" })
      .notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
      .unique()
      .notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 })
      .references(() => stripePrices.stripePriceId)
      .notNull(),
    status: subscriptionStatusEnum().notNull(),
    quantity: integer().default(1).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at", { mode: "string" }),
    cancelAt: timestamp("cancel_at", { mode: "string" }),
    currentPeriodStart: timestamp("current_period_start", { mode: "string" }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { mode: "string" }).notNull(),
    endedAt: timestamp("ended_at", { mode: "string" }),
    trialStart: timestamp("trial_start", { mode: "string" }),
    trialEnd: timestamp("trial_end", { mode: "string" }),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_subscriptions_team_idx").on(table.teamId),
    index("stripe_subscriptions_customer_idx").on(table.stripeCustomerId),
    index("stripe_subscriptions_stripe_id_idx").on(table.stripeSubscriptionId),
    index("stripe_subscriptions_status_idx").on(table.status),
  ]
);

// Stripe Payment Methods
export const stripePaymentMethods = pgTable(
  "stripe_payment_methods",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
      .references(() => stripeCustomers.stripeCustomerId, { onDelete: "cascade" })
      .notNull(),
    stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 })
      .unique()
      .notNull(),
    type: varchar({ length: 50 }).notNull(), // 'card', 'bank_account', etc
    card: jsonb(), // Card details (last4, brand, exp_month, exp_year)
    billingDetails: jsonb("billing_details"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_payment_methods_customer_idx").on(table.stripeCustomerId),
    index("stripe_payment_methods_stripe_id_idx").on(table.stripePaymentMethodId),
  ]
);

// Stripe Invoices - sync Stripe invoices
export const stripeInvoices = pgTable(
  "stripe_invoices",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 })
      .unique()
      .notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
      .references(() => stripeCustomers.stripeCustomerId)
      .notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    number: varchar({ length: 255 }),
    status: varchar({ length: 50 }), // 'draft', 'open', 'paid', 'void', 'uncollectible'
    amountDue: integer("amount_due").notNull(), // In cents
    amountPaid: integer("amount_paid").default(0).notNull(),
    amountRemaining: integer("amount_remaining").default(0).notNull(),
    currency: varchar({ length: 3 }).notNull(),
    dueDate: timestamp("due_date", { mode: "string" }),
    paidAt: timestamp("paid_at", { mode: "string" }),
    periodStart: timestamp("period_start", { mode: "string" }),
    periodEnd: timestamp("period_end", { mode: "string" }),
    hostedInvoiceUrl: text("hosted_invoice_url"),
    invoicePdf: text("invoice_pdf"),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_invoices_customer_idx").on(table.stripeCustomerId),
    index("stripe_invoices_subscription_idx").on(table.stripeSubscriptionId),
    index("stripe_invoices_stripe_id_idx").on(table.stripeInvoiceId),
    index("stripe_invoices_status_idx").on(table.status),
  ]
);

// Webhook Events Log - track all webhook events
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    provider: varchar({ length: 50 }).notNull(), // 'stripe', 'gmail', 'outlook', etc
    eventId: varchar("event_id", { length: 255 }).unique().notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb().notNull(),
    processed: boolean().default(false).notNull(),
    processedAt: timestamp("processed_at", { mode: "string" }),
    error: text(),
    retryCount: integer("retry_count").default(0).notNull(),
    nextRetryAt: timestamp("next_retry_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_events_provider_idx").on(table.provider),
    index("webhook_events_type_idx").on(table.eventType),
    index("webhook_events_processed_idx").on(table.processed),
    index("webhook_events_retry_idx").on(table.nextRetryAt),
  ]
);

// Stripe Checkout Sessions - track checkout sessions
export const stripeCheckoutSessions = pgTable(
  "stripe_checkout_sessions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    sessionId: varchar("session_id", { length: 255 }).unique().notNull(),
    teamId: uuid("team_id").references(() => teams.id),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    status: varchar({ length: 50 }).notNull(), // 'open', 'complete', 'expired'
    mode: varchar({ length: 20 }).notNull(), // 'payment', 'setup', 'subscription'
    successUrl: text("success_url"),
    cancelUrl: text("cancel_url"),
    metadata: jsonb(),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    completedAt: timestamp("completed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_checkout_sessions_session_idx").on(table.sessionId),
    index("stripe_checkout_sessions_team_idx").on(table.teamId),
    index("stripe_checkout_sessions_status_idx").on(table.status),
  ]
);

// Usage Records - track usage for metered billing
export const stripeUsageRecords = pgTable(
  "stripe_usage_records",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stripeSubscriptionItemId: varchar("stripe_subscription_item_id", { length: 255 }).notNull(),
    quantity: integer().notNull(),
    timestamp: timestamp({ mode: "string" }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("stripe_usage_records_subscription_item_idx").on(table.stripeSubscriptionItemId),
    index("stripe_usage_records_timestamp_idx").on(table.timestamp),
  ]
);

// ============================================
// Stripe Relations
// ============================================

export const stripeCustomersRelations = relations(stripeCustomers, ({ one, many }) => ({
  team: one(teams, {
    fields: [stripeCustomers.teamId],
    references: [teams.id],
  }),
  subscriptions: many(stripeSubscriptions),
  paymentMethods: many(stripePaymentMethods),
  invoices: many(stripeInvoices),
}));

export const stripeProductsRelations = relations(stripeProducts, ({ many }) => ({
  prices: many(stripePrices),
}));

export const stripePricesRelations = relations(stripePrices, ({ one, many }) => ({
  product: one(stripeProducts, {
    fields: [stripePrices.stripeProductId],
    references: [stripeProducts.stripeProductId],
  }),
  subscriptions: many(stripeSubscriptions),
}));

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ one }) => ({
  team: one(teams, {
    fields: [stripeSubscriptions.teamId],
    references: [teams.id],
  }),
  customer: one(stripeCustomers, {
    fields: [stripeSubscriptions.stripeCustomerId],
    references: [stripeCustomers.stripeCustomerId],
  }),
  price: one(stripePrices, {
    fields: [stripeSubscriptions.stripePriceId],
    references: [stripePrices.stripePriceId],
  }),
}));

export const stripePaymentMethodsRelations = relations(stripePaymentMethods, ({ one }) => ({
  customer: one(stripeCustomers, {
    fields: [stripePaymentMethods.stripeCustomerId],
    references: [stripeCustomers.stripeCustomerId],
  }),
}));

export const stripeInvoicesRelations = relations(stripeInvoices, ({ one }) => ({
  customer: one(stripeCustomers, {
    fields: [stripeInvoices.stripeCustomerId],
    references: [stripeCustomers.stripeCustomerId],
  }),
}));

export * from "./schema/pricing";