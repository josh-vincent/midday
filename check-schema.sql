-- Check what columns exist in the users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what columns exist in the teams table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teams'
  AND table_schema = 'public'
ORDER BY ordinal_position;