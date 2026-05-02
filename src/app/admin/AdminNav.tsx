'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',              label: 'Vue d\'ensemble' },
  { href: '/admin/users',        label: 'Utilisateurs' },
  { href: '/admin/enterprise',   label: 'Entreprises' },
  { href: '/admin/subscriptions',label: 'Abonnements' },
  { href: '/admin/content',      label: 'Contenu' },
  { href: '/admin/jobs',         label: 'Offres d\'emploi' },
  { href: '/admin/news',         label: 'Actualités' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            style={{
              background: active ? '#EBF2FF' : 'transparent',
              color:      active ? '#3183F7' : '#374151',
              fontWeight: active ? 700 : 600,
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
