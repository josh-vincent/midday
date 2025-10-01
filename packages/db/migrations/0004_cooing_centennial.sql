ALTER TABLE "invoice_templates" DROP CONSTRAINT "invoice_templates_team_id_key";--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "name" text DEFAULT 'Default Template' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_team_name_key" UNIQUE("team_id","name");