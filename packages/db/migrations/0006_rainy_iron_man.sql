CREATE TYPE "public"."activity_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "status" "activity_status" DEFAULT 'unread' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "priority" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
CREATE INDEX "activities_status_priority_idx" ON "activities" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "activities_user_status_idx" ON "activities" USING btree ("user_id","status");