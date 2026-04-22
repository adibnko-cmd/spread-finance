'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  _type: 'chapter' | 'article'
  title: string
  slug: string
  domain: string
  accessLevel: string
  excerpt?: string
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Projet', ml: 'ML',
}

interface Props {
  onClose: () => void
}

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive]   = useState(0)
  const inputRef              = useRef<HTMLInputElement>(null)
  const router                = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setActive(0)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const navigate = useCallback((r: Result) => {
    const path = r._type === 'chapter' ? `/documentation/${r.slug}` : `/articles/${r.slug}`
    router.push(path)
    onClose()
  }, [router, onClose])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
      if (e.key === 'Enter' && results[active]) navigate(results[active])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, active, navigate, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid #E8E8E8', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-gray-400">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un chapitre, un concept..."
            className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-300"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="text-[10px] text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((r, i) => (
              <button
                key={`${r._type}-${r.slug}`}
                onClick={() => navigate(r)}
                onMouseEnter={() => setActive(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: active === i ? '#F5F6F8' : 'transparent' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: DOMAIN_COLORS[r.domain] ?? '#888' }}
                >
                  {DOMAIN_NAMES[r.domain]?.[0] ?? r.domain[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{r.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{DOMAIN_NAMES[r.domain] ?? r.domain}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400 capitalize">{r._type === 'chapter' ? 'Chapitre' : 'Article'}</span>
                    {r.accessLevel === 'premium' && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>Premium</span>
                      </>
                    )}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-gray-300">
                  <path d="M3 6h6M7 4l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Vide */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-xs text-gray-400">Aucun résultat pour «&nbsp;{query}&nbsp;»</div>
          </div>
        )}

        {/* Idle */}
        {query.length < 2 && (
          <div className="px-4 py-3 flex items-center gap-4">
            <span className="text-[10px] text-gray-300">
              ↑↓ naviguer &nbsp;·&nbsp; ↵ ouvrir &nbsp;·&nbsp; ESC fermer
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
