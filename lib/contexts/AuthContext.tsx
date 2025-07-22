'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client' // Use shared instance

// Define basic user type based on what Supabase auth returns
interface AuthUser {
  id: string
  email?: string
  created_at?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  aud?: string
  role?: string
}

// Define session type for Supabase
interface AuthSession {
  user: AuthUser | null
  access_token?: string
  refresh_token?: string
  expires_at?: number
  expires_in?: number
  token_type?: string
}

// Define auth error type
interface AuthError {
  message: string
  status?: number
  code?: string
}

// Define auth session result type
interface AuthSessionResult {
  data: {
    session: AuthSession | null
  }
  error: AuthError | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
})

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((result: AuthSessionResult) => {
      const { data: { session }, error } = result
      if (error) {
        console.error('Auth session error:', error)
        setError(new Error(error.message))
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: AuthSession | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Auth state changed: SIGNED_IN');
          // Verify user profile exists when signing in
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('id, auth_id, display_name')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Error checking user profile during auth change:', profileError);
            } else if (!userProfile) {
              console.warn('User profile not found during auth change - profile may need to be created');
            } else {
              console.log('User profile verified during auth change:', userProfile.display_name);
            }
          } catch (err) {
            console.error('Profile verification failed during auth change:', err);
          }
        }
        
        setUser(session?.user ?? null)
        setError(null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}