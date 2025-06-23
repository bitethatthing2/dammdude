import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface WolfpackMembership {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'pending';
  table_location: string | null;
  joined_at: string;
  last_active: string | null;
}

interface UseWolfpackMembershipReturn {
  membership: WolfpackMembership | null;
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  checkMembership: () => Promise<void>;
}

export function useWolfpackMembership(): UseWolfpackMembershipReturn {
  const [membership, setMembership] = useState<WolfpackMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // Special VIP users who should always be wolfpack members
  const vipUsers = ['mkahler599@gmail.com'];
  const isVipUser = user?.email && vipUsers.includes(user.email);

  const checkMembership = async () => {
    if (!user) {
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check for existing membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (membershipData) {
        setMembership(membershipData);
      } else if (isVipUser) {
        // Auto-create membership for VIP users
        const { data: vipMembership, error: vipError } = await supabase
          .from('wolfpack_memberships')
          .insert({
            user_id: user.id,
            status: 'active',
            table_location: 'VIP',
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })
          .select()
          .single();

        if (vipError) throw vipError;
        setMembership(vipMembership);
      } else {
        setMembership(null);
      }
    } catch (err) {
      console.error('Error checking wolfpack membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to check membership');
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkMembership();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isActive = membership?.status === 'active';

  return {
    membership,
    isLoading,
    isActive,
    error,
    checkMembership
  };
}
