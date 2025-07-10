'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (mounted) {
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            // Check if user has admin or super_admin role
            const isAdminRole = data?.role === 'admin' || data?.role === 'super_admin';
            setIsAdmin(isAdminRole);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to check admin status:', err);
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { isAdmin, loading };
}