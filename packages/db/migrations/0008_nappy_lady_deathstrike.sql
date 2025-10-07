CREATE TYPE "public"."accounting_provider" AS ENUM('quickbooks', 'xero', 'sage', 'wave', 'freshbooks');--> statement-breakpoint
CREATE TABLE "accounting_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "accounting_provider" NOT NULL,
	"company_name" varchar(255),
	"realm_id" varchar(255),
	"tenant_id" varchar(255),
	"credentials" jsonb NOT NULL,
	"expires_at" timestamp,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"sync_token" varchar(255),
	"webhook_id" varchar(255),
	"webhook_verifier" varchar(255),
	"environment" varchar(50) DEFAULT 'production',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_connections_team_provider" UNIQUE("team_id","provider")
);
--> statement-breakpoint
CREATE TABLE "synced_accounting_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"internal_id" uuid,
	"data" jsonb NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "synced_accounting_entities_connection_external" UNIQUE("connection_id","entity_type","external_id")
);
--> statement-breakpoint
ALTER TABLE "accounting_connections" ADD CONSTRAINT "accounting_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_connections" ADD CONSTRAINT "accounting_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_accounting_entities" ADD CONSTRAINT "synced_accounting_entities_connection_id_accounting_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."accounting_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounting_connections_team_idx" ON "accounting_connections" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "accounting_connections_user_idx" ON "accounting_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounting_connections_provider_idx" ON "accounting_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "accounting_connections_expires_idx" ON "accounting_connections" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "synced_accounting_entities_connection_idx" ON "synced_accounting_entities" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "synced_accounting_entities_type_idx" ON "synced_accounting_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "synced_accounting_entities_external_idx" ON "synced_accounting_entities" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "synced_accounting_entities_internal_idx" ON "synced_accounting_entities" USING btree ("internal_id");