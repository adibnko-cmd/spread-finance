'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false })

export default function SearchTrigger() {
  const [open, setOpen] = useState(false)

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full flex-1 max-w-xs mx-8 text-left"
        style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.3"/>
          <path d="M9.5 9.5l2.5 2.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-white/30 flex-1">Rechercher dans la documentation...</span>
        <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,.08)' }}>⌘K</span>
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}
