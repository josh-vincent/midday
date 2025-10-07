CREATE TYPE "public"."transaction_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."transactionMethods" AS ENUM('payment', 'card_purchase', 'card_atm', 'transfer', 'other', 'unknown', 'ach', 'interest', 'deposit', 'wire', 'fee');--> statement-breakpoint
CREATE TYPE "public"."transactionStatus" AS ENUM('posted', 'pending', 'excluded', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "transaction_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text,
	"transaction_id" uuid,
	"team_id" uuid,
	"size" bigint,
	"name" text,
	"path" text[]
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"method" "transactionMethods" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"team_id" uuid NOT NULL,
	"assigned_id" uuid,
	"note" varchar,
	"bank_account_id" uuid,
	"internal_id" text NOT NULL,
	"status" "transactionStatus" DEFAULT 'posted',
	"balance" numeric(10, 2),
	"manual" boolean DEFAULT false,
	"notified" boolean DEFAULT false,
	"internal" boolean DEFAULT false,
	"description" text,
	"category_slug" text,
	"base_amount" numeric(10, 2),
	"counterparty_name" text,
	"base_currency" text,
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"recurring" boolean,
	"frequency" "transaction_frequency",
	"merchant_name" text,
	"enrichment_completed" boolean DEFAULT false,
	"fts_vector" "tsvector" GENERATED ALWAYS AS (
				to_tsvector(
					'english',
					(
						(COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
					)
				)
			) STORED NOT NULL,
	CONSTRAINT "transactions_internal_id_key" UNIQUE("internal_id")
);
--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_slug_team_id_fkey" FOREIGN KEY ("team_id","category_slug") REFERENCES "public"."transaction_categories"("team_id","slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_attachments_team_id_idx" ON "transaction_attachments" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_attachments_transaction_id_idx" ON "transaction_attachments" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts_vector" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_id" ON "transactions" USING btree ("id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_name" ON "transactions" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_name_trigram" ON "transactions" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_date_name" ON "transactions" USING btree ("team_id" date_ops,"date" date_ops,"name" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_name" ON "transactions" USING btree ("team_id" uuid_ops,"name" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_trgm_name" ON "transactions" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "transactions_assigned_id_idx" ON "transactions" USING btree ("assigned_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_bank_account_id_idx" ON "transactions" USING btree ("bank_account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_category_slug_idx" ON "transactions" USING btree ("category_slug" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_team_id_date_currency_bank_account_id_category_idx" ON "transactions" USING btree ("team_id" enum_ops,"date" date_ops,"currency" text_ops,"bank_account_id" date_ops);--> statement-breakpoint
CREATE INDEX "transactions_team_id_idx" ON "transactions" USING btree ("team_id" uuid_ops);