"use client";

import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';
import { UnifiedNotificationProvider } from '@/components/unified'; // Fix this import
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Client-side wrapper for the BottomNav component
 * Ensures the component is only rendered on the client side
 * and provides the NotificationProvider context
 */
const ClientBottomNav = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    setIsMounted(true);
    
    // Get the actual user ID
    const fetchUser = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
        
        // Listen for auth state changes
        const { data: { subscription } }: {
          data: {
            subscription: {
              unsubscribe: () => void;
            };
          };
        } = supabase.auth.onAuthStateChange(
          (_event: string, session: { user?: { id: string } } | null) => {
            setUserId(session?.user?.id);
          }
        );
        
        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
        {/* Placeholder content */}
      </nav>
    );
  }

  // Wrap BottomNav with UnifiedNotificationProvider using actual user ID
  return (
    <UnifiedNotificationProvider recipientId={userId} role='customer'>
      <BottomNav />
    </UnifiedNotificationProvider>
  );
};

export default ClientBottomNav;