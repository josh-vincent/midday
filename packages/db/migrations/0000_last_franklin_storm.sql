CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'JPY', 'CNY', 'INR');--> statement-breakpoint
CREATE TYPE "public"."dirt_type" AS ENUM('clean_fill', 'topsoil', 'contaminated', 'mixed', 'clay', 'sand', 'gravel', 'concrete', 'asphalt', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'unpaid', 'paid', 'canceled', 'overdue', 'partially_paid', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'in_progress', 'completed', 'invoiced', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('invoice_created', 'invoice_paid', 'invoice_overdue', 'invoice_reminder', 'payment_received', 'payment_failed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'credit_card', 'cash', 'check', 'other');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('trial', 'free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."reportTypes" AS ENUM('profit', 'revenue', 'burn_rate', 'expense');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."teamRoles" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid DEFAULT gen_random_uuid(),
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"app_id" text NOT NULL,
	"created_by" uuid DEFAULT gen_random_uuid(),
	"settings" jsonb,
	CONSTRAINT "unique_app_id_team_id" UNIQUE("team_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"billingEmail" text,
	"phone" varchar(50),
	"website" varchar(255),
	"address_line_1" text,
	"address_line_2" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" text,
	"country_code" text DEFAULT 'AU',
	"postal_code" varchar(20),
	"tax_number" varchar(50),
	"abn" varchar(50),
	"currency" "currency" DEFAULT 'AUD',
	"token" text DEFAULT '' NOT NULL,
	"note" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"fts" "tsvector" GENERATED ALWAYS AS (
				to_tsvector(
					'english'::regconfig,
					COALESCE(name, ''::text) || ' ' ||
					COALESCE(contact, ''::text) || ' ' ||
					COALESCE(phone, ''::text) || ' ' ||
					COALESCE(email, ''::text) || ' ' ||
          COALESCE(billingEmail, ''::text) || ' ' ||
          COALESCE(abn, ''::text) || ' ' ||
					COALESCE(address_line_1, ''::text) || ' ' ||
					COALESCE(address_line_2, ''::text) || ' ' ||
					COALESCE(city, ''::text) || ' ' ||
					COALESCE(state, ''::text) || ' ' ||
					COALESCE(postalCode, ''::text) || ' ' ||
					COALESCE(country, ''::text)
				)
			) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_tag_assignments" (
	"document_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "document_tag_assignments_pkey" PRIMARY KEY("document_id","tag_id"),
	CONSTRAINT "document_tag_assignments_unique" UNIQUE("document_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "unique_slug_per_team" UNIQUE("slug","team_id")
);
--> statement-breakpoint
ALTER TABLE "document_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb,
	"path_tokens" text[],
	"team_id" uuid,
	"parent_id" text,
	"object_id" uuid,
	"owner_id" uuid,
	"tag" text,
	"title" text,
	"body" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((title || ' '::text) || body))) STORED NOT NULL,
	"summary" text,
	"content" text,
	"date" date,
	"language" text,
	"processing_status" "document_processing_status" DEFAULT 'pending',
	"fts_simple" "tsvector",
	"fts_english" "tsvector",
	"fts_language" "tsvector"
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoice_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"title" varchar(255) DEFAULT 'Invoice',
	"logo_url" text,
	"primary_color" varchar(7) DEFAULT '#000000',
	"currency" varchar(3) DEFAULT 'AUD',
	"date_format" varchar(20) DEFAULT 'dd/MM/yyyy',
	"size" varchar(10) DEFAULT 'a4',
	"include_qr" boolean DEFAULT false,
	"include_tax_number" boolean DEFAULT true,
	"include_payment_details" boolean DEFAULT true,
	"include_vat" boolean DEFAULT false,
	"include_tax" boolean DEFAULT false,
	"include_discount" boolean DEFAULT false,
	"include_decimals" boolean DEFAULT true,
	"include_pdf" boolean DEFAULT true,
	"include_units" boolean DEFAULT false,
	"send_copy" boolean DEFAULT false,
	"customer_label" varchar(255) DEFAULT 'To',
	"from_label" varchar(255) DEFAULT 'From',
	"invoice_no_label" varchar(255) DEFAULT 'Invoice No',
	"issue_date_label" varchar(255) DEFAULT 'Issue Date',
	"due_date_label" varchar(255) DEFAULT 'Due Date',
	"description_label" varchar(255) DEFAULT 'Description',
	"price_label" varchar(255) DEFAULT 'Price',
	"quantity_label" varchar(255) DEFAULT 'Quantity',
	"total_label" varchar(255) DEFAULT 'Total',
	"total_summary_label" varchar(255) DEFAULT 'Total',
	"vat_label" varchar(255) DEFAULT 'VAT',
	"tax_label" varchar(255) DEFAULT 'Tax',
	"subtotal_label" varchar(255) DEFAULT 'Subtotal',
	"discount_label" varchar(255) DEFAULT 'Discount',
	"payment_label" varchar(255) DEFAULT 'Payment Details',
	"note_label" varchar(255) DEFAULT 'Note',
	"tax_rate" numeric(5, 2) DEFAULT 0,
	"vat_rate" numeric(5, 2) DEFAULT 0,
	"payment_terms" integer,
	"note" text,
	"terms" text,
	"payment_details" text,
	"from_details" text,
	"note_details" text,
	"delivery_type" varchar(20) DEFAULT 'create',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"template_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" "currency" DEFAULT 'AUD' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT 1,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT 0,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"discount_rate" numeric(5, 2) DEFAULT 0,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text,
	"terms" text,
	"payment_details" text,
	"from_details" text,
	"customer_details" text,
	"note_details" text,
	"template" jsonb,
	"token" text,
	"amount" integer DEFAULT 0,
	"user_id" uuid,
	"customer_name" text,
	"invoice_date" date,
	"tax" integer DEFAULT 0,
	"vat" integer DEFAULT 0,
	"discount" integer DEFAULT 0,
	"top_block" text,
	"bottom_block" text,
	"scheduled_at" timestamp,
	"scheduled_job_id" text,
	"logo_url" text,
	"invoice_no_label" text,
	"issue_date_label" text,
	"due_date_label" text,
	"description_label" text,
	"price_label" text,
	"quantity_label" text,
	"total_label" text,
	"vat_label" text,
	"tax_label" text,
	"payment_label" text,
	"note_label" text,
	"size" "invoice_size" DEFAULT 'a4',
	"date_format" text,
	"include_vat" boolean,
	"include_tax" boolean,
	"delivery_type" "invoice_delivery_type" DEFAULT 'create' NOT NULL,
	"discount_label" text,
	"include_discount" boolean,
	"include_decimals" boolean,
	"total_summary_label" text,
	"title" text,
	"vat_rate" numeric(10, 2),
	"include_units" boolean,
	"subtotal_label" text,
	"include_pdf" boolean,
	"send_copy" boolean,
	"sent_at" timestamp,
	"reminder_sent_at" timestamp,
	"viewed_at" timestamp,
	"downloaded_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_team_id_invoice_number_unique" UNIQUE("team_id","invoice_number")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid,
	"job_number" varchar(50),
	"contact_person" varchar(255),
	"contact_number" varchar(50),
	"rego" varchar(20),
	"load_number" integer DEFAULT 1,
	"company_name" varchar(255),
	"address_site" text,
	"equipment_type" varchar(100),
	"material_type" varchar(100),
	"price_per_unit" numeric(10, 2),
	"cubic_metre_capacity" integer,
	"job_date" date,
	"source_location" varchar(255),
	"source_address" text,
	"destination_site" varchar(255),
	"dirt_type" "dirt_type",
	"quantity_cubic_meters" numeric(10, 2),
	"weight_kg" numeric(12, 2),
	"price_per_cubic_meter" integer,
	"total_amount" integer,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"scheduled_date" date,
	"arrival_time" timestamp,
	"completed_time" timestamp,
	"invoice_id" uuid,
	"truck_number" varchar(50),
	"driver_name" varchar(255),
	"notes" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_team_id_job_number_unique" UNIQUE("team_id","job_number")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_team_id_type_unique" UNIQUE("user_id","team_id","type")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency" DEFAULT 'AUD' NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference" varchar(255),
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"link_id" text,
	"team_id" uuid,
	"short_link" text,
	"from" timestamp with time zone,
	"to" timestamp with time zone,
	"type" "reportTypes",
	"expire_at" timestamp with time zone,
	"currency" text,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "short_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" text NOT NULL,
	"url" text NOT NULL,
	"type" text,
	"size" numeric(10, 2),
	"mime_type" text,
	"file_name" text,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "short_links_short_id_unique" UNIQUE("short_id")
);
--> statement-breakpoint
ALTER TABLE "short_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_team_id_name_unique" UNIQUE("team_id","name")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" text,
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(255),
	"address" text,
	"plan" "plans" DEFAULT 'trial' NOT NULL,
	"inbox_id" varchar(255),
	"inbox_email" varchar(255),
	"inbox_forwarding" boolean DEFAULT true,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"country_code" varchar(2),
	"postal_code" varchar(20),
	"tax_number" varchar(50),
	"base_currency" "currency" DEFAULT 'AUD' NOT NULL,
	"invoice_prefix" varchar(10) DEFAULT 'INV',
	"next_invoice_number" integer DEFAULT 1 NOT NULL,
	"payment_terms" integer DEFAULT 30,
	"invoice_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invites_team_id_email_unique" UNIQUE("team_id","email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"email" text,
	"team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"locale" text DEFAULT 'en',
	"timezone" text,
	"time_format" numeric DEFAULT 24,
	"date_format" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth.users" (
	"instance_id" uuid,
	"id" uuid NOT NULL,
	"aud" varchar(255),
	"role" varchar(255),
	"email" varchar(255),
	"encrypted_password" varchar(255),
	"email_confirmed_at" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"confirmation_token" varchar(255),
	"confirmation_sent_at" timestamp with time zone,
	"recovery_token" varchar(255),
	"recovery_sent_at" timestamp with time zone,
	"email_change_token_new" varchar(255),
	"email_change" varchar(255),
	"email_change_sent_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"raw_app_meta_data" jsonb,
	"raw_user_meta_data" jsonb,
	"is_super_admin" boolean,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"phone" text DEFAULT null::character varying,
	"phone_confirmed_at" timestamp with time zone,
	"phone_change" text DEFAULT ''::character varying,
	"phone_change_token" varchar(255) DEFAULT ''::character varying,
	"phone_change_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
	"email_change_token_current" varchar(255) DEFAULT ''::character varying,
	"email_change_confirm_status" smallint DEFAULT 0,
	"banned_until" timestamp with time zone,
	"reauthentication_token" varchar(255) DEFAULT ''::character varying,
	"reauthentication_sent_at" timestamp with time zone,
	"is_sso_user" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_pkey" PRIMARY KEY("id"),
	CONSTRAINT "users_phone_key" UNIQUE("phone"),
	CONSTRAINT "confirmation_token_idx" UNIQUE("confirmation_token"),
	CONSTRAINT "email_change_token_current_idx" UNIQUE("email_change_token_current"),
	CONSTRAINT "email_change_token_new_idx" UNIQUE("email_change_token_new"),
	CONSTRAINT "reauthentication_token_idx" UNIQUE("reauthentication_token"),
	CONSTRAINT "recovery_token_idx" UNIQUE("recovery_token"),
	CONSTRAINT "users_email_partial_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_on_team" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role" "teamRoles",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","team_id","id")
);
--> statement-breakpoint
ALTER TABLE "users_on_team" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."document_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "storage_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_comments" ADD CONSTRAINT "invoice_comments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_comments" ADD CONSTRAINT "invoice_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_invoice_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "public_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_team_idx" ON "activities" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "activities_entity_idx" ON "activities" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "activities_created_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customers_team_idx" ON "customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_document_id" ON "document_tag_assignments" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_tag_id" ON "document_tag_assignments" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "documents" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_idx" ON "documents" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_parent_id_idx" ON "documents" USING btree ("team_id" text_ops,"parent_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_english" ON "documents" USING gin ("fts_english" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_language" ON "documents" USING gin ("fts_language" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_simple" ON "documents" USING gin ("fts_simple" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_gin_documents_title" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "invoice_comments_invoice_idx" ON "invoice_comments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_templates_team_idx" ON "invoice_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoices_team_idx" ON "invoices" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "jobs_team_idx" ON "jobs" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "jobs_customer_idx" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_invoice_idx" ON "jobs" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "jobs_scheduled_date_idx" ON "jobs" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "jobs_contact_person_idx" ON "jobs" USING btree ("contact_person");--> statement-breakpoint
CREATE INDEX "jobs_rego_idx" ON "jobs" USING btree ("rego");--> statement-breakpoint
CREATE INDEX "jobs_company_name_idx" ON "jobs" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "jobs_job_date_idx" ON "jobs" USING btree ("job_date");--> statement-breakpoint
CREATE INDEX "notification_settings_user_team_idx" ON "notification_settings" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "reports_team_id_idx" ON "reports" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "short_links_short_id_idx" ON "short_links" USING btree ("short_id" text_ops);--> statement-breakpoint
CREATE INDEX "short_links_team_id_idx" ON "short_links" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "short_links_user_id_idx" ON "short_links" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tags_team_idx" ON "tags" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "teams_name_idx" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_invites_email_idx" ON "user_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_invites_code_idx" ON "user_invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_instance_id_email_idx" ON "auth.users" USING btree ("instance_id",lower((email)::text));--> statement-breakpoint
CREATE INDEX "users_instance_id_idx" ON "auth.users" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "users_is_anonymous_idx" ON "auth.users" USING btree ("is_anonymous");--> statement-breakpoint
CREATE INDEX "users_on_team_team_id_idx" ON "users_on_team" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_user_id_idx" ON "users_on_team" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Apps can be deleted by a member of the team" ON "apps" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Apps can be inserted by a member of the team" ON "apps" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be selected by a member of the team" ON "apps" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be updated by a member of the team" ON "apps" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "document_tag_assignments" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "document_tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Documents can be deleted by a member of the team" ON "documents" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Documents can be selected by a member of the team" ON "documents" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Documents can be updated by a member of the team" ON "documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "documents" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Short links can be created by a member of the team" ON "short_links" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Short links can be selected by a member of the team" ON "short_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Short links can be updated by a member of the team" ON "short_links" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Short links can be deleted by a member of the team" ON "short_links" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Users can insert their own profile." ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can select their own profile." ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can select users if they are in the same team" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can update own profile." ON "users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "users_on_team" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable updates for users on team" ON "users_on_team" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Select for current user teams" ON "users_on_team" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users on team can be deleted by a member of the team" ON "users_on_team" AS PERMISSIVE FOR DELETE TO public;