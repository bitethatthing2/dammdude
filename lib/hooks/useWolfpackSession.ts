// Fixed useWolfpackSession hook to prevent repeated initializations
// File: lib/hooks/useWolfpackSession.ts

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

// Accept the user type from your useUser hook
type AnyUser = {
  id: string;
  location_id?: string | null;
  [key: string]: unknown;
} | null;

interface WolfpackSessionConfig {
  sessionId: string | null;
  locationId: string | null;
  isActive: boolean;
}

export function useWolfpackSession(user: AnyUser, locationName?: string | null): WolfpackSessionConfig {
  const [sessionConfig, setSessionConfig] = useState<WolfpackSessionConfig>({
    sessionId: null,
    locationId: null,
    isActive: false
  });
  
  // Use refs to track initialization state
  const isInitializing = useRef(false);
  const lastUserId = useRef<string | null>(null);
  const lastLocationId = useRef<string | null | undefined>(null);

  useEffect(() => {
    // Early return if no user
    if (!user) {
      setSessionConfig({
        sessionId: null,
        locationId: null,
        isActive: false
      });
      lastUserId.current = null;
      lastLocationId.current = null;
      return;
    }

    // Prevent concurrent initializations
    if (isInitializing.current) {
      return;
    }

    // Check if we've already initialized for this user/location combination
    if (lastUserId.current === user.id && 
        lastLocationId.current === user.location_id) {
      return;
    }

    // Initialize session
    const initializeSession = async () => {
      isInitializing.current = true;
      lastUserId.current = user.id;
      lastLocationId.current = user.location_id;

      try {
        // CRITICAL FIX: Check if location_id exists before using it
        if (!user.location_id) {
          console.warn('User has no location_id, using local session fallback');
          setSessionConfig({
            sessionId: `local_${user.id}_${Date.now()}`,
            locationId: null,
            isActive: true
          });
          return;
        }

        const locationId = user.location_id;
        
        // First try to find an active session for this location
        const { data: existingSession, error: sessionError } = await supabase
          .from('wolfpack_sessions')
          .select('id, session_code, is_active')
          .eq('bar_location_id', locationId)
          .eq('is_active', true)
          .maybeSingle();

        // Check for various error types
        if (sessionError) {
          // Handle 400 Bad Request (empty parameter)
          if (sessionError.code === '400' || sessionError.message.includes('400')) {
            console.error('Bad request - likely empty bar_location_id:', locationId);
            setSessionConfig({
              sessionId: `local_${user.id}_${Date.now()}`,
              locationId: locationId,
              isActive: true
            });
            return;
          }
          
          // Handle 403 Forbidden (RLS policy)
          if (sessionError.code === '42501' || sessionError.code === 'PGRST301' || 
              sessionError.message.includes('permission') || sessionError.message.includes('403')) {
            console.warn('Database permissions issue, using local session fallback');
            setSessionConfig({
              sessionId: `local_${user.id}_${Date.now()}`,
              locationId: locationId,
              isActive: true
            });
            return;
          }

          // Log other errors but continue
          console.error('Session query error:', sessionError);
        }

        if (existingSession && !sessionError) {
          console.log('Found existing session:', existingSession.id);
          setSessionConfig({
            sessionId: existingSession.id,
            locationId: locationId,
            isActive: true
          });
          return;
        }

        // If no active session exists, try to create one
        // First check if user is authenticated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          console.warn('User not authenticated, using local session');
          setSessionConfig({
            sessionId: `local_${user.id}_${Date.now()}`,
            locationId: locationId,
            isActive: true
          });
          return;
        }

        const sessionCode = generateSessionCode();
        const { data: newSession, error: createError } = await supabase
          .from('wolfpack_sessions')
          .insert({
            bar_location_id: locationId,
            session_code: sessionCode,
            is_active: true,
            member_count: 0,
            max_members: 50,
            created_by: authUser.id,
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            metadata: {
              location_name: locationName || 'The Side Hustle Bar',
              created_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          
          // Handle specific error types
          if (createError.code === '42501' || createError.code === 'PGRST301' ||
              createError.message.includes('permission') || createError.message.includes('403')) {
            console.warn('Database permissions issue on create, using local session fallback');
          }
          
          // Always provide a fallback session
          setSessionConfig({
            sessionId: `local_${user.id}_${Date.now()}`,
            locationId: locationId,
            isActive: true
          });
          return;
        }

        if (newSession) {
          console.log('Created new session:', newSession.id);
          setSessionConfig({
            sessionId: newSession.id,
            locationId: locationId,
            isActive: true
          });
        }

      } catch (error) {
        console.error('Unexpected error initializing session:', error);
        // Fallback configuration  
        setSessionConfig({
          sessionId: `local_${user.id}_${Date.now()}`,
          locationId: user.location_id || null,
          isActive: true
        });
      } finally {
        isInitializing.current = false;
      }
    };

    initializeSession();
  }, [user, locationName]);

  return sessionConfig;
}

// Utility function to generate session codes
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default useWolfpackSession;