-- This script syncs a user from auth.users to public.users
-- Replace the user_id with your actual user ID

-- First, check if user exists in auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = '99a44313-c400-42dc-a556-60be2d6354e1';

-- Insert the user into public.users if not exists
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    created_at,
    updated_at
FROM auth.users
WHERE id = '99a44313-c400-42dc-a556-60be2d6354e1'
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT * FROM public.users WHERE id = '99a44313-c400-42dc-a556-60be2d6354e1';