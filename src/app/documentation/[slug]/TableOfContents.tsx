'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export interface Heading {
  id: string
  text: string
  level: 'h2' | 'h3'
}

export interface RelatedArticle {
  _id: string
  title: string
  slug: string
  domain?: string
}

interface Props {
  headings: Heading[]
  quizSlug?: string
  flashcardsSlug?: string
  relatedArticles?: RelatedArticle[]
  relatedBasePath?: string
  relatedLabel?: string
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

export default function TableOfContents({ headings, quizSlug, flashcardsSlug, relatedArticles, relatedBasePath = '/articles', relatedLabel = 'Articles liés' }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (headings.length === 0) return
    const elements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[]
    observer.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    elements.forEach(el => observer.current?.observe(el))
    return () => observer.current?.disconnect()
  }, [headings])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  const hasContent = headings.length > 0 || quizSlug || flashcardsSlug || (relatedArticles && relatedArticles.length > 0)
  if (!hasContent) return null

  return (
    <aside
      className="w-52 flex-shrink-0 hidden lg:block sticky top-14 overflow-y-auto"
      style={{ height: 'calc(100vh - 56px)', borderLeft: '1px solid #EBEBEB' }}
    >
      <div className="pt-8 px-4 pb-6 flex flex-col gap-6">

        {/* ── Table des matières ── */}
        {headings.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Sur cette page
            </div>
            <nav className="flex flex-col gap-0.5">
              {headings.map(h => {
                const isActive = activeId === h.id
                return (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(h.id) }}
                    className="flex items-start gap-2 py-1 transition-colors rounded"
                  >
                    <div
                      className="rounded-full flex-shrink-0 mt-1.5 transition-all"
                      style={{ width: 2, height: 10, background: isActive ? '#3183F7' : 'transparent' }}
                    />
                    <span
                      className="text-[11px] leading-snug transition-colors"
                      style={{ color: isActive ? '#3183F7' : '#9CA3AF', fontWeight: isActive ? 600 : 400 }}
                    >
                      {h.text}
                    </span>
                  </a>
                )
              })}
            </nav>
          </div>
        )}

        {/* ── Raccourci Quiz ── */}
        {quizSlug && (
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Quiz
            </div>
            <Link
              href={`/quiz/${quizSlug}?level=1`}
              className="flex items-center gap-2.5 p-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#1C1C2E' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3183F7' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="#fff" strokeWidth="1.3"/>
                  <path d="M5 6c.2-.7.8-1 1.5-1s1.5.5 1.5 1c0 1-1.5 1.5-1.5 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="6.5" cy="10" r=".6" fill="#fff"/>
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">Commencer le quiz</div>
                <div className="text-[9px] text-white/40 mt-0.5">Facile · Moyen · Difficile</div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Raccourci Flashcards ── */}
        {flashcardsSlug && (
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Flashcards
            </div>
            <Link
              href={`/flashcards/${flashcardsSlug}`}
              className="flex items-center gap-2.5 p-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#1C1C2E' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#A855F7' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="1.5" y="3" width="10" height="7" rx="1.5" stroke="#fff" strokeWidth="1.2"/>
                  <path d="M4 6h5M4 8.5h3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">Flashcards</div>
                <div className="text-[9px] text-white/40 mt-0.5">Mémorisez les concepts clés</div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Articles liés ── */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {relatedLabel}
            </div>
            <div className="flex flex-col gap-2">
              {relatedArticles.map(a => (
                <Link
                  key={a._id}
                  href={`${relatedBasePath}/${a.slug}`}
                  className="flex items-start gap-2 p-2.5 rounded-xl border transition-all hover:border-gray-300 hover:bg-gray-50"
                  style={{ border: '1.5px solid #EBEBEB' }}
                >
                  <div
                    className="w-1 rounded-full flex-shrink-0 self-stretch mt-0.5"
                    style={{ background: DOMAIN_COLORS[a.domain ?? ''] ?? '#E8E8E8', minWidth: 3 }}
                  />
                  <span className="text-[11px] text-gray-600 leading-snug font-medium">{a.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}
