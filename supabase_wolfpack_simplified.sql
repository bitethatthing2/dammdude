-- Simplified Wolf Pack Database Implementation
-- This fixes the 406/409 errors by simplifying the user creation flow

-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default location if none exists
INSERT INTO public.locations (id, name, address) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Side Hustle Bar', '123 Main St, City, State')
ON CONFLICT (id) DO NOTHING;

-- Add location_id column to wolfpack_memberships if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wolfpack_memberships' 
    AND column_name = 'location_id'
  ) THEN
    ALTER TABLE wolfpack_memberships 
    ADD COLUMN location_id UUID REFERENCES public.locations(id);
    
    -- Update existing records to reference the default location
    UPDATE wolfpack_memberships 
    SET location_id = '550e8400-e29b-41d4-a716-446655440000' 
    WHERE location_id IS NULL;
  END IF;
END $$;

-- 1. Auto-create users in public.users when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create user in public.users when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Ensure wolfpack_memberships table has proper constraints
-- Make sure the table allows UPSERT operations without conflicts
DO $$
BEGIN
  -- Add unique constraint on user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wolfpack_memberships_user_id_key'
  ) THEN
    ALTER TABLE wolfpack_memberships 
    ADD CONSTRAINT wolfpack_memberships_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. Simplified RLS policies for wolfpack_memberships
DROP POLICY IF EXISTS "Users can manage their own membership" ON wolfpack_memberships;

CREATE POLICY "Users can manage their own membership" 
ON wolfpack_memberships
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure RLS is enabled
ALTER TABLE wolfpack_memberships ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple function for joining the wolfpack (optional, for advanced use)
CREATE OR REPLACE FUNCTION join_wolfpack_simple(
  p_location_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  p_table_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Use default location if none provided
  IF p_location_id IS NULL THEN
    p_location_id := '550e8400-e29b-41d4-a716-446655440000';
  END IF;
  
  -- Upsert membership using the simplified approach
  INSERT INTO wolfpack_memberships (
    user_id, 
    status, 
    joined_at, 
    last_active,
    location_id,
    table_location
  )
  VALUES (
    current_user_id,
    'active',
    NOW(),
    NOW(),
    p_location_id,
    p_table_location
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = 'active',
    last_active = NOW(),
    location_id = COALESCE(EXCLUDED.location_id, wolfpack_memberships.location_id),
    table_location = COALESCE(EXCLUDED.table_location, wolfpack_memberships.table_location);
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully joined/rejoined the pack'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- 6. Create ensure_user_exists function
CREATE OR REPLACE FUNCTION ensure_user_exists(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user if they don't exist
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (p_user_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN json_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION join_wolfpack_simple TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO service_role;

-- Comments explaining the changes
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user in public.users when auth user is created, eliminating manual user creation errors';
COMMENT ON FUNCTION join_wolfpack_simple(UUID, TEXT) IS 'Simplified wolfpack joining that uses UPSERT to prevent conflicts';
COMMENT ON POLICY "Users can manage their own membership" ON wolfpack_memberships IS 'Simple RLS policy allowing users to manage only their own memberships';
