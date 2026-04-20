// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Hook useUser
// Récupère l'utilisateur connecté + son profil Supabase
// Usage : const { user, profile, loading } = useUser()
// ═══════════════════════════════════════════════════════════════════
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  isPremium: boolean
  isPlatinum: boolean
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUser = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('useUser error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Écouter les changements d'auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(profile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isPremium:  profile?.plan === 'premium' || profile?.plan === 'platinum',
    isPlatinum: profile?.plan === 'platinum',
    refetch: fetchUser,
  }
}
