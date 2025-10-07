CREATE TABLE "transaction_categories" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_id" uuid NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"system" boolean DEFAULT false,
	"slug" text,
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"tax_reporting_code" text,
	"excluded" boolean DEFAULT false,
	"description" text,
	"parent_id" uuid,
	CONSTRAINT "transaction_categories_pkey" PRIMARY KEY("team_id","slug"),
	CONSTRAINT "unique_team_slug" UNIQUE("team_id","slug")
);
--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_categories_team_id_idx" ON "transaction_categories" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories" USING btree ("parent_id" uuid_ops);