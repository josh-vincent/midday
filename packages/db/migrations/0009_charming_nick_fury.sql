CREATE TYPE "public"."oauth_action" AS ENUM('connect', 'disconnect', 'refresh', 'transfer', 'view', 'sync');--> statement-breakpoint
CREATE TYPE "public"."oauth_operation" AS ENUM('api_call', 'sync', 'data_transfer');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider" AS ENUM('quickbooks', 'xero', 'gmail', 'outlook');--> statement-breakpoint
CREATE TABLE "oauth_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"providers" text[] NOT NULL,
	"delegated_by" text NOT NULL,
	"delegated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text,
	"team_id" text,
	"user_id" text NOT NULL,
	"action" "oauth_action" NOT NULL,
	"connection_id" text,
	"provider" "oauth_provider",
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"org_id" text,
	"provider" "oauth_provider" NOT NULL,
	"credentials" jsonb NOT NULL,
	"realm_id" text,
	"tenant_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp with time zone,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_locks" (
	"lock_key" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_usage_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text,
	"team_id" text,
	"provider" "oauth_provider" NOT NULL,
	"connection_id" text NOT NULL,
	"operation" "oauth_operation" NOT NULL,
	"bytes" bigint DEFAULT 0,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_oauth_admins_user_org" ON "oauth_admins" USING btree ("user_id","org_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_admins_org_id" ON "oauth_admins" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_audit_logs_org_id" ON "oauth_audit_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_audit_logs_user_id" ON "oauth_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_audit_logs_timestamp" ON "oauth_audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_oauth_audit_logs_action" ON "oauth_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_user_id" ON "oauth_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_team_id" ON "oauth_connections" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_org_id" ON "oauth_connections" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_provider" ON "oauth_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_org_provider" ON "oauth_connections" USING btree ("org_id","provider");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_team_provider" ON "oauth_connections" USING btree ("team_id","provider");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_expiring" ON "oauth_connections" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_realm_id" ON "oauth_connections" USING btree ("realm_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_tenant_id" ON "oauth_connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_one_primary_per_org_provider" ON "oauth_connections" USING btree ("org_id","provider") WHERE "oauth_connections"."is_primary" = true AND "oauth_connections"."org_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_one_primary_per_team_provider" ON "oauth_connections" USING btree ("team_id","provider") WHERE "oauth_connections"."is_primary" = true AND "oauth_connections"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_oauth_locks_expires_at" ON "oauth_locks" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_usage_metrics_org_timestamp" ON "oauth_usage_metrics" USING btree ("org_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_oauth_usage_metrics_connection" ON "oauth_usage_metrics" USING btree ("connection_id");