import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

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
          <nav className="flex flex-col gap-1">
            {[
              { href: '/admin', label: 'Vue d\'ensemble' },
              { href: '/admin/users', label: 'Utilisateurs' },
              { href: '/admin/subscriptions', label: 'Abonnements' },
              { href: '/admin/content', label: 'Contenu' },
              { href: '/admin/jobs', label: 'Offres d\'emploi' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
