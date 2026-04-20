'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/utils/cn'
import type { Plan } from '@/types'

interface NavItem {
  href:    string
  label:   string
  icon:    React.ReactNode
  plan?:   Plan         // plan minimum requis
  soon?:   boolean      // "Prochainement"
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Accueil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 8L9 2l7 6v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M6 17v-6h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M3 16c0-3.3 13-3.3 12 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/progression',
    label: 'Progrès',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 13l3.5-3.5 3 2.5 4-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/quiz',
    label: 'Quiz',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M7 7.5c.3-.8 1-1.5 2-1.5s2 .7 2 1.5c0 1.5-2 2-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="9" cy="12.5" r=".8" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/favorites',
    label: 'Favoris',
    plan: 'premium',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l1.8 4.5H16l-4 2.9 1.5 4.6L9 11.3l-4.5 2.7 1.5-4.6L2 6.5h5.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/history',
    label: 'Historique',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const LOCKED_ITEMS = [
  { label: 'Flash',    soon: false, plan: 'premium' as Plan },
  { label: 'E-learn',  soon: true  },
  { label: 'Certif.',  soon: true  },
  { label: 'Jobs',     soon: false, plan: 'premium' as Plan },
]

interface DashboardSidebarProps {
  userPlan?: Plan
}

export function DashboardSidebar({ userPlan = 'free' }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const isLocked = (item: NavItem) =>
    item.plan && (userPlan === 'free' || (item.plan === 'premium' && userPlan === 'free'))

  return (
    <aside
      className="w-16 flex flex-col h-full"
      style={{ background: '#1C1C2E' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-4 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Logo variant="icon" theme="blue" size="sm" href="/dashboard" />
      </div>

      {/* Navigation principale */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1 pt-2">
        {NAV_ITEMS.map(item => {
          const active  = isActive(item.href)
          const locked  = isLocked(item)

          return (
            <Link
              key={item.href}
              href={locked ? '#' : item.href}
              onClick={locked ? e => e.preventDefault() : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors',
                active  && 'bg-blue',
                !active && !locked && 'hover:bg-white/6',
                locked  && 'opacity-30 cursor-not-allowed'
              )}
              title={item.label}
            >
              <span className={cn('transition-colors', active ? 'text-white' : 'text-white/50')}>
                {item.icon}
              </span>
              <span className={cn('text-[8px] font-semibold text-center leading-tight', active ? 'text-white' : 'text-white/40')}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Séparateur */}
        <div className="my-2 mx-2 h-px" style={{ background: 'rgba(255,255,255,.07)' }} />

        {/* Modules verrouillés / Prochainement */}
        {LOCKED_ITEMS.map(({ label, soon, plan: requiredPlan }) => {
          const unlocked = requiredPlan ? (userPlan === 'premium' || userPlan === 'platinum') : false

          return (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl opacity-30 cursor-not-allowed"
              title={soon ? `${label} — Prochainement` : `${label} — Plan ${requiredPlan} requis`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="8" width="12" height="8" rx="2" stroke="rgba(255,255,255,.5)" strokeWidth="1.4"/>
                <path d="M6 8V6a3 3 0 0 1 6 0v2" stroke="rgba(255,255,255,.5)" strokeWidth="1.4"/>
              </svg>
              <span className="text-[8px] font-semibold text-white/40 text-center leading-tight">{label}</span>
              {soon && (
                <span className="text-[7px] font-bold px-1 py-px rounded-full" style={{ background: '#FFF8E6', color: '#b37700', lineHeight: 1.4 }}>
                  Soon
                </span>
              )}
            </div>
          )
        })}
      </nav>

      {/* Support */}
      <div className="px-2 pb-3">
        <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl opacity-30" title="Support">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.5)" strokeWidth="1.3"/>
            <path d="M8 5v3M8 11v.5" stroke="rgba(255,255,255,.5)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span className="text-[8px] text-white/30 font-semibold">Support</span>
        </div>
      </div>
    </aside>
  )
}
