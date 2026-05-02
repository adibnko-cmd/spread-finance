'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'

const PAGE_TITLES: [string, string][] = [
  ['/dashboard/roadmap',      'Road Map'],
  ['/dashboard/profile',      'Profil'],
  ['/dashboard/progression',  'Progression'],
  ['/dashboard/analytics',    'Analytics'],
  ['/dashboard/quiz',         'Quiz & Évaluations'],
  ['/dashboard/flashcards',   'Flashcards'],
  ['/dashboard/saved',        'Sauvegardés'],
  ['/dashboard/jobs',         'Jobs'],
  ['/dashboard/leaderboard',  'Classement'],
  ['/dashboard/history',      'Historique'],
  ['/dashboard/settings',     'Paramètres'],
  ['/dashboard/certificates', 'Certificats'],
  ['/dashboard/outils',       'Outils'],
  ['/dashboard/forum',        'Forum'],
  ['/dashboard/news',         'Actualités'],
  ['/dashboard',              'Accueil'],
]

const NAV_SHORTCUTS = [
  { href: '/',              label: 'Home' },
  { href: '/documentation', label: 'Documentation' },
  { href: '/articles',      label: 'Articles' },
  { href: '/dashboard/settings', label: 'Réglages' },
]

interface DashboardTopBarProps {
  totalCash?: number
}

export function DashboardTopBar({ totalCash = 0 }: DashboardTopBarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const title = PAGE_TITLES.find(([route]) =>
    pathname === route || pathname.startsWith(route + '/')
  )?.[1] ?? 'Dashboard'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="h-11 flex-shrink-0 flex items-center justify-between px-5"
      style={{ background: '#1C1C2E', borderBottom: '1px solid rgba(255,255,255,.07)' }}
    >
      <span className="text-white font-bold text-sm">{title}</span>

      <div className="flex items-center gap-4">
        {NAV_SHORTCUTS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors"
          >
            {label}
          </Link>
        ))}

        {/* Notifications */}
        <NotificationBell />

        {/* Cash Game balance */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,193,61,.12)', border: '1px solid rgba(255,193,61,.2)' }}
          title="Cash Game"
        >
          <span className="text-sm leading-none">💰</span>
          <span className="text-[11px] font-black" style={{ color: '#FFC13D' }}>{totalCash.toLocaleString()}</span>
        </div>

        {/* Shop button */}
        <Link
          href="/dashboard/shop"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{ background: 'rgba(49,131,247,.15)', border: '1px solid rgba(49,131,247,.25)' }}
          title="Boutique"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 2h1.5l2 7h6l1.5-5H4" stroke="#3183F7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="11.5" r="1" fill="#3183F7"/>
            <circle cx="10" cy="11.5" r="1" fill="#3183F7"/>
          </svg>
          <span className="text-[10px] font-bold" style={{ color: '#3183F7' }}>Shop</span>
        </Link>

        <button
          onClick={handleLogout}
          className="text-[11px] font-medium transition-colors"
          style={{ color: 'rgba(239,68,68,.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(239,68,68,.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,.5)')}
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}
