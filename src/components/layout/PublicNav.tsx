'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS: [string, string][] = [
  ['/documentation', 'Documentation'],
  ['/articles',      'Articles'],
  ['/elearning',     'E-Learning'],
  ['/entreprise',    'Entreprise'],
  ['/books',         'Livres'],
  ['/pricing',       'Pricing'],
  ['/about',         'À propos'],
]

export function PublicNav() {
  const pathname = usePathname()
  return (
    <div className="flex items-center gap-1 text-[11px]">
      {NAV_LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`font-semibold px-2.5 py-1 transition-colors ${
            pathname === href ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
