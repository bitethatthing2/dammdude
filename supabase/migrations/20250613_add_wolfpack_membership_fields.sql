-- Add Wolfpack membership fields to users table
-- These fields help manage wolfpack membership status

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wolfpack_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS location_permissions_granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wolfpack_joined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wolfpack_left_at TIMESTAMP WITH TIME ZONE;