CREATE TYPE "public"."inbox_account_providers" AS ENUM('gmail', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."inbox_account_status" AS ENUM('connected', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('processing', 'pending', 'archived', 'new', 'analyzing', 'suggested_match', 'no_match', 'done', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."inbox_type" AS ENUM('invoice', 'expense');--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"file_path" text[],
	"file_name" text,
	"transaction_id" uuid,
	"amount" numeric(10, 2),
	"currency" text,
	"content_type" text,
	"size" bigint,
	"attachment_id" uuid,
	"date" date,
	"forwarded_to" text,
	"reference_id" text,
	"meta" json,
	"status" "inbox_status" DEFAULT 'new',
	"website" text,
	"display_name" text,
	"fts" "tsvector" GENERATED ALWAYS AS (generate_inbox_fts(display_name, extract_product_names((meta -> 'products'::text)))) STORED NOT NULL,
	"type" "inbox_type",
	"description" text,
	"base_amount" numeric(10, 2),
	"base_currency" text,
	"tax_amount" numeric(10, 2),
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"inbox_account_id" uuid,
	CONSTRAINT "inbox_reference_id_key" UNIQUE("reference_id")
);
--> statement-breakpoint
ALTER TABLE "inbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbox_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"team_id" uuid NOT NULL,
	"last_accessed" timestamp with time zone NOT NULL,
	"provider" "inbox_account_providers" NOT NULL,
	"external_id" text NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"schedule_id" text,
	"status" "inbox_account_status" DEFAULT 'connected' NOT NULL,
	"error_message" text,
	CONSTRAINT "inbox_accounts_email_key" UNIQUE("email"),
	CONSTRAINT "inbox_accounts_external_id_key" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "inbox_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbox_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbox_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"embedding" vector(768),
	"source_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"model" text DEFAULT 'gemini-embedding-001' NOT NULL,
	CONSTRAINT "inbox_embeddings_unique" UNIQUE("inbox_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"inbox_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"confidence_score" numeric(4, 3) NOT NULL,
	"amount_score" numeric(4, 3),
	"currency_score" numeric(4, 3),
	"date_score" numeric(4, 3),
	"embedding_score" numeric(4, 3),
	"name_score" numeric(4, 3),
	"match_type" text NOT NULL,
	"match_details" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_action_at" timestamp with time zone,
	"user_id" uuid,
	CONSTRAINT "transaction_match_suggestions_unique" UNIQUE("inbox_id","transaction_id")
);
--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."transaction_attachments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_inbox_account_id_fkey" FOREIGN KEY ("inbox_account_id") REFERENCES "public"."inbox_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_accounts" ADD CONSTRAINT "inbox_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_embeddings" ADD CONSTRAINT "inbox_embeddings_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "public"."inbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_embeddings" ADD CONSTRAINT "inbox_embeddings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "public"."inbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbox_attachment_id_idx" ON "inbox" USING btree ("attachment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_created_at_idx" ON "inbox" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "inbox_team_id_idx" ON "inbox" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_transaction_id_idx" ON "inbox" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_inbox_account_id_idx" ON "inbox" USING btree ("inbox_account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_embeddings_inbox_id_idx" ON "inbox_embeddings" USING btree ("inbox_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_embeddings_team_id_idx" ON "inbox_embeddings" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_embeddings_vector_idx" ON "inbox_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_inbox_id_idx" ON "transaction_match_suggestions" USING btree ("inbox_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_transaction_id_idx" ON "transaction_match_suggestions" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_team_id_idx" ON "transaction_match_suggestions" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_status_idx" ON "transaction_match_suggestions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_confidence_idx" ON "transaction_match_suggestions" USING btree ("confidence_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_lookup_idx" ON "transaction_match_suggestions" USING btree ("transaction_id" uuid_ops,"team_id" uuid_ops,"status" text_ops);--> statement-breakpoint
CREATE POLICY "Inbox can be deleted by a member of the team" ON "inbox" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox can be selected by a member of the team" ON "inbox" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Inbox can be updated by a member of the team" ON "inbox" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Inbox accounts can be deleted by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox accounts can be selected by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Inbox accounts can be updated by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR UPDATE TO public;