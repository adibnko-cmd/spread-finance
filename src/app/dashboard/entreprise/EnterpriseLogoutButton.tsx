'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function EnterpriseLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleLogout}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)' }}>
      Déconnexion
    </button>
  )
}
