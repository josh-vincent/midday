    import { pgEnum, pgTable, timestamp, text, uuid, foreignKey, unique, pgPolicy, bigint } from "drizzle-orm/pg-core";
import { teams  } from "./schema";
import { transactionAttachments } from "./schema-old-old";
import { transactionEnrichments } from "./schema-old-old";
import { transactionCategories } from "./schema-old-old";
import { relations } from "drizzle-orm";
import { numericCasted, tsvector } from "./schema-old-old";
import { date } from "drizzle-orm/pg-core";
import { json } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { transactions } from "./transactions-schema";
import { SQL, sql } from "drizzle-orm/sql";

export const inboxAccountProvidersEnum = pgEnum("inbox_account_providers", [
    "gmail",
    "outlook",
  ]);
  
  export const inboxAccountStatusEnum = pgEnum("inbox_account_status", [
    "connected",
    "disconnected",
  ]);
  
  export const inboxStatusEnum = pgEnum("inbox_status", [
    "processing",
    "pending",
    "archived",
    "new",
    "analyzing",
    "suggested_match",
    "no_match",
    "done",
    "deleted",
  ]);

  export const inboxTypeEnum = pgEnum("inbox_type", ["invoice", "expense"]);
  
  export const inboxAccounts = pgTable(
    "inbox_accounts",
    {
      id: uuid().defaultRandom().primaryKey().notNull(),
      createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
      email: text().notNull(),
      accessToken: text("access_token").notNull(),
      refreshToken: text("refresh_token").notNull(),
      teamId: uuid("team_id").notNull(),
      lastAccessed: timestamp("last_accessed", {
        withTimezone: true,
        mode: "string",
      }).notNull(),
      provider: inboxAccountProvidersEnum().notNull(),
      externalId: text("external_id").notNull(),
      expiryDate: timestamp("expiry_date", {
        withTimezone: true,
        mode: "string",
      }).notNull(),
      scheduleId: text("schedule_id"),
      status: inboxAccountStatusEnum().default("connected").notNull(),
      errorMessage: text("error_message"),
    },
    (table) => [
      foreignKey({
        columns: [table.teamId],
        foreignColumns: [teams.id],
        name: "inbox_accounts_team_id_fkey",
      }).onDelete("cascade"),
      unique("inbox_accounts_email_key").on(table.email),
      unique("inbox_accounts_external_id_key").on(table.externalId),
      pgPolicy("Inbox accounts can be deleted by a member of the team", {
        as: "permissive",
        for: "delete",
        to: ["public"],
        using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
      }),
      pgPolicy("Inbox accounts can be selected by a member of the team", {
        as: "permissive",
        for: "select",
        to: ["public"],
      }),
      pgPolicy("Inbox accounts can be updated by a member of the team", {
        as: "permissive",
        for: "update",
        to: ["public"],
      }),
    ],
  );


export const inbox = pgTable(
    "inbox",
    {
      id: uuid().defaultRandom().primaryKey().notNull(),
      createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
      teamId: uuid("team_id"),
      filePath: text("file_path").array(),
      fileName: text("file_name"),
      transactionId: uuid("transaction_id"),
      amount: numericCasted("amount", { precision: 10, scale: 2 }),
      currency: text(),
      contentType: text("content_type"),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      size: bigint({ mode: "number" }),
      attachmentId: uuid("attachment_id"),
      date: date(),
      forwardedTo: text("forwarded_to"),
      referenceId: text("reference_id"),
      meta: json(),
      status: inboxStatusEnum().default("new"),
      website: text(),
      displayName: text("display_name"),
      fts: tsvector("fts")
        .notNull()
        .generatedAlwaysAs(
          (): SQL =>
            sql`generate_inbox_fts(display_name, extract_product_names((meta -> 'products'::text)))`,
        ),
      type: inboxTypeEnum(),
      description: text(),
      baseAmount: numericCasted("base_amount", { precision: 10, scale: 2 }),
      baseCurrency: text("base_currency"),
      taxAmount: numericCasted("tax_amount", { precision: 10, scale: 2 }),
      taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
      taxType: text("tax_type"),
      inboxAccountId: uuid("inbox_account_id"),
    },
    (table) => [
      index("inbox_attachment_id_idx").using(
        "btree",
        table.attachmentId.asc().nullsLast().op("uuid_ops"),
      ),
      index("inbox_created_at_idx").using(
        "btree",
        table.createdAt.asc().nullsLast().op("timestamptz_ops"),
      ),
      index("inbox_team_id_idx").using(
        "btree",
        table.teamId.asc().nullsLast().op("uuid_ops"),
      ),
      index("inbox_transaction_id_idx").using(
        "btree",
        table.transactionId.asc().nullsLast().op("uuid_ops"),
      ),
      index("inbox_inbox_account_id_idx").using(
        "btree",
        table.inboxAccountId.asc().nullsLast().op("uuid_ops"),
      ),
      foreignKey({
        columns: [table.attachmentId],
        foreignColumns: [transactionAttachments.id],
        name: "inbox_attachment_id_fkey",
      }).onDelete("set null"),
      foreignKey({
        columns: [table.teamId],
        foreignColumns: [teams.id],
        name: "public_inbox_team_id_fkey",
      }).onDelete("cascade"),
      foreignKey({
        columns: [table.transactionId],
        foreignColumns: [transactions.id],
        name: "public_inbox_transaction_id_fkey",
      }).onDelete("set null"),
      foreignKey({
        columns: [table.inboxAccountId],
        foreignColumns: [inboxAccounts.id],
        name: "inbox_inbox_account_id_fkey",
      }).onDelete("set null"),
      unique("inbox_reference_id_key").on(table.referenceId),
      pgPolicy("Inbox can be deleted by a member of the team", {
        as: "permissive",
        for: "delete",
        to: ["public"],
        using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
      }),
      pgPolicy("Inbox can be selected by a member of the team", {
        as: "permissive",
        for: "select",
        to: ["public"],
      }),
      pgPolicy("Inbox can be updated by a member of the team", {
        as: "permissive",
        for: "update",
        to: ["public"],
      }),
    ],
  );


export const inboxEmbeddings = pgTable(
    "inbox_embeddings",
    {
      id: uuid().defaultRandom().primaryKey().notNull(),
      inboxId: uuid("inbox_id").notNull(),
      teamId: uuid("team_id").notNull(),
      embedding: vector("embedding", { dimensions: 768 }),
      sourceText: text("source_text").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
      model: text("model").notNull().default("gemini-embedding-001"),
    },
    (table) => [
      index("inbox_embeddings_inbox_id_idx").using(
        "btree",
        table.inboxId.asc().nullsLast().op("uuid_ops"),
      ),
      index("inbox_embeddings_team_id_idx").using(
        "btree",
        table.teamId.asc().nullsLast().op("uuid_ops"),
      ),
      // Vector similarity index for fast cosine similarity searches
      index("inbox_embeddings_vector_idx").using(
        "hnsw",
        table.embedding.op("vector_cosine_ops"),
      ),
      foreignKey({
        columns: [table.inboxId],
        foreignColumns: [inbox.id],
        name: "inbox_embeddings_inbox_id_fkey",
      }).onDelete("cascade"),
      foreignKey({
        columns: [table.teamId],
        foreignColumns: [teams.id],
        name: "inbox_embeddings_team_id_fkey",
      }).onDelete("cascade"),
      unique("inbox_embeddings_unique").on(table.inboxId),
    ],
  );
  

  export const inboxAccountsRelations = relations(inboxAccounts, ({ one }) => ({
    team: one(teams, {
      fields: [inboxAccounts.teamId],
      references: [teams.id],
    }),
  }));


export const inboxRelations = relations(inbox, ({ one }) => ({
    transactionAttachment: one(transactionAttachments, {
      fields: [inbox.attachmentId],
      references: [transactionAttachments.id],
    }),
    team: one(teams, {
      fields: [inbox.teamId],
      references: [teams.id],
    }),
    transaction: one(transactions, {
      fields: [inbox.transactionId],
      references: [transactions.id],
    }),
  }));
  