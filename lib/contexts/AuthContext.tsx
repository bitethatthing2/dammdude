'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Define types manually based on Supabase returns
interface SupabaseUser {
  id: string
  email?: string
  created_at?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  aud?: string
  role?: string
}

interface SupabaseSession {
  user: SupabaseUser
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  token_type?: string
}

interface AuthContextType {
  user: SupabaseUser | null
  loading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    
    // Get initial session
    supabase.auth.getSession().then((result: {
      data: { session: SupabaseSession | null }
      error: Error | null
    }) => {
      const { data: { session }, error } = result
      if (error) {
        console.error('Auth session error:', error)
        setError(error)
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: SupabaseSession | null) => {
        setUser(session?.user ?? null)
        setError(null)
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
