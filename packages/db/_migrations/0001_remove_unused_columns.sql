-- Remove unused columns from users table
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "week_starts_on_monday";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "timezone_auto_sync";