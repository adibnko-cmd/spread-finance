'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/utils/cn'
import type { Plan } from '@/types'

interface NavItem {
  href:  string
  label: string
  icon:  React.ReactNode
  plan?: Plan
  soon?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard', label: 'Accueil',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 8L9 2l7 6v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 17v-6h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  },
  {
    href: '/dashboard/profile', label: 'Profil',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M3 16c0-3.3 13-3.3 12 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/saved', label: 'Sauvegardés',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 3h10v13l-5-3-5 3V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  },
  {
    href: '/dashboard/progression', label: 'Progrès',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 13l3.5-3.5 3 2.5 4-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    href: '/dashboard/analytics', label: 'Analytics',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14l4-5 3 2.5 4-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15" cy="5" r="1.5" fill="currentColor"/></svg>,
  },
  {
    href: '/dashboard/roadmap', label: 'Road Map',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="5" r="1.2" fill="currentColor"/><circle cx="13" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="5" cy="9" r="1.2" fill="currentColor"/><path d="M9 6.2v1.6M11.8 9h-1.6M9 11.8v-1.6M6.2 9h1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/quiz', label: 'Quiz & Évals',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7.5c.3-.8 1-1.5 2-1.5s2 .7 2 1.5c0 1.5-2 2-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="9" cy="12.5" r=".8" fill="currentColor"/></svg>,
  },
  {
    href: '/dashboard/flashcards', label: 'Flashcards',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/leaderboard', label: 'Classement',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1 3h3l-2.5 2 1 3L9 8.5 6.5 10l1-3L5 5h3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4 16v-4M9 16v-6M14 16v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/jobs', label: 'Jobs', plan: 'premium',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="7" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2 11h14" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    href: '/dashboard/history', label: 'Historique',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '#', label: 'E-Learning', soon: true,
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 8l4 2-4 2V8z" fill="currentColor"/></svg>,
  },
  {
    href: '/dashboard/certificates', label: 'Certificats',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    href: '/dashboard/forum', label: 'Forum',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 16c0-2.8 11-2.8 10 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M12 12c1.5.5 4 1.5 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/news', label: 'Actualités',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7h8M5 10h6M5 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/outils', label: 'Outils',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
]

interface DashboardSidebarProps {
  userPlan?: Plan
  isAdmin?:  boolean
}

export function DashboardSidebar({ userPlan = 'free', isAdmin = false }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const isPremium = userPlan === 'premium' || userPlan === 'platinum'

  return (
    <aside className="w-[68px] flex flex-col h-full flex-shrink-0" style={{ background: '#1C1C2E', borderRight: '1px solid rgba(255,255,255,.05)' }}>
      {/* Logo */}
      <div className="flex items-center justify-center py-4 mb-1 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <Logo variant="icon" theme="blue" size="sm" href="/dashboard" />
      </div>

      {/* Navigation — scrollable */}
      <nav className="flex flex-col gap-px px-2 flex-1 pt-2 overflow-y-auto pb-2">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          const locked = !!item.plan && !isPremium
          const isSoon = !!item.soon

          return (
            <Link
              key={item.href + item.label}
              href={locked || isSoon ? '#' : item.href}
              onClick={locked || isSoon ? e => e.preventDefault() : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-150',
                active  && 'bg-blue-600/15',
                !active && !locked && !isSoon && 'hover:bg-white/5',
                (locked || isSoon) && 'opacity-40 cursor-not-allowed'
              )}
              title={
                locked ? `${item.label} — Plan Premium requis`
                : isSoon ? `${item.label} — Prochainement`
                : item.label
              }
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: '#3183F7' }} />
              )}
              <span className={cn('transition-colors', active ? 'text-blue-400' : 'text-white/45')}>
                {item.icon}
              </span>
              <span className={cn('text-[8px] font-semibold text-center leading-tight', active ? 'text-blue-300' : 'text-white/35')}>
                {item.label}
              </span>
              {locked && (
                <span className="text-[6px] font-bold px-1 py-px rounded-full" style={{ background: '#EBF2FF', color: '#3183F7', lineHeight: 1.4 }}>Pro</span>
              )}
              {isSoon && (
                <span className="text-[6px] font-bold px-1 py-px rounded-full" style={{ background: '#FFF8E6', color: '#b37700', lineHeight: 1.4 }}>Soon</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin (only if admin) */}
      {isAdmin && (
        <div className="px-2 pb-3 pt-1 flex-shrink-0">
          <Link href="/admin"
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
            style={{ background: 'rgba(245,103,81,.10)' }}
            title="Panel Admin"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="#F56751" strokeWidth="1.3"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="#F56751" strokeWidth="1.3"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="#F56751" strokeWidth="1.3"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="#F56751" strokeWidth="1.3"/>
            </svg>
            <span className="text-[8px] font-bold" style={{ color: '#F56751' }}>Admin</span>
          </Link>
        </div>
      )}
    </aside>
  )
}
