-- Fix for Wolf Profiles table and relationships
-- This addresses the "Could not find a relationship between 'wolfpack_memberships' and 'wolf_profiles'" error

-- 1. Create wolf_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wolf_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    profile_image_url TEXT,
    wolf_emoji TEXT DEFAULT '🐺',
    bio TEXT,
    wolfpack_status TEXT DEFAULT 'Ready to party! 🎉',
    favorite_drink TEXT,
    current_vibe TEXT,
    looking_for TEXT,
    instagram_handle TEXT,
    allow_messages BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    custom_avatar_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- 2. Enable RLS on wolf_profiles
ALTER TABLE public.wolf_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for wolf_profiles
DROP POLICY IF EXISTS "Users can manage own wolf profile" ON public.wolf_profiles;
CREATE POLICY "Users can manage own wolf profile" 
ON public.wolf_profiles
FOR ALL 
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- 4. Create function to auto-create wolf profile when user joins wolfpack
CREATE OR REPLACE FUNCTION public.ensure_wolf_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert wolf profile if it doesn't exist
  INSERT INTO public.wolf_profiles (user_id, display_name, wolfpack_status)
  VALUES (p_user_id, 'Anonymous Wolf', 'Just arrived')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN json_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Update the join_wolfpack_simple function to ensure wolf profile exists
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
  
  -- Ensure user exists in public.users
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (current_user_id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Ensure wolf profile exists
  PERFORM public.ensure_wolf_profile(current_user_id);
  
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

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_wolf_profile TO authenticated;
GRANT EXECUTE ON FUNCTION join_wolfpack_simple TO authenticated;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wolf_profiles_user_id ON public.wolf_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wolfpack_memberships_location_status ON public.wolfpack_memberships(location_id, status);
CREATE INDEX IF NOT EXISTS idx_wolfpack_memberships_user_status ON public.wolfpack_memberships(user_id, status);

-- 8. Insert default wolf profiles for existing memberships without profiles
INSERT INTO public.wolf_profiles (user_id, display_name, wolfpack_status)
SELECT DISTINCT wm.user_id, 'Anonymous Wolf', 'Just arrived'
FROM wolfpack_memberships wm
LEFT JOIN wolf_profiles wp ON wp.user_id = wm.user_id
WHERE wp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE public.wolf_profiles IS 'User profiles for the Wolf Pack feature with customizable display information';
COMMENT ON FUNCTION public.ensure_wolf_profile(UUID) IS 'Ensures a wolf profile exists for the given user ID';
COMMENT ON FUNCTION join_wolfpack_simple(UUID, TEXT) IS 'Updated function that ensures wolf profile exists when joining the pack';
