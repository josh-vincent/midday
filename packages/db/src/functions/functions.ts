// in a migration .ts file
import { sql } from "drizzle-orm";

export const up = async (db: any) => {
  await db.execute(sql`
    -- 1) Function: insert app user on auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,                -- keep IDs aligned to make joins simple
    email,
    full_name,
    avatar_url,
    locale,
    week_starts,
    time_format,
    timezone,
    date_format,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,  -- auth.users.id is UUID
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en'),
    1,
    24,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    'yyyy-MM-dd',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- or DO UPDATE if you want to upsert

  RETURN NEW;
END;
$$;

-- 2) Trigger: fire after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_auth_user();

-- 3) (Optional) Keep email in sync if it changes in auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.users
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_auth_user_email_update();
`);
};

export const down = async (db: any) => {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_auth_user_email_update;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_auth_user;
  `);
};