'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

type FlagType = 'favorite' | 'to_review' | 'to_read' | 'validated'
type ContentType = 'chapter' | 'article' | 'quiz' | 'flashcard'

interface FlagButtonProps {
  contentType: ContentType
  contentSlug: string
  domainSlug?: string
  flagType: FlagType
  userPlan?: string
  className?: string
}

const FLAG_CONFIG = {
  favorite: {
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill={active ? '#F56751' : 'none'} stroke={active ? '#F56751' : 'currentColor'} strokeWidth="1.4">
        <path d="M8 2.5C6.3.8 3 1.5 3 4.5c0 2.2 2 4 5 6.5 3-2.5 5-4.3 5-6.5 0-3-3.3-3.7-5-2z" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Favori',
    activeColor: '#F56751',
    activeBg: '#FFF5F3',
    freePlan: true,
  },
  to_review: {
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill={active ? '#FFC13D' : 'none'} stroke={active ? '#FFC13D' : 'currentColor'} strokeWidth="1.4">
        <path d="M3 2h10v12l-5-3-5 3V2z" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'À réviser',
    activeColor: '#FFC13D',
    activeBg: '#FFFBEB',
    freePlan: false,
  },
  to_read: {
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill={active ? '#3183F7' : 'none'} stroke={active ? '#3183F7' : 'currentColor'} strokeWidth="1.4">
        <path d="M3 3h10v10H3z" strokeLinejoin="round"/>
        <path d="M6 6h4M6 9h2" stroke={active ? '#fff' : 'currentColor'} strokeLinecap="round"/>
      </svg>
    ),
    label: 'À lire',
    activeColor: '#3183F7',
    activeBg: '#EBF2FF',
    freePlan: false,
  },
  validated: {
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#36D399' : 'currentColor'} strokeWidth="1.4">
        <circle cx="8" cy="8" r="6" />
        <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" stroke={active ? '#36D399' : 'currentColor'} />
      </svg>
    ),
    label: 'Acquis',
    activeColor: '#36D399',
    activeBg: '#E6FAF3',
    freePlan: true,
  },
}

export function FlagButton({ contentType, contentSlug, domainSlug, flagType, userPlan = 'free', className }: FlagButtonProps) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const config = FLAG_CONFIG[flagType]
  const isPremiumRequired = !config.freePlan && userPlan === 'free'

  useEffect(() => {
    async function checkFlag() {
      try {
        const res = await fetch(`/api/flags?slug=${contentSlug}&type=${flagType}`)
        if (!res.ok) return
        const json = await res.json()
        setActive((json.data ?? []).length > 0)
      } catch {}
    }
    checkFlag()
  }, [contentSlug, flagType])

  const toggle = useCallback(async () => {
    if (isPremiumRequired || loading) return
    setLoading(true)
    const prev = active
    setActive(!prev)
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_slug: contentSlug, domain_slug: domainSlug, flag_type: flagType }),
      })
      if (!res.ok) setActive(prev)
    } catch {
      setActive(prev)
    } finally {
      setLoading(false)
    }
  }, [active, contentSlug, contentType, domainSlug, flagType, isPremiumRequired, loading])

  if (isPremiumRequired) {
    return (
      <button
        disabled
        title={`${config.label} — réservé aux membres Premium`}
        className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg opacity-40 cursor-not-allowed text-gray-400', className)}
        style={{ border: '1.5px solid #E8E8E8' }}
      >
        {config.icon(false)}
        <span className="text-[10px] font-semibold hidden sm:inline">{config.label}</span>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#f0f0f0', color: '#888' }}>Pro</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={active ? `Retirer des ${config.label.toLowerCase()}s` : `Ajouter aux ${config.label.toLowerCase()}s`}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all',
        loading && 'opacity-60',
        className,
      )}
      style={{
        border: `1.5px solid ${active ? config.activeColor : '#E8E8E8'}`,
        background: active ? config.activeBg : '#fff',
        color: active ? config.activeColor : '#9CA3AF',
      }}
    >
      {config.icon(active)}
      <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: active ? config.activeColor : '#9CA3AF' }}>
        {config.label}
      </span>
    </button>
  )
}
