CREATE TYPE "public"."email_provider" AS ENUM('gmail', 'outlook');--> statement-breakpoint
CREATE TABLE "email_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "email_provider" NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"credentials" jsonb NOT NULL,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"sync_token" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_connections_team_user_provider" UNIQUE("team_id","user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "synced_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"thread_id" varchar(255),
	"subject" text,
	"from_email" varchar(255),
	"to_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"received_at" timestamp,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"body_preview" text,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"folder" varchar(100),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "synced_emails_connection_message" UNIQUE("connection_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "email_connections" ADD CONSTRAINT "email_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_connections" ADD CONSTRAINT "email_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synced_emails" ADD CONSTRAINT "synced_emails_connection_id_email_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."email_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_connections_team_idx" ON "email_connections" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_connections_user_idx" ON "email_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_connections_provider_idx" ON "email_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "synced_emails_connection_idx" ON "synced_emails" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "synced_emails_message_idx" ON "synced_emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "synced_emails_received_idx" ON "synced_emails" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "synced_emails_has_attachments_idx" ON "synced_emails" USING btree ("has_attachments");