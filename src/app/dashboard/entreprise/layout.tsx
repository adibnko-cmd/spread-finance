import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EnterpriseLogoutButton } from './EnterpriseLogoutButton'

export const dynamic = 'force-dynamic'

export default async function EnterpriseDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/dashboard/entreprise')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, first_name, last_name, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile || profile.account_type !== 'enterprise') notFound()

  const { data: ep } = await supabase
    .from('enterprise_profiles')
    .select('company_name, seats')
    .eq('id', user.id)
    .maybeSingle()

  const companyName = ep?.company_name ?? 'Entreprise'
  const userName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Admin'
  const isAdmin = profile.is_admin ?? false

  const NAV = [
    { href: '/dashboard/entreprise',               label: 'Vue d\'ensemble',  icon: '📊' },
    { href: '/dashboard/entreprise/jobs',           label: 'Offres d\'emploi', icon: '💼' },
    { href: '/dashboard/entreprise/quiz',           label: 'Tests candidats', icon: '📝' },
    { href: '/dashboard/entreprise/collaborateurs', label: 'Collaborateurs',  icon: '👥' },
    { href: '/dashboard/entreprise/historique',     label: 'Historique',       icon: '📅', soon: true },
    { href: '/dashboard/entreprise/sauvegardes',    label: 'Sauvegardés',      icon: '🔖', soon: true },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-6 shrink-0"
        style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ color: '#3183F7', fontWeight: 900, fontSize: 15 }}>Spread</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>Finance</span>
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,.15)' }} />
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(49,131,247,.2)', color: '#3183F7' }}>
            Espace Entreprise
          </span>
          <span className="text-xs font-semibold text-white/60">{companyName}</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <a href="/admin"
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(245,103,81,.2)', color: '#F56751' }}>
              Admin ↗
            </a>
          )}
          <span className="text-xs text-white/40">{userName}</span>
          <EnterpriseLogoutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 flex flex-col py-5 px-3"
          style={{ background: '#fff', borderRight: '1.5px solid #E8E8E8' }}>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ href, label, icon, soon }) => (
              <a key={href} href={soon ? undefined : href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-gray-50"
                style={{
                  color: soon ? '#bbb' : '#374151',
                  cursor: soon ? 'default' : 'pointer',
                  pointerEvents: soon ? 'none' : 'auto',
                }}>
                <span className="text-sm">{icon}</span>
                <span className="flex-1">{label}</span>
                {soon && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: '#F5F5F5', color: '#bbb' }}>
                    Bientôt
                  </span>
                )}
              </a>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <div className="rounded-xl p-3 text-xs" style={{ background: '#F5F6F8' }}>
              <div className="text-[10px] text-gray-400 mb-0.5">Licences</div>
              <div className="font-black text-gray-800">{ep?.seats ?? '—'} <span className="font-normal text-gray-400">sièges</span></div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
