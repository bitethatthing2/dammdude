import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface WolfpackStatus {
  isLoading: boolean;
  isWolfpackMember: boolean;
  isLocationVerified: boolean;
  error?: string;
}

export function useWolfpackStatus(): WolfpackStatus {
  const [status, setStatus] = useState<WolfpackStatus>({
    isLoading: true,
    isWolfpackMember: false,
    isLocationVerified: false,
  });

  useEffect(() => {
    async function checkWolfpackStatus() {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }

        if (!user) {
          // Not logged in, check location verification for guest access
          const isLocationVerified = localStorage.getItem('location_verified') === 'true';
          setStatus({
            isLoading: false,
            isWolfpackMember: false,
            isLocationVerified,
          });
          return;
        }

        // Check if user is a Wolfpack member by checking the users table and wolf_pack_members
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('wolfpack_status')
          .eq('id', user.id)
          .single();

        if (userDataError && userDataError.code !== 'PGRST116') {
          throw userDataError;
        }

        // Also check if user is currently in a wolf pack
        const { data: packMember, error: packError } = await supabase
          .from('wolf_pack_members')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (packError && packError.code !== 'PGRST116') {
          // Log but don't throw - this is expected if user is not in pack
          console.log('User not in wolf pack:', packError.message);
        }

        const isWolfpackMember = userData?.wolfpack_status === 'active' || !!packMember;
        const isLocationVerified = isWolfpackMember || localStorage.getItem('location_verified') === 'true';

        setStatus({
          isLoading: false,
          isWolfpackMember,
          isLocationVerified,
        });

      } catch (error) {
        console.error('Error checking Wolfpack status:', error);
        setStatus({
          isLoading: false,
          isWolfpackMember: false,
          isLocationVerified: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    checkWolfpackStatus();
  }, []);

  return status;
}
