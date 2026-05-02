import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNav } from './AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#F4F6FB' }}>
      {/* Admin top bar */}
      <header className="h-14 flex items-center justify-between px-6" style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: '#F56751', color: '#fff' }}>ADMIN</span>
          <span style={{ color: '#3183F7', fontWeight: 900, fontSize: 15 }}>Spread</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>Finance</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50">{profile.first_name} {profile.last_name}</span>
          <a href="/dashboard" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }}>
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Nav + content */}
      <div className="flex">
        <aside className="w-48 min-h-screen p-4" style={{ background: '#fff', borderRight: '1.5px solid #E8E8E8' }}>
          <AdminNav />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
