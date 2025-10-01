CREATE TABLE "customer_material_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"material_type" varchar(100) NOT NULL,
	"custom_price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'AUD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"equipment_type" varchar(100) NOT NULL,
	"default_capacity" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"material_type" varchar(100) NOT NULL,
	"default_price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'AUD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"default_currency" varchar(3) DEFAULT 'AUD' NOT NULL,
	"auto_calculate_pricing" boolean DEFAULT true NOT NULL,
	"auto_fill_capacity" boolean DEFAULT true NOT NULL,
	"default_job_status" varchar(20) DEFAULT 'delivered' NOT NULL,
	"business_hours_start" varchar(5) DEFAULT '07:00' NOT NULL,
	"business_hours_end" varchar(5) DEFAULT '17:00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_settings_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
ALTER TABLE "customer_material_pricing" ADD CONSTRAINT "customer_material_pricing_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_material_pricing" ADD CONSTRAINT "customer_material_pricing_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_defaults" ADD CONSTRAINT "equipment_defaults_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_defaults" ADD CONSTRAINT "material_defaults_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_settings" ADD CONSTRAINT "team_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_material_pricing_customer_material_idx" ON "customer_material_pricing" USING btree ("customer_id","material_type");--> statement-breakpoint
CREATE INDEX "customer_material_pricing_team_customer_idx" ON "customer_material_pricing" USING btree ("team_id","customer_id");--> statement-breakpoint
CREATE INDEX "equipment_defaults_team_equipment_idx" ON "equipment_defaults" USING btree ("team_id","equipment_type");--> statement-breakpoint
CREATE INDEX "material_defaults_team_material_idx" ON "material_defaults" USING btree ("team_id","material_type");--> statement-breakpoint
CREATE INDEX "team_settings_team_idx" ON "team_settings" USING btree ("team_id");