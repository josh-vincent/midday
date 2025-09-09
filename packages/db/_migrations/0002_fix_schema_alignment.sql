-- Fix schema alignment issues
-- Remove duplicate notes field from payments table (keeping 'note', removing 'notes')
ALTER TABLE IF EXISTS "payments" DROP COLUMN IF EXISTS "notes";