'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  variant?: 'full' | 'icon'
  theme?: 'dark' | 'light' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 28, spread: 13, finance: 8 },
  md: { icon: 34, spread: 15, finance: 9 },
  lg: { icon: 44, spread: 20, finance: 11 },
}

export function Logo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  href = '/',
  className,
}: LogoProps) {
  const s = sizes[size]
  const spreadColor = theme === 'dark' ? '#fff' : '#292929'
  const financeColor = '#3183F7'
  const bgColor = theme === 'blue' ? '#3183F7' : theme === 'dark' ? '#3183F7' : '#292929'

  const icon = (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corps tête ours */}
      <rect x="1" y="4" width="54" height="50" rx="14" fill={bgColor} />
      {/* Oreilles */}
      <ellipse cx="11" cy="9" rx="8" ry="8" fill={bgColor} />
      <ellipse cx="45" cy="9" rx="8" ry="8" fill={bgColor} />
      {/* Museau */}
      <ellipse cx="28" cy="44" rx="13" ry="10" fill="#fff" opacity="0.15" />
      {/* Pont lunettes */}
      <rect x="16" y="23" width="24" height="2" rx="1" fill="#fff" />
      {/* Verre gauche */}
      <rect x="9" y="18" width="15" height="13" rx="5.5" fill="none" stroke="#fff" strokeWidth="2.5" />
      {/* Verre droit */}
      <rect x="32" y="18" width="15" height="13" rx="5.5" fill="none" stroke="#fff" strokeWidth="2.5" />
      {/* Pupille gauche */}
      <circle cx="16.5" cy="24.5" r="3.5" fill="#fff" />
      <circle cx="17.8" cy="23.5" r="1.5" fill={bgColor} />
      {/* Pupille droite */}
      <circle cx="39.5" cy="24.5" r="3.5" fill="#fff" />
      <circle cx="40.8" cy="23.5" r="1.5" fill={bgColor} />
    </svg>
  )

  const wordmark = variant === 'full' && (
    <div className="flex flex-col leading-none">
      <span
        className="font-black tracking-wider"
        style={{ fontSize: s.spread, color: spreadColor, letterSpacing: '0.06em' }}
      >
        SPREAD
      </span>
      <span
        style={{
          fontFamily: 'Permanent Marker, cursive',
          fontSize: s.finance,
          color: financeColor,
          marginTop: 1,
        }}
      >
        Finance
      </span>
    </div>
  )

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      {icon}
      {wordmark}
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  )
}
