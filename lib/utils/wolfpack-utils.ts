// lib/utils/wolfpack-utils.ts
// Consolidated utility functions for wolfpack operations

import { supabase, createClient } from '@/lib/supabase/client';
import { 
  AuthUser, 
  SupabaseError, 
  WolfpackMembership, 
  DebugResult, 
  createDefaultWolfProfile 
} from '@/types/wolfpack-interfaces';

// Special VIP users who should always be wolfpack members
const VIP_USERS = ['mkahler599@gmail.com'];

// Helper function to ensure user exists in public.users table
export async function ensureUserExists(
  supabase: ReturnType<typeof createClient>, 
  authUser: AuthUser
): Promise<boolean> {
  try {
    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user existence:', selectError);
      return false;
    }
    
    if (existingUser) {
      return true; // User already exists
    }
    
    // Create user if doesn't exist
    const { error: createError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email || '',
        auth_id: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: true
      });
    
    if (createError) {
      // If it's a duplicate key error, that's actually fine
      if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
        console.log('✅ User already exists (conflict resolved)');
        return true;
      }
      console.error('Failed to create user in public.users:', createError);
      return false;
    }
    
    console.log('✅ User created in public.users table');
    return true;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return false;
  }
}

// Debug wolfpack membership function
export const debugWolfPackMembership = async (userId: string, locationId?: string): Promise<DebugResult> => {  console.log('🔍 DEBUGGING WOLFPACK MEMBERSHIP');
  console.log('User ID:', userId);
  console.log('Location ID:', locationId || 'Not specified');
  
  try {
    // Test 1: Check if user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth User:', user ? '✅ Found' : '❌ Not found');
    if (authError) console.error('Auth Error:', authError);
    
    // Test 2: Check wolf-pack-memberships table
    const { error: tableError } = await supabase
      .from("wolf_pack_members")
      .select('*')
      .limit(0);
    console.log('Table Access:', tableError ? '❌ Failed' : '✅ Success');
    if (tableError) console.error('Table Error:', tableError);
    
    // Test 3: Count total memberships
    const { count, error: countError } = await supabase
      .from("wolf_pack_members")
      .select('*', { count: 'exact', head: true });
    console.log('Total Memberships:', count);
    if (countError) console.error('Count Error:', countError);
    
    // Test 4: Try to find user's membership
    const { data: userMembership, error: userError } = await supabase
      .from("wolf_pack_members")
      .select('*')
      .eq('id', userId);
    console.log('User Memberships Found:', userMembership?.length || 0);
    console.log('User Membership Data:', userMembership);
    if (userError) console.error('User Query Error:', userError);
    
    // Test 5: Check specific location membership if provided
    if (locationId) {
      const { data: locationMembership, error: locationError } = await supabase
        .from("wolf_pack_members")
        .select('*')
        .eq('id', userId)
        .eq('location_id', locationId)
        .eq('status', 'active')
        .maybeSingle();
      console.log('Location Membership:', locationMembership ? '✅ Active' : '❌ Not found');
      if (locationError) console.error('Location Query Error:', locationError);
    }
    
    return {
      authWorking: !authError,
      tableAccessible: !tableError,
      totalMemberships: count || 0,
      userMemberships: userMembership?.length || 0,
      errors: { 
        authError: authError as SupabaseError | undefined,
        tableError: tableError as SupabaseError | undefined,
        countError: countError as SupabaseError | undefined,
        userError: userError as SupabaseError | undefined
      }
    };
    
  } catch (error) {
    console.error('🚨 Debug function failed:', error);
    return { error };
  }
};

// Check if user is VIP
export const isVipUser = (user: AuthUser | null): boolean => {
  return user?.email ? VIP_USERS.includes(user.email) : false;
};

// Fixed joinWolfPackFromLocation with proper error handling
export const joinWolfPackFromLocation = async (
  locationId: string, 
  user: AuthUser, 
  supabase: ReturnType<typeof createClient>
) => {
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Step 1: Check if user already has profile data
    console.log('Step 1: Checking for existing user profile for user:', user.id);
    
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, display_name, wolf_emoji, vibe_status')
      .eq('id', user.id)
      .single();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      throw new Error(`Failed to check user: ${checkError.message}`);
    }

    // Step 2: Prepare profile data for users table
    const profileData = {
      display_name: existingUser.display_name || user.first_name || user.email?.split('@')[0] || 'Wolf',
      wolf_emoji: existingUser.wolf_emoji || '🐺',
      vibe_status: existingUser.vibe_status || 'Ready to party! 🎉',
      is_profile_visible: true,
      looking_for: 'New friends',
      bio: null,
      favorite_drink: null,
      favorite_song: null,
      instagram_handle: null,
      gender: null,
      pronouns: null,
      profile_pic_url: null,
      custom_avatar_id: null
    };

    console.log('Step 2: Profile data prepared for users table');

    // Step 3: Update user profile data
    const { data: profileResult, error: profileError } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      throw new Error(`Failed to save profile: ${profileError.message}`);
    }

    console.log('Profile saved successfully:', profileResult);

    // Step 4: Check if already a pack member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("wolf_pack_members")
      .select('*')
      .eq('id', user.id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking pack membership:', memberCheckError);
    }

    // Step 5: Create or update pack membership
    if (!existingMember) {
      const memberData = {
        id: user.id,
        location_id: locationId,
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      const { data: memberEntry, error: memberError } = await supabase
        .from("wolf_pack_members")
        .insert(memberData)
        .select()
        .single();

      if (memberError) {
        console.error('Wolf pack member creation error:', memberError);
        // Don't throw - profile was created successfully
      } else {
        console.log('Successfully joined wolf pack:', memberEntry);
      }
    } else {
      // Update existing membership
      const { error: updateError } = await supabase
        .from("wolf_pack_members")
        .update({ 
          status: 'active', 
          last_active: new Date().toISOString() 
        })
        .eq('id', existingMember.id!);

      if (updateError) {
        console.error('Error updating pack membership:', updateError);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in joinWolfPackFromLocation:', error);
    throw error;
  }
};

// Check wolfpack status with correct column names
export async function checkWolfPackStatus(userId: string) {  try {
    // Query wolfpack_status from users table correctly
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wolfpack_status, wolfpack_joined_at')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user wolfpack status:', userError);
    }

    // Query wolf-pack-memberships with correct columns
    const { data: memberData, error: memberError } = await supabase
      .from('wolf-pack-members')
      .select(`
        id,
        id,
        location_id,
        status,
        joined_at,
        last_active
      `)
      .eq('id', userId)
      .eq('status', 'active');

    if (memberError) {
      console.error('Error checking pack membership:', memberError);
    }

    return {
      isWolfpackMember: userData?.wolfpack_status === 'active' || (memberData && memberData.length > 0),
      memberData: memberData || [],
      userStatus: userData?.wolfpack_status
    };
  } catch (error) {
    console.error('Error in checkWolfPackStatus:', error);
    return {
      isWolfpackMember: false,
      memberData: [],
      userStatus: null
    };
  }
}

// Get wolfpack locations with proper join syntax
export async function getWolfPackLocations(userId: string) {
  try {
    // First get the user's wolfpack info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, location_id, wolfpack_status, wolfpack_joined_at')
      .eq('id', userId)
      .eq('is_wolfpack_member', true)
      .single();

    if (userError || !userData || !userData.location_id) {
      console.error('Error fetching user wolfpack data:', userError);
      return [];
    }

    // Then get the location details
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id, name, address, city, state')
      .eq('id', userData.location_id)
      .single();

    if (locationError) {
      console.error('Error fetching location data:', locationError);
      return [];
    }

    return [{
      id: userData.id,
      location_id: userData.location_id,
      status: userData.wolfpack_status,
      joined_at: userData.wolfpack_joined_at,
      locations: locationData
    }];
  } catch (error) {
    console.error('Error in getWolfPackLocations:', error);
    return [];
  }
}

// Clear corrupted auth cookies
export function clearCorruptedAuthCookies() {
  // Clear all Supabase cookies
  document.cookie.split(";").forEach(function(c) { 
    if (c.trim().startsWith('sb-') || c.includes('supabase')) {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
  
  console.log('Cleared corrupted auth cookies');
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};
