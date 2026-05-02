'use client'

import { useState, useMemo } from 'react'

const DOMAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  finance: { label: 'Finance',  color: '#3183F7', bg: '#EBF2FF' },
  maths:   { label: 'Maths',    color: '#A855F7', bg: '#F3EFFF' },
  dev:     { label: 'Dev IT',   color: '#1a5fc8', bg: '#E8F0FE' },
  ml:      { label: 'ML / IA',  color: '#F56751', bg: '#FEF0EE' },
  pm:      { label: 'Projet',   color: '#FFC13D', bg: '#FFF8E6' },
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Term { term: string; domain: string; def: string }

export default function GlossaireClient({ terms }: { terms: Term[] }) {
  const [query,  setQuery]  = useState('')
  const [domain, setDomain] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return terms.filter(t =>
      (!domain || t.domain === domain) &&
      (!q || t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
    ).sort((a, b) => a.term.localeCompare(b.term, 'fr'))
  }, [terms, query, domain])

  // Grouper par lettre initiale
  const groups = useMemo(() => {
    const map: Record<string, Term[]> = {}
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(t)
    }
    return map
  }, [filtered])

  const activeLetters = new Set(Object.keys(groups))

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* Barre de recherche + filtres domaine */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un terme..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-800 outline-none"
            style={{ border: '1.5px solid #E8E8E8' }}
            onFocus={e => e.currentTarget.style.border = '1.5px solid #3183F7'}
            onBlur={e => e.currentTarget.style.border = '1.5px solid #E8E8E8'}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Filtres domaine */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDomain(null)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: !domain ? '#292929' : '#F5F5F5', color: !domain ? '#fff' : '#666' }}
          >
            Tous ({terms.length})
          </button>
          {Object.entries(DOMAIN_META).map(([slug, meta]) => {
            const count = terms.filter(t => t.domain === slug).length
            return (
              <button
                key={slug}
                onClick={() => setDomain(d => d === slug ? null : slug)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: domain === slug ? meta.color : meta.bg,
                  color: domain === slug ? '#fff' : meta.color,
                }}
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Index alphabétique */}
        <div className="flex flex-wrap gap-1">
          {ALPHABET.map(l => (
            <a
              key={l}
              href={activeLetters.has(l) ? `#letter-${l}` : undefined}
              className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors"
              style={{
                color: activeLetters.has(l) ? '#3183F7' : '#D1D5DB',
                cursor: activeLetters.has(l) ? 'pointer' : 'default',
              }}
            >
              {l}
            </a>
          ))}
        </div>
      </div>

      {/* Résultat */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Aucun terme trouvé pour « {query} »</div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(groups).map(([letter, items]) => (
            <div key={letter} id={`letter-${letter}`}>
              <div
                className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 pb-1"
                style={{ borderBottom: '2px solid #EBF2FF' }}
              >
                {letter}
              </div>
              <div className="flex flex-col gap-3">
                {items.map(t => {
                  const meta = DOMAIN_META[t.domain]
                  return (
                    <div key={t.term} className="flex gap-4 p-4 rounded-xl bg-white" style={{ border: '1.5px solid #F0F0F0' }}>
                      <div className="flex-shrink-0 pt-0.5">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">{t.term}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{t.def}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
