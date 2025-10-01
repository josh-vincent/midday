CREATE TYPE "public"."interval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');--> statement-breakpoint
CREATE TABLE "invoice_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"team_id" uuid NOT NULL,
	"created_by" uuid,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"currency" text,
	"unit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"fts" "tsvector" GENERATED ALWAYS AS (
          to_tsvector(
            'english',
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        ) STORED NOT NULL,
	CONSTRAINT "invoice_products_team_name_currency_price_unique" UNIQUE("team_id","name","currency","price")
);
--> statement-breakpoint
ALTER TABLE "invoice_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stripe_checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"team_id" uuid,
	"stripe_customer_id" varchar(255),
	"stripe_price_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"mode" varchar(20) NOT NULL,
	"success_url" text,
	"cancel_url" text,
	"metadata" jsonb,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_checkout_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"currency" varchar(3) DEFAULT 'USD',
	"default_payment_method" varchar(255),
	"invoice_prefix" varchar(10),
	"balance" integer DEFAULT 0,
	"delinquent" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_invoice_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"number" varchar(255),
	"status" varchar(50),
	"amount_due" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"amount_remaining" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"period_start" timestamp,
	"period_end" timestamp,
	"hosted_invoice_url" text,
	"invoice_pdf" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_payment_method_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"card" jsonb,
	"billing_details" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_payment_methods_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"stripe_product_id" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"unit_amount" integer,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"type" varchar(20) NOT NULL,
	"interval" interval,
	"interval_count" integer,
	"trial_period_days" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_prices_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_product_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"features" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_products_stripe_product_id_unique" UNIQUE("stripe_product_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"status" "subscription_status" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"cancel_at" timestamp,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"ended_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_subscription_item_id" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"idempotency_key" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_usage_records_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "invoice_products" ADD CONSTRAINT "invoice_products_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_products" ADD CONSTRAINT "invoice_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_checkout_sessions" ADD CONSTRAINT "stripe_checkout_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_invoices" ADD CONSTRAINT "stripe_invoices_stripe_customer_id_stripe_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."stripe_customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_payment_methods" ADD CONSTRAINT "stripe_payment_methods_stripe_customer_id_stripe_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."stripe_customers"("stripe_customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_prices" ADD CONSTRAINT "stripe_prices_stripe_product_id_stripe_products_stripe_product_id_fk" FOREIGN KEY ("stripe_product_id") REFERENCES "public"."stripe_products"("stripe_product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_stripe_customer_id_stripe_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."stripe_customers"("stripe_customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_stripe_price_id_stripe_prices_stripe_price_id_fk" FOREIGN KEY ("stripe_price_id") REFERENCES "public"."stripe_prices"("stripe_price_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_products_team_id_idx" ON "invoice_products" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoice_products_created_by_idx" ON "invoice_products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "invoice_products_fts_idx" ON "invoice_products" USING gin ("fts");--> statement-breakpoint
CREATE INDEX "invoice_products_name_idx" ON "invoice_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "invoice_products_usage_count_idx" ON "invoice_products" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "invoice_products_last_used_at_idx" ON "invoice_products" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "invoice_products_team_active_idx" ON "invoice_products" USING btree ("team_id","is_active");--> statement-breakpoint
CREATE INDEX "stripe_checkout_sessions_session_idx" ON "stripe_checkout_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "stripe_checkout_sessions_team_idx" ON "stripe_checkout_sessions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "stripe_checkout_sessions_status_idx" ON "stripe_checkout_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stripe_customers_team_idx" ON "stripe_customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "stripe_customers_stripe_id_idx" ON "stripe_customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "stripe_invoices_customer_idx" ON "stripe_invoices" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "stripe_invoices_subscription_idx" ON "stripe_invoices" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "stripe_invoices_stripe_id_idx" ON "stripe_invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "stripe_invoices_status_idx" ON "stripe_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stripe_payment_methods_customer_idx" ON "stripe_payment_methods" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "stripe_payment_methods_stripe_id_idx" ON "stripe_payment_methods" USING btree ("stripe_payment_method_id");--> statement-breakpoint
CREATE INDEX "stripe_prices_stripe_id_idx" ON "stripe_prices" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "stripe_prices_product_idx" ON "stripe_prices" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX "stripe_prices_active_idx" ON "stripe_prices" USING btree ("active");--> statement-breakpoint
CREATE INDEX "stripe_products_stripe_id_idx" ON "stripe_products" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX "stripe_products_active_idx" ON "stripe_products" USING btree ("active");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_team_idx" ON "stripe_subscriptions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_customer_idx" ON "stripe_subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_stripe_id_idx" ON "stripe_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_status_idx" ON "stripe_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stripe_usage_records_subscription_item_idx" ON "stripe_usage_records" USING btree ("stripe_subscription_item_id");--> statement-breakpoint
CREATE INDEX "stripe_usage_records_timestamp_idx" ON "stripe_usage_records" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "webhook_events_type_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "webhook_events_retry_idx" ON "webhook_events" USING btree ("next_retry_at");--> statement-breakpoint
CREATE POLICY "Enable read access for team members" ON "invoice_products" AS PERMISSIVE FOR SELECT TO public USING (team_id = (select auth.jwt() ->> 'team_id')::uuid);--> statement-breakpoint
CREATE POLICY "Enable insert access for team members" ON "invoice_products" AS PERMISSIVE FOR INSERT TO public WITH CHECK (team_id = (select auth.jwt() ->> 'team_id')::uuid);--> statement-breakpoint
CREATE POLICY "Enable update access for team members" ON "invoice_products" AS PERMISSIVE FOR UPDATE TO public USING (team_id = (select auth.jwt() ->> 'team_id')::uuid);--> statement-breakpoint
CREATE POLICY "Enable delete access for team members" ON "invoice_products" AS PERMISSIVE FOR DELETE TO public USING (team_id = (select auth.jwt() ->> 'team_id')::uuid);