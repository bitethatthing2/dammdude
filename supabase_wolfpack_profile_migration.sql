-- Migration: Ensure all wolfpack members have profiles
-- This fixes the root cause of the wolf_profiles relationship errors

-- First, create the wolf_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wolf_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous Wolf',
  wolf_emoji TEXT NOT NULL DEFAULT '🐺',
  bio TEXT DEFAULT '',
  vibe_status TEXT NOT NULL DEFAULT 'Just joined the pack!',
  profile_pic_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  allow_messages BOOLEAN NOT NULL DEFAULT true,
  favorite_drink TEXT,
  current_vibe TEXT,
  looking_for TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wolf_profiles
ALTER TABLE public.wolf_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wolf_profiles
DROP POLICY IF EXISTS "Users can view visible wolf profiles" ON public.wolf_profiles;
CREATE POLICY "Users can view visible wolf profiles" 
ON public.wolf_profiles 
FOR SELECT 
USING (is_visible = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own wolf profile" ON public.wolf_profiles;
CREATE POLICY "Users can manage their own wolf profile" 
ON public.wolf_profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create wolf_profiles for any existing wolfpack members who don't have one
INSERT INTO public.wolf_profiles (user_id, display_name, wolf_emoji, vibe_status, favorite_drink, current_vibe, looking_for)
SELECT 
    wm.user_id,
    COALESCE(u.first_name, 'Anonymous') || ' Wolf' as display_name,
    '🐺' as wolf_emoji,
    'New pack member!' as vibe_status,
    NULL as favorite_drink,
    'Exploring the pack!' as current_vibe,
    'Friends and good vibes' as looking_for
FROM wolfpack_memberships wm
INNER JOIN users u ON u.id = wm.user_id
LEFT JOIN wolf_profiles wp ON wp.user_id = wm.user_id
WHERE wp.id IS NULL
  AND wm.status = 'active'
ON CONFLICT (user_id) DO NOTHING;

-- Create a trigger function to automatically create wolf_profile when wolfpack_membership is created
CREATE OR REPLACE FUNCTION public.ensure_wolf_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if wolf_profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.wolf_profiles WHERE user_id = NEW.user_id) THEN
        -- Get user info and create wolf profile
        INSERT INTO public.wolf_profiles (user_id, display_name, wolf_emoji, vibe_status, current_vibe, looking_for)
        SELECT 
            NEW.user_id,
            COALESCE(first_name, 'Anonymous') || ' Wolf',
            '🐺',
            'Just joined the pack!',
            'New to the pack!',
            'Friends and good vibes'
        FROM public.users
        WHERE id = NEW.user_id
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create wolf profile on membership creation
DROP TRIGGER IF EXISTS ensure_wolf_profile_on_membership ON public.wolfpack_memberships;
CREATE TRIGGER ensure_wolf_profile_on_membership
    AFTER INSERT ON public.wolfpack_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_wolf_profile_exists();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wolf_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_wolf_profile_exists TO authenticated;

-- Update function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on wolf_profiles
DROP TRIGGER IF EXISTS wolf_profiles_updated_at ON public.wolf_profiles;
CREATE TRIGGER wolf_profiles_updated_at
  BEFORE UPDATE ON public.wolf_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments explaining the changes
COMMENT ON TABLE public.wolf_profiles IS 'Extended profiles for wolfpack members with social features and preferences';
COMMENT ON FUNCTION public.ensure_wolf_profile_exists() IS 'Automatically creates wolf_profile when wolfpack_membership is created, ensuring proper relationships';
COMMENT ON TRIGGER ensure_wolf_profile_on_membership ON public.wolfpack_memberships IS 'Auto-creates wolf profiles to prevent relationship errors';

-- Verify the migration worked
DO $$
DECLARE
    missing_profiles INTEGER;
    total_members INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_members FROM wolfpack_memberships WHERE status = 'active';
    
    SELECT COUNT(*) INTO missing_profiles 
    FROM wolfpack_memberships wm
    LEFT JOIN wolf_profiles wp ON wp.user_id = wm.user_id
    WHERE wm.status = 'active' AND wp.id IS NULL;
    
    RAISE NOTICE 'Migration completed: % active members, % missing profiles', total_members, missing_profiles;
    
    IF missing_profiles > 0 THEN
        RAISE WARNING 'Still have % members without profiles - check user data integrity', missing_profiles;
    ELSE
        RAISE NOTICE 'All active wolfpack members now have profiles!';
    END IF;
END $$;
