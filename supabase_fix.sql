-- Fix user profile creation trigger
-- This ensures that when a user signs up through Supabase Auth, 
-- a corresponding profile is created in the public.users table

-- First, create the function that will handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, first_name, last_name, role, status, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'last_name',
    'user', -- Default role
    'active', -- Default status
    true -- Auto-approve users for now
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more permissive for user creation
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id OR auth.role() = 'service_role');

-- Allow service role to insert new users (for the trigger)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create a manual profile for existing john.doe@example.com user if it exists in auth.users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Check if john.doe@example.com exists in auth.users
    SELECT id, email INTO user_record 
    FROM auth.users 
    WHERE email = 'john.doe@example.com';
    
    IF FOUND THEN
        -- Insert profile if it doesn't exist
        INSERT INTO public.users (auth_id, email, first_name, last_name, role, status, is_approved)
        VALUES (
            user_record.id,
            user_record.email,
            'John',
            'Doe',
            'user',
            'active',
            true
        )
        ON CONFLICT (auth_id) DO NOTHING;
    END IF;
END $$;

-- Also create profiles for any other existing auth.users that don't have profiles
DO $$
DECLARE
    auth_user_record RECORD;
BEGIN
    FOR auth_user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.auth_id
        WHERE pu.auth_id IS NULL
    LOOP
        INSERT INTO public.users (auth_id, email, first_name, last_name, role, status, is_approved)
        VALUES (
            auth_user_record.id,
            auth_user_record.email,
            COALESCE(auth_user_record.raw_user_meta_data->>'first_name', auth_user_record.raw_user_meta_data->>'display_name', split_part(auth_user_record.email, '@', 1)),
            auth_user_record.raw_user_meta_data->>'last_name',
            'user',
            'active',
            true
        )
        ON CONFLICT (auth_id) DO NOTHING;
    END LOOP;
END $$;
