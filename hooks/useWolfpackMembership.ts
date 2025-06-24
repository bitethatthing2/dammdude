import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
}

// Debug helper function for troubleshooting wolfpack membership issues
interface DebugResult {
  authWorking?: boolean;
  tableAccessible?: boolean;
  totalMemberships?: number;
  userMemberships?: number;
  errors?: {
    authError?: SupabaseError;
    tableError?: SupabaseError;
    countError?: SupabaseError;
    userError?: SupabaseError;
  };
  error?: unknown;
}

export const debugWolfPackMembership = async (userId: string, locationId?: string): Promise<DebugResult> => {
  const supabase = getSupabaseBrowserClient();
  
  console.log('🔍 DEBUGGING WOLFPACK MEMBERSHIP');
  console.log('User ID:', userId);
  console.log('Location ID:', locationId || 'Not specified');
  
  try {
    // Test 1: Check if user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth User:', user ? '✅ Found' : '❌ Not found');
    if (authError) console.error('Auth Error:', authError);
    
    // Test 2: Check wolfpack_memberships table
    const { error: tableError } = await supabase
      .from('wolfpack_memberships')
      .select('*')
      .limit(0);
    console.log('Table Access:', tableError ? '❌ Failed' : '✅ Success');
    if (tableError) console.error('Table Error:', tableError);
    
    // Test 3: Count total memberships
    const { count, error: countError } = await supabase
      .from('wolfpack_memberships')
      .select('*', { count: 'exact', head: true });
    console.log('Total Memberships:', count);
    if (countError) console.error('Count Error:', countError);
    
    // Test 4: Try to find user's membership
    const { data: userMembership, error: userError } = await supabase
      .from('wolfpack_memberships')
      .select('*')
      .eq('user_id', userId);
    console.log('User Memberships Found:', userMembership?.length || 0);
    console.log('User Membership Data:', userMembership);
    if (userError) console.error('User Query Error:', userError);
    
    // Test 5: Check specific location membership if provided
    if (locationId) {
      const { data: locationMembership, error: locationError } = await supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', userId)
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

// Wolfpack membership interface matching the database schema
interface WolfpackMembership {
  id: string;
  user_id: string;
  status: 'active' | 'inactive';  // Only these two values are allowed by DB constraint
  table_location: string | null;
  joined_at: string;
  last_active: string | null;
  location_id: string | null;
}

interface UseWolfpackMembershipReturn {
  membership: WolfpackMembership | null;
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  checkMembership: () => Promise<void>;
  joinWolfPack: (locationId?: string, tableLocation?: string) => Promise<boolean>;
  leaveWolfPack: () => Promise<boolean>;
  debugMembership: () => Promise<DebugResult>;
}

// Special VIP users who should always be wolfpack members
const VIP_USERS = ['mkahler599@gmail.com'];

export function useWolfpackMembership(locationId?: string): UseWolfpackMembershipReturn {
  const [membership, setMembership] = useState<WolfpackMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const isVipUser = user?.email && VIP_USERS.includes(user.email);

  const checkMembership = async () => {
    if (!user) {
      setMembership(null);
      setIsLoading(false);
      setError(null); // Not an error - just not authenticated
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Add location filter if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      // Use maybeSingle() to avoid errors when no rows found
      const { data: membershipData, error: membershipError } = await query.maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is not an error
        throw membershipError;
      }

      if (membershipData) {
        setMembership(membershipData);
      } else if (isVipUser) {
        // Check if VIP user already has an inactive membership
        console.log('🌟 VIP User detected, checking for existing membership...');
        
        const { data: existingVip, error: checkVipError } = await supabase
          .from('wolfpack_memberships')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (checkVipError && checkVipError.code !== 'PGRST116') {
          throw checkVipError;
        }
        
        if (existingVip) {
          // Reactivate existing VIP membership
          console.log('♻️ Reactivating existing VIP membership...');
          try {
            const { data: vipMembership, error: vipError } = await supabase
              .from('wolfpack_memberships')
              .update({
                status: 'active',
                table_location: 'VIP',
                location_id: locationId || null,
                last_active: new Date().toISOString()
              })
              .eq('id', existingVip.id)
              .select()
              .single();
              
            if (vipError) {
              console.error('Failed to reactivate VIP membership:', vipError);
              throw vipError;
            }
            
            setMembership(vipMembership);
            console.log('✅ VIP membership reactivated successfully');
          } catch (vipErr) {
            console.error('VIP reactivation error:', vipErr);
            // Don't throw - just continue without VIP membership
            setMembership(null);
          }
        } else {
          // Create new VIP membership
          console.log('➕ Creating new VIP membership...');
          try {
            const { data: vipMembership, error: vipError } = await supabase
              .from('wolfpack_memberships')
              .insert({
                user_id: user.id,
                status: 'active',
                table_location: 'VIP',
                location_id: locationId || null,
                joined_at: new Date().toISOString(),
                last_active: new Date().toISOString()
              })
              .select()
              .single();

            if (vipError) {
              console.error('Failed to create VIP membership:', vipError);
              throw vipError;
            }
            
            setMembership(vipMembership);
            console.log('✅ VIP membership created successfully');
          } catch (vipErr) {
            console.error('VIP creation error:', vipErr);
            // Don't throw - just continue without VIP membership
            setMembership(null);
          }
        }
      } else {
        setMembership(null);
      }
      
    } catch (err) {
      const error = err as SupabaseError;
      
      // Better error logging that handles all error types
      console.error('🚨 WOLFPACK MEMBERSHIP ERROR:');
      console.error('Raw error:', err);
      console.error('Error details:', {
        code: error?.code || 'NO_CODE',
        message: error?.message || err?.toString() || 'Unknown error',
        details: error?.details,
        hint: error?.hint,
        userId: user?.id,
        locationId: locationId,
        errorType: typeof err,
        errorKeys: err ? Object.keys(err) : []
      });
      
      // Handle specific error codes
      let userMessage = 'Failed to check membership';
      
      // First check if we have a proper error object
      if (!error || Object.keys(error).length === 0) {
        userMessage = 'An unexpected error occurred. Please try again.';
      } else {
        switch (error?.code) {
          case 'PGRST301':
            userMessage = 'Session expired. Please log in again.';
            break;
          case '42P01':
            userMessage = 'Database configuration error';
            break;
          case 'PGRST204':
            userMessage = 'Permission denied';
            break;
          case '42P17':
            userMessage = 'Database policy error - please contact support';
            break;
          default:
            userMessage = error?.message || 'Unknown error occurred';
        }
      }
      
      setError(userMessage);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  };

  const joinWolfPack = async (locationId?: string, tableLocation?: string): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated');
      return false;
    }

    try {
      setError(null);
      
      // First, check if user already has a membership (active or inactive)
      const { data: existingMembership, error: checkError } = await supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let membershipData;

      if (existingMembership) {
        // Reactivate existing membership
        const { data, error } = await supabase
          .from('wolfpack_memberships')
          .update({
            status: 'active',
            last_active: new Date().toISOString(),
            table_location: tableLocation || existingMembership.table_location,
            location_id: locationId || existingMembership.location_id
          })
          .eq('id', existingMembership.id)
          .select()
          .single();

        if (error) throw error;
        membershipData = data;
      } else {
        // Create new membership
        const { data, error } = await supabase
          .from('wolfpack_memberships')
          .insert({
            user_id: user.id,
            status: 'active',
            table_location: tableLocation || null,
            location_id: locationId || null,
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        membershipData = data;
      }

      setMembership(membershipData);
      return true;
      
    } catch (err) {
      const error = err as SupabaseError;
      console.error('Failed to join Wolf Pack:', error);
      setError('Failed to join Wolf Pack');
      return false;
    }
  };

  const leaveWolfPack = async (): Promise<boolean> => {
    if (!user || !membership) {
      setError('No active membership');
      return false;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('wolfpack_memberships')
        .update({
          status: 'inactive',
          last_active: new Date().toISOString()
        })
        .eq('id', membership.id);

      if (error) throw error;

      setMembership(null);
      return true;
      
    } catch (err) {
      const error = err as SupabaseError;
      console.error('Failed to leave Wolf Pack:', error);
      setError('Failed to leave Wolf Pack');
      return false;
    }
  };

  const debugMembership = async () => {
    if (!user) return { error: 'Not authenticated' };
    return debugWolfPackMembership(user.id, locationId);
  };

  useEffect(() => {
    checkMembership();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, locationId]);

  const isActive = membership?.status === 'active';

  return {
    membership,
    isLoading,
    isActive,
    error,
    checkMembership,
    joinWolfPack,
    leaveWolfPack,
    debugMembership
  };
}