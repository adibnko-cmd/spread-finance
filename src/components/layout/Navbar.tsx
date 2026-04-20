'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'
import { cn } from '@/lib/utils/cn'

const NAV_LINKS = [
  { href: '/documentation', label: 'Documentation' },
  { href: '/articles',      label: 'Articles' },
  { href: '/e-learning',    label: 'E-learning', soon: true },
  { href: '/entreprise',    label: 'Entreprise' },
  { href: '/a-propos',      label: 'À propos' },
]

interface NavbarProps {
  /** Utilisateur connecté — affiche Dashboard au lieu de Connexion */
  isAuthenticated?: boolean
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="w-full h-14 flex items-center px-8 gap-0"
      style={{ background: '#292929' }}
    >
      {/* Logo */}
      <Logo theme="dark" size="sm" href="/" className="mr-8" />

      {/* Liens */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, label, soon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={soon ? '#' : href}
              className={cn(
                'relative text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors',
                active
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white hover:bg-white/6',
                soon && 'cursor-not-allowed'
              )}
              onClick={soon ? e => e.preventDefault() : undefined}
            >
              {label}
              {soon && (
                <span
                  className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-px rounded-full"
                  style={{ background: '#FFF8E6', color: '#b37700', lineHeight: 1.4 }}
                >
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded"
          style={{ color: 'rgba(255,255,255,.35)', border: '1px solid rgba(255,255,255,.14)' }}
        >
          FR
        </span>

        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="text-xs font-bold text-white px-4 py-1.5 rounded-lg"
            style={{ background: '#3183F7' }}
          >
            Mon dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,.65)', border: '1.5px solid rgba(255,255,255,.18)' }}
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="text-xs font-bold text-white px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#3183F7' }}
            >
              Commencer gratuitement
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
