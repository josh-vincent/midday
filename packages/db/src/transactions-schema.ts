import { users } from "./schema";
import { bigint, pgEnum, pgPolicy, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { foreignKey } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { inbox } from "./inbox-schema";
import { teams } from "./schema";
import { date } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { sql, SQL } from "drizzle-orm";
import { numericCasted, tsvector } from "./schema-old-old";
import { transactionTags } from "./schema-old-old";
import { bankAccounts } from "./schema-old-old";
import { relations } from "drizzle-orm";


export const transactionMethodsEnum = pgEnum("transactionMethods", [
  "payment",
  "card_purchase",
  "card_atm",
  "transfer",
  "other",
  "unknown",
  "ach",
  "interest",
  "deposit",
  "wire",
  "fee",
]);

export const transactionStatusEnum = pgEnum("transactionStatus", [
  "posted",
  "pending",
  "excluded",
  "completed",
  "archived",
]);

export const transactionFrequencyEnum = pgEnum("transaction_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "semi_monthly",
  "annually",
  "irregular",
  "unknown",
]);


export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    date: date().notNull(),
    name: text().notNull(),
    method: transactionMethodsEnum().notNull(),
    amount: numericCasted({ precision: 10, scale: 2 }).notNull(),
    currency: text().notNull(),
    teamId: uuid("team_id").notNull(),
    assignedId: uuid("assigned_id"),
    note: varchar(),
    bankAccountId: uuid("bank_account_id"),
    internalId: text("internal_id").notNull(),
    status: transactionStatusEnum().default("posted"),
    balance: numericCasted({ precision: 10, scale: 2 }),
    manual: boolean().default(false),
    notified: boolean().default(false),
    internal: boolean().default(false),
    description: text(),
    categorySlug: text("category_slug"),
    baseAmount: numericCasted({ precision: 10, scale: 2 }),
    counterpartyName: text("counterparty_name"),
    baseCurrency: text("base_currency"),
    taxRate: numericCasted({ precision: 10, scale: 2 }),
    taxType: text("tax_type"),
    recurring: boolean(),
    frequency: transactionFrequencyEnum(),
    merchantName: text("merchant_name"),
    enrichmentCompleted: boolean("enrichment_completed").default(false),
    ftsVector: tsvector("fts_vector")
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
    index("idx_transactions_date").using(
      "btree",
      table.date.asc().nullsLast().op("date_ops"),
    ),
    index("idx_transactions_fts").using(
      "gin",
      table.ftsVector.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_transactions_fts_vector").using(
      "gin",
      table.ftsVector.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_transactions_id").using(
      "btree",
      table.id.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_transactions_name").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("idx_transactions_name_trigram").using(
      "gin",
      table.name.asc().nullsLast().op("gin_trgm_ops"),
    ),
    index("idx_transactions_team_id_date_name").using(
      "btree",
      table.teamId.asc().nullsLast().op("date_ops"),
      table.date.asc().nullsLast().op("date_ops"),
      table.name.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_transactions_team_id_name").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.name.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_trgm_name").using(
      "gist",
      table.name.asc().nullsLast().op("gist_trgm_ops"),
    ),
    index("transactions_assigned_id_idx").using(
      "btree",
      table.assignedId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transactions_bank_account_id_idx").using(
      "btree",
      table.bankAccountId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transactions_category_slug_idx").using(
      "btree",
      table.categorySlug.asc().nullsLast().op("text_ops"),
    ),
    index(
      "transactions_team_id_date_currency_bank_account_id_category_idx",
    ).using(
      "btree",
      table.teamId.asc().nullsLast().op("enum_ops"),
      table.date.asc().nullsLast().op("date_ops"),
      table.currency.asc().nullsLast().op("text_ops"),
      table.bankAccountId.asc().nullsLast().op("date_ops"),
    ),
    index("transactions_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.assignedId],
      foreignColumns: [users.id],
      name: "public_transactions_assigned_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_transactions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.bankAccountId],
      foreignColumns: [bankAccounts.id],
      name: "transactions_bank_account_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId, table.categorySlug],
      foreignColumns: [
        transactionCategories.teamId,
        transactionCategories.slug,
      ],
      name: "transactions_category_slug_team_id_fkey",
    }),
    unique("transactions_internal_id_key").on(table.internalId),
    // pgPolicy("Transactions can be created by a member of the team", {
    //   as: "permissive",
    //   for: "insert",
    //   to: ["public"],
    //   withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    // pgPolicy("Transactions can be deleted by a member of the team", {
    //   as: "permissive",
    //   for: "delete",
    //   to: ["public"],
    // }),
    // pgPolicy("Transactions can be selected by a member of the team", {
    //   as: "permissive",
    //   for: "select",
    //   to: ["public"],
    // }),
    // pgPolicy("Transactions can be updated by a member of the team", {
    //   as: "permissive",
    //   for: "update",
    //   to: ["public"],
    // }),
  ],
);

export const transactionAttachments = pgTable(
  "transaction_attachments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    type: text(),
    transactionId: uuid("transaction_id"),
    teamId: uuid("team_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: "number" }),
    name: text(),
    path: text().array(),
  },
  (table) => [
    index("transaction_attachments_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_attachments_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_transaction_attachments_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "public_transaction_attachments_transaction_id_fkey",
    }).onDelete("set null"),
    // pgPolicy("Transaction Attachments can be created by a member of the team", {
    //   as: "permissive",
    //   for: "insert",
    //   to: ["public"],
    //   withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    // }),
    // pgPolicy("Transaction Attachments can be deleted by a member of the team", {
    //   as: "permissive",
    //   for: "delete",
    //   to: ["public"],
    // }),
    // pgPolicy(
    //   "Transaction Attachments can be selected by a member of the team",
    //   { as: "permissive", for: "select", to: ["public"] },
    // ),
    // pgPolicy("Transaction Attachments can be updated by a member of the team", {
    //   as: "permissive",
    //   for: "update",
    //   to: ["public"],
    // }),
  ],
);


export const transactionCategories = pgTable(
  "transaction_categories",
  {
    id: uuid().defaultRandom().notNull(),
    name: text().notNull(),
    teamId: uuid("team_id").notNull(),
    color: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    system: boolean().default(false),
    slug: text(), // Generated in database
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    taxType: text("tax_type"),
    taxReportingCode: text("tax_reporting_code"),
    excluded: boolean("excluded").default(false),
    description: text(),
    parentId: uuid("parent_id"),
  },
  (table) => [
    index("transaction_categories_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op(""),
    ),
    index("transaction_categories_parent_id_idx").using(
      "btree",
      table.parentId.asc().nullsLast().op(""),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_categories_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "transaction_categories_parent_id_fkey",
    }).onDelete("set null"),
    primaryKey({
      columns: [table.teamId, table.slug],
      name: "transaction_categories_pkey",
    }),
    unique("unique_team_slug").on(table.teamId, table.slug),
    pgPolicy("Users on team can manage categories", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [transactions.assignedId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [transactions.teamId],
      references: [teams.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [transactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    transactionCategory: one(transactionCategories, {
      fields: [transactions.teamId],
      references: [transactionCategories.teamId],
    }),
    transactionTags: many(transactionTags),
    transactionAttachments: many(transactionAttachments),
    inboxes: many(inbox),
  }),
);

export const transactionMatchSuggestions = pgTable(
  "transaction_match_suggestions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Core relationship
    teamId: uuid("team_id").notNull(),
    inboxId: uuid("inbox_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),

    // Match scores for transparency
    confidenceScore: numericCasted("confidence_score", {
      precision: 4,
      scale: 3,
    }).notNull(),
    amountScore: numericCasted("amount_score", { precision: 4, scale: 3 }),
    currencyScore: numericCasted("currency_score", { precision: 4, scale: 3 }),
    dateScore: numericCasted("date_score", { precision: 4, scale: 3 }),
    embeddingScore: numericCasted("embedding_score", {
      precision: 4,
      scale: 3,
    }),
    nameScore: numericCasted("name_score", { precision: 4, scale: 3 }),

    // Match context
    matchType: text("match_type").notNull(), // 'auto_matched', 'high_confidence', 'suggested'
    matchDetails: jsonb("match_details"),

    // User interaction tracking
    status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'declined', 'expired', 'unmatched'
    userActionAt: timestamp("user_action_at", {
      withTimezone: true,
      mode: "string",
    }),
    userId: uuid("user_id"),
  },
  (table) => [
    index("transaction_match_suggestions_inbox_id_idx").using(
      "btree",
      table.inboxId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("transaction_match_suggestions_confidence_idx").using(
      "btree",
      table.confidenceScore.desc().nullsLast(),
    ),
    index("transaction_match_suggestions_lookup_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.status.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.inboxId],
      foreignColumns: [inbox.id],
      name: "transaction_match_suggestions_inbox_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "transaction_match_suggestions_transaction_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_match_suggestions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "transaction_match_suggestions_user_id_fkey",
    }).onDelete("set null"),
    unique("transaction_match_suggestions_unique").on(
      table.inboxId,
      table.transactionId,
    ),
  ],
);
export const transactionAttachmentsRelations = relations(
  transactionAttachments,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [transactionAttachments.teamId],
      references: [teams.id],
    }),
    transaction: one(transactions, {
      fields: [transactionAttachments.transactionId],
      references: [transactions.id],
    }),
    inboxes: many(inbox),
  }),
);
