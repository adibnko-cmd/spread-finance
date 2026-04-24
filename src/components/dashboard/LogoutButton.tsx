'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      title="Se déconnecter"
      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-red-500/10 transition-colors w-full"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="rgba(239,68,68,.6)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M11 5l3 3-3 3M14 8H7" stroke="rgba(239,68,68,.6)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[8px] font-semibold" style={{ color: 'rgba(239,68,68,.5)' }}>Quitter</span>
    </button>
  )
}
