-- Migration: Unify email and accounting connections into oauth_connections
-- This migration renames accounting_connections to oauth_connections and adds email-specific fields

-- Step 1: Create new oauth_provider enum with all providers
CREATE TYPE "oauth_provider" AS ENUM('gmail', 'outlook', 'quickbooks', 'xero', 'sage', 'wave', 'freshbooks');--> statement-breakpoint

-- Step 2: Rename accounting_connections table to oauth_connections
ALTER TABLE "accounting_connections" RENAME TO "oauth_connections";--> statement-breakpoint

-- Step 3: Add email-specific column
ALTER TABLE "oauth_connections" ADD COLUMN "email_address" varchar(255);--> statement-breakpoint

-- Step 4: Change provider column type to new enum
-- First, create a temporary column
ALTER TABLE "oauth_connections" ADD COLUMN "provider_new" "oauth_provider";--> statement-breakpoint

-- Copy data with type cast
UPDATE "oauth_connections" SET "provider_new" = "provider"::text::"oauth_provider";--> statement-breakpoint

-- Drop old column and rename new column
ALTER TABLE "oauth_connections" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "oauth_connections" RENAME COLUMN "provider_new" TO "provider";--> statement-breakpoint
ALTER TABLE "oauth_connections" ALTER COLUMN "provider" SET NOT NULL;--> statement-breakpoint

-- Step 5: Update indexes (drop old, create new with oauth_connections prefix)
DROP INDEX IF EXISTS "accounting_connections_team_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "accounting_connections_user_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "accounting_connections_provider_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "accounting_connections_expires_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "accounting_connections_team_provider";--> statement-breakpoint

CREATE INDEX "oauth_connections_team_idx" ON "oauth_connections" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "oauth_connections_user_idx" ON "oauth_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_connections_provider_idx" ON "oauth_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "oauth_connections_expires_idx" ON "oauth_connections" USING btree ("expires_at");--> statement-breakpoint

-- Step 6: Recreate unique constraint with new table name
ALTER TABLE "oauth_connections" DROP CONSTRAINT IF EXISTS "accounting_connections_team_provider";--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_team_provider" UNIQUE("team_id", "provider");--> statement-breakpoint

-- Step 7: Drop old enums (after all references are updated)
DROP TYPE IF EXISTS "accounting_provider";--> statement-breakpoint
DROP TYPE IF EXISTS "email_provider";--> statement-breakpoint
