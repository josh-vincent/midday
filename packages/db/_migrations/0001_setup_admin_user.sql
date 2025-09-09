-- Create admin user in auth.users if it doesn't exist
DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
BEGIN
    -- Check if admin@tocld.com already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@tocld.com') THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmed_at
        ) VALUES (
            v_user_id,
            'admin@tocld.com',
            crypt('Admin123', gen_salt('bf')), -- Password: Admin123
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'full_name', 'Admin User',
                'email', 'admin@tocld.com'
            ),
            false,
            'authenticated',
            'authenticated',
            NOW()
        );

        -- Insert into public.users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'admin@tocld.com',
            'Admin User',
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Admin user created successfully with email: admin@tocld.com';
    ELSE
        -- Get the existing user ID
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@tocld.com' LIMIT 1;
        
        -- Ensure the user exists in public.users table
        INSERT INTO public.users (
            id,
            email,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'admin@tocld.com',
            'Admin User',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = NOW();
            
        -- Update password to ensure it's Admin123
        UPDATE auth.users 
        SET encrypted_password = crypt('Admin123', gen_salt('bf'))
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Admin user already exists, ensured data consistency';
    END IF;
END $$;