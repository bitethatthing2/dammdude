// Fixed useWolfpackSession hook to use proper session IDs
// File: lib/hooks/useWolfpackSession.ts

import { useState, useEffect, useRef } from 'react';

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

// Map location IDs to session IDs
const LOCATION_TO_SESSION_MAP = {
  '50d17782-3f4a-43a1-b6b6-608171ca3c7c': 'salem',
  'ec1e8869-454a-49d2-93e5-ed05f49bb932': 'portland'
} as const;

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
        // Map location to session ID
        const locationId = user.location_id;
        let sessionId = 'general'; // Default to general chat
        
        if (locationId && locationId in LOCATION_TO_SESSION_MAP) {
          sessionId = LOCATION_TO_SESSION_MAP[locationId as keyof typeof LOCATION_TO_SESSION_MAP];
        }

        console.log('Using session ID:', sessionId, 'for location:', locationId);
        
        // Set session config directly - no need to check if session exists in database
        // The RPC functions handle session validation
        setSessionConfig({
          sessionId: sessionId,
          locationId: locationId || null,
          isActive: true
        });

      } catch (error) {
        console.error('Unexpected error initializing session:', error);
        // Fallback to general chat
        setSessionConfig({
          sessionId: 'general',
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

export default useWolfpackSession;