import { pgTable, index, unique, uuid, varchar, timestamp, jsonb, boolean, text, smallint, integer, foreignKey, pgPolicy, numeric, date, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const currency = pgEnum("currency", ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'JPY', 'CNY', 'INR'])
export const dirtType = pgEnum("dirt_type", ['clean_fill', 'topsoil', 'contaminated', 'mixed', 'clay', 'sand', 'gravel', 'concrete', 'asphalt', 'other'])
export const documentProcessingStatus = pgEnum("document_processing_status", ['pending', 'processing', 'completed', 'failed'])
export const inviteStatus = pgEnum("invite_status", ['pending', 'accepted', 'declined', 'expired'])
export const invoiceDeliveryType = pgEnum("invoice_delivery_type", ['create', 'create_and_send', 'scheduled'])
export const invoiceSize = pgEnum("invoice_size", ['a4', 'letter'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'unpaid', 'paid', 'canceled', 'overdue', 'partially_paid', 'scheduled'])
export const jobStatus = pgEnum("job_status", ['pending', 'in_progress', 'completed', 'invoiced', 'cancelled'])
export const notificationType = pgEnum("notification_type", ['invoice_created', 'invoice_paid', 'invoice_overdue', 'invoice_reminder', 'payment_received', 'payment_failed'])
export const paymentMethod = pgEnum("payment_method", ['bank_transfer', 'credit_card', 'cash', 'check', 'other'])
export const plans = pgEnum("plans", ['trial', 'free', 'pro', 'enterprise'])
export const reportTypes = pgEnum("reportTypes", ['profit', 'revenue', 'burn_rate', 'expense'])
export const teamRoles = pgEnum("teamRoles", ['owner', 'member'])
export const teamRole = pgEnum("team_role", ['owner', 'member'])


export const authUsers = pgTable("auth.users", {
	instanceId: uuid("instance_id"),
	id: uuid().notNull(),
	aud: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	encryptedPassword: varchar("encrypted_password", { length: 255 }),
	emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true, mode: 'string' }),
	invitedAt: timestamp("invited_at", { withTimezone: true, mode: 'string' }),
	confirmationToken: varchar("confirmation_token", { length: 255 }),
	confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true, mode: 'string' }),
	recoveryToken: varchar("recovery_token", { length: 255 }),
	recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true, mode: 'string' }),
	emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
	emailChange: varchar("email_change", { length: 255 }),
	emailChangeSentAt: timestamp("email_change_sent_at", { withTimezone: true, mode: 'string' }),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	rawAppMetaData: jsonb("raw_app_meta_data"),
	rawUserMetaData: jsonb("raw_user_meta_data"),
	isSuperAdmin: boolean("is_super_admin"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phone: text().default(sql`NULL`),
	phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true, mode: 'string' }),
	phoneChange: text("phone_change").default('),
	phoneChangeToken: varchar("phone_change_token", { length: 255 }).default('),
	phoneChangeSentAt: timestamp("phone_change_sent_at", { withTimezone: true, mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
	emailChangeTokenCurrent: varchar("email_change_token_current", { length: 255 }).default('),
	emailChangeConfirmStatus: smallint("email_change_confirm_status").default(0),
	bannedUntil: timestamp("banned_until", { withTimezone: true, mode: 'string' }),
	reauthenticationToken: varchar("reauthentication_token", { length: 255 }).default('),
	reauthenticationSentAt: timestamp("reauthentication_sent_at", { withTimezone: true, mode: 'string' }),
	isSsoUser: boolean("is_sso_user").default(false).notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	index("users_instance_id_email_idx").using("btree", sql`instance_id`, sql`lower((email)::text)`),
	index("users_instance_id_idx").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("users_is_anonymous_idx").using("btree", table.isAnonymous.asc().nullsLast().op("bool_ops")),
	unique("users_email_partial_key").on(table.email),
	unique("confirmation_token_idx").on(table.confirmationToken),
	unique("recovery_token_idx").on(table.recoveryToken),
	unique("email_change_token_new_idx").on(table.emailChangeTokenNew),
	unique("users_phone_key").on(table.phone),
	unique("email_change_token_current_idx").on(table.emailChangeTokenCurrent),
	unique("reauthentication_token_idx").on(table.reauthenticationToken),
]);

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	logoUrl: text("logo_url"),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	address: text(),
	plan: plans().default('trial').notNull(),
	inboxId: varchar("inbox_id", { length: 255 }),
	inboxEmail: varchar("inbox_email", { length: 255 }),
	inboxForwarding: boolean("inbox_forwarding").default(true),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	country: varchar({ length: 100 }),
	countryCode: varchar("country_code", { length: 2 }),
	postalCode: varchar("postal_code", { length: 20 }),
	taxNumber: varchar("tax_number", { length: 50 }),
	baseCurrency: currency("base_currency").default('AUD').notNull(),
	invoicePrefix: varchar("invoice_prefix", { length: 10 }).default('INV'),
	nextInvoiceNumber: integer("next_invoice_number").default(1).notNull(),
	paymentTerms: integer("payment_terms").default(30),
	invoiceNotes: text("invoice_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("teams_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const activities = pgTable("activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id"),
	action: varchar({ length: 50 }).notNull(),
	entity: varchar({ length: 50 }).notNull(),
	entityId: uuid("entity_id"),
	metadata: jsonb().default({}),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activities_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("activities_entity_idx").using("btree", table.entity.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("activities_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "activities_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activities_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	email: text(),
	teamId: uuid("team_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	locale: text().default('en'),
	timezone: text(),
	timeFormat: numeric("time_format").default('24'),
	dateFormat: text("date_format"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("users_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.id],
			foreignColumns: [table.id],
			name: "users_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "users_team_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can insert their own profile.", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(auth.uid() = id)`  }),
	pgPolicy("Users can select their own profile.", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can select users if they are in the same team", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users can update own profile.", { as: "permissive", for: "update", to: ["public"] }),
]);

export const apps = pgTable("apps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").defaultRandom(),
	config: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	appId: text("app_id").notNull(),
	createdBy: uuid("created_by").defaultRandom(),
	settings: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "apps_created_by_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "integrations_team_id_fkey"
		}).onDelete("cascade"),
	unique("unique_app_id_team_id").on(table.teamId, table.appId),
	pgPolicy("Apps can be inserted by a member of the team", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Apps can be selected by a member of the team", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Apps can be updated by a member of the team", { as: "permissive", for: "update", to: ["public"] }),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	addressLine1: text("address_line_1"),
	addressLine2: text("address_line_2"),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	country: text(),
	countryCode: text("country_code").default('AU'),
	postalCode: varchar("postal_code", { length: 20 }),
	taxNumber: varchar("tax_number", { length: 50 }),
	abn: varchar({ length: 50 }),
	currency: currency().default('AUD'),
	token: text().default(').notNull(),
	note: text(),
	tags: jsonb().default([]),
	contact: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	// TODO: failed to parse database type 'tsvector'
	fts: unknown("fts").notNull().generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (((((((((((((((((((COALESCE(name, (''::text)::character varying))::text || ' '::text) || COALESCE(contact, ''::text)) || ' '::text) || (COALESCE(phone, (''::text)::character varying))::text) || ' '::text) || (COALESCE(email, (''::text)::character varying))::text) || ' '::text) || COALESCE(address_line_1, ''::text)) || ' '::text) || COALESCE(address_line_2, ''::text)) || ' '::text) || (COALESCE(city, (''::text)::character varying))::text) || ' '::text) || (COALESCE(state, (''::text)::character varying))::text) || ' '::text) || (COALESCE(postal_code, (''::text)::character varying))::text) || ' '::text) || COALESCE(country, ''::text)))`),
}, (table) => [
	index("customers_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("customers_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("customers_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "customers_team_id_teams_id_fk"
		}).onDelete("cascade"),
]);

export const documentTags = pgTable("document_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "document_tags_team_id_fkey"
		}).onDelete("cascade"),
	unique("unique_slug_per_team").on(table.slug, table.teamId),
]);

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	customerId: uuid("customer_id"),
	templateId: uuid("template_id"),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	paidDate: date("paid_date"),
	status: invoiceStatus().default('draft').notNull(),
	currency: currency().default('AUD').notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 10, scale:  4 }).default('1'),
	subtotal: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	discountRate: numeric("discount_rate", { precision: 5, scale:  2 }).default('0'),
	discountAmount: integer("discount_amount").default(0).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	paidAmount: numeric("paid_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	lineItems: jsonb("line_items").default([]).notNull(),
	note: text(),
	terms: text(),
	paymentDetails: text("payment_details"),
	fromDetails: text("from_details"),
	customerDetails: text("customer_details"),
	noteDetails: text("note_details"),
	template: jsonb(),
	token: text(),
	amount: numeric({ precision: 10, scale:  2 }).default('0'),
	userId: uuid("user_id"),
	customerName: text("customer_name"),
	invoiceDate: date("invoice_date"),
	tax: numeric({ precision: 10, scale:  2 }).default('0'),
	vat: numeric({ precision: 10, scale:  2 }).default('0'),
	discount: numeric({ precision: 10, scale:  2 }).default('0'),
	topBlock: text("top_block"),
	bottomBlock: text("bottom_block"),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
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
	size: invoiceSize().default('a4'),
	dateFormat: text("date_format"),
	includeVat: boolean("include_vat"),
	includeTax: boolean("include_tax"),
	deliveryType: invoiceDeliveryType("delivery_type").default('create').notNull(),
	discountLabel: text("discount_label"),
	includeDiscount: boolean("include_discount"),
	includeDecimals: boolean("include_decimals"),
	totalSummaryLabel: text("total_summary_label"),
	title: text(),
	vatRate: numeric("vat_rate", { precision: 10, scale:  2 }),
	includeUnits: boolean("include_units"),
	subtotalLabel: text("subtotal_label"),
	includePdf: boolean("include_pdf"),
	sendCopy: boolean("send_copy"),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	reminderSentAt: timestamp("reminder_sent_at", { mode: 'string' }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }),
	downloadedAt: timestamp("downloaded_at", { mode: 'string' }),
	metadata: jsonb().default({}),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("invoices_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("invoices_due_date_idx").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("invoices_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("invoices_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "invoices_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "invoices_customer_id_customers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invoices_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [invoiceTemplates.id],
			name: "invoices_template_id_invoice_templates_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "invoices_user_id_users_id_fk"
		}),
	unique("invoices_team_id_invoice_number_unique").on(table.teamId, table.invoiceNumber),
]);

export const invoiceComments = pgTable("invoice_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("invoice_comments_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_comments_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "invoice_comments_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const invoiceTemplates = pgTable("invoice_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
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
	size: invoiceSize().default('a4'),
	dateFormat: text("date_format"),
	includeVat: boolean("include_vat"),
	includeTax: boolean("include_tax"),
	taxRate: numeric("tax_rate", { precision: 10, scale:  2 }),
	deliveryType: invoiceDeliveryType("delivery_type").default('create').notNull(),
	discountLabel: text("discount_label"),
	includeDiscount: boolean("include_discount"),
	includeDecimals: boolean("include_decimals"),
	includeQr: boolean("include_qr"),
	totalSummaryLabel: text("total_summary_label"),
	title: text(),
	vatRate: numeric("vat_rate", { precision: 10, scale:  2 }),
	includeUnits: boolean("include_units"),
	subtotalLabel: text("subtotal_label"),
	includePdf: boolean("include_pdf"),
	sendCopy: boolean("send_copy"),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invoice_settings_team_id_fkey"
		}).onDelete("cascade"),
	unique("invoice_templates_team_id_key").on(table.teamId),
]);

export const jobs = pgTable("jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	customerId: uuid("customer_id"),
	jobNumber: varchar("job_number", { length: 50 }),
	contactPerson: varchar("contact_person", { length: 255 }),
	contactNumber: varchar("contact_number", { length: 50 }),
	rego: varchar({ length: 20 }),
	loadNumber: integer("load_number").default(1),
	companyName: varchar("company_name", { length: 255 }),
	addressSite: text("address_site"),
	equipmentType: varchar("equipment_type", { length: 100 }),
	materialType: varchar("material_type", { length: 100 }),
	pricePerUnit: numeric("price_per_unit", { precision: 10, scale:  2 }),
	cubicMetreCapacity: numeric("cubic_metre_capacity", { precision: 10, scale:  2 }),
	jobDate: date("job_date"),
	sourceLocation: varchar("source_location", { length: 255 }),
	sourceAddress: text("source_address"),
	destinationSite: varchar("destination_site", { length: 255 }),
	dirtType: dirtType("dirt_type"),
	quantityCubicMeters: numeric("quantity_cubic_meters", { precision: 10, scale:  2 }),
	weightKg: numeric("weight_kg", { precision: 12, scale:  2 }),
	pricePerCubicMeter: numeric("price_per_cubic_meter", { precision: 10, scale:  2 }),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	status: jobStatus().default('pending').notNull(),
	scheduledDate: date("scheduled_date"),
	arrivalTime: timestamp("arrival_time", { mode: 'string' }),
	completedTime: timestamp("completed_time", { mode: 'string' }),
	invoiceId: uuid("invoice_id"),
	truckNumber: varchar("truck_number", { length: 50 }),
	driverName: varchar("driver_name", { length: 255 }),
	notes: text(),
	photos: jsonb().default([]),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("jobs_company_name_idx").using("btree", table.companyName.asc().nullsLast().op("text_ops")),
	index("jobs_contact_person_idx").using("btree", table.contactPerson.asc().nullsLast().op("text_ops")),
	index("jobs_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("jobs_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	index("jobs_job_date_idx").using("btree", table.jobDate.asc().nullsLast().op("date_ops")),
	index("jobs_rego_idx").using("btree", table.rego.asc().nullsLast().op("text_ops")),
	index("jobs_scheduled_date_idx").using("btree", table.scheduledDate.asc().nullsLast().op("date_ops")),
	index("jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("jobs_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "jobs_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "jobs_customer_id_customers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "jobs_invoice_id_invoices_id_fk"
		}).onDelete("set null"),
]);

export const notificationSettings = pgTable("notification_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	teamId: uuid("team_id").notNull(),
	type: notificationType().notNull(),
	enabled: boolean().default(true).notNull(),
	email: boolean().default(true).notNull(),
	inApp: boolean("in_app").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notification_settings_user_team_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "notification_settings_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("notification_settings_user_id_team_id_type_unique").on(table.userId, table.teamId, table.type),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: currency().default('AUD').notNull(),
	paymentDate: date("payment_date").notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	reference: varchar({ length: 255 }),
	note: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payments_date_idx").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	index("payments_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "payments_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payments_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	linkId: text("link_id"),
	teamId: uuid("team_id"),
	shortLink: text("short_link"),
	from: timestamp({ withTimezone: true, mode: 'string' }),
	to: timestamp({ withTimezone: true, mode: 'string' }),
	type: reportTypes(),
	expireAt: timestamp("expire_at", { withTimezone: true, mode: 'string' }),
	currency: text(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("reports_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "public_reports_created_by_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "reports_team_id_fkey"
		}).onDelete("cascade"),
]);

export const shortLinks = pgTable("short_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shortId: text("short_id").notNull(),
	url: text().notNull(),
	type: text(),
	size: numeric({ precision: 10, scale:  2 }),
	mimeType: text("mime_type"),
	fileName: text("file_name"),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("short_links_short_id_idx").using("btree", table.shortId.asc().nullsLast().op("text_ops")),
	index("short_links_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("short_links_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "short_links_team_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "short_links_user_id_fkey"
		}).onDelete("cascade"),
	unique("short_links_short_id_unique").on(table.shortId),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 7 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("tags_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("tags_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "tags_team_id_teams_id_fk"
		}).onDelete("cascade"),
	unique("tags_team_id_name_unique").on(table.teamId, table.name),
]);

export const userInvites = pgTable("user_invites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	role: teamRole().default('member').notNull(),
	status: inviteStatus().default('pending').notNull(),
	invitedBy: uuid("invited_by"),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_invites_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("user_invites_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "user_invites_invited_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "user_invites_team_id_teams_id_fk"
		}).onDelete("cascade"),
	unique("user_invites_team_id_email_unique").on(table.teamId, table.email),
]);

export const customerMaterialPricing = pgTable("customer_material_pricing", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	materialType: varchar("material_type", { length: 100 }).notNull(),
	customPrice: numeric("custom_price", { precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('AUD').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	notes: text(),
	effectiveFrom: timestamp("effective_from", { mode: 'string' }).defaultNow().notNull(),
	effectiveTo: timestamp("effective_to", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("customer_material_pricing_customer_material_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops"), table.materialType.asc().nullsLast().op("text_ops")),
	index("customer_material_pricing_team_customer_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops"), table.customerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "customer_material_pricing_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "customer_material_pricing_team_id_teams_id_fk"
		}).onDelete("cascade"),
]);

export const equipmentDefaults = pgTable("equipment_defaults", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	equipmentType: varchar("equipment_type", { length: 100 }).notNull(),
	defaultCapacity: numeric("default_capacity", { precision: 10, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("equipment_defaults_team_equipment_idx").using("btree", table.teamId.asc().nullsLast().op("text_ops"), table.equipmentType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "equipment_defaults_team_id_teams_id_fk"
		}).onDelete("cascade"),
]);

export const materialDefaults = pgTable("material_defaults", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	materialType: varchar("material_type", { length: 100 }).notNull(),
	defaultPrice: numeric("default_price", { precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('AUD').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("material_defaults_team_material_idx").using("btree", table.teamId.asc().nullsLast().op("text_ops"), table.materialType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "material_defaults_team_id_teams_id_fk"
		}).onDelete("cascade"),
]);

export const teamSettings = pgTable("team_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	defaultCurrency: varchar("default_currency", { length: 3 }).default('AUD').notNull(),
	autoCalculatePricing: boolean("auto_calculate_pricing").default(true).notNull(),
	autoFillCapacity: boolean("auto_fill_capacity").default(true).notNull(),
	defaultJobStatus: varchar("default_job_status", { length: 20 }).default('delivered').notNull(),
	businessHoursStart: varchar("business_hours_start", { length: 5 }).default('07:00').notNull(),
	businessHoursEnd: varchar("business_hours_end", { length: 5 }).default('17:00').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("team_settings_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_settings_team_id_teams_id_fk"
		}).onDelete("cascade"),
	unique("team_settings_team_id_unique").on(table.teamId),
]);

export const usersOnTeam = pgTable("users_on_team", {
	userId: uuid("user_id").notNull(),
	teamId: uuid("team_id").notNull(),
	id: uuid().defaultRandom().notNull(),
	role: teamRoles(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("users_on_team_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("users_on_team_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "users_on_team_team_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "users_on_team_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.teamId, table.id], name: "members_pkey"}),
	pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true`  }),
	pgPolicy("Enable updates for users on team", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Select for current user teams", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("Users on team can be deleted by a member of the team", { as: "permissive", for: "delete", to: ["public"] }),
]);
