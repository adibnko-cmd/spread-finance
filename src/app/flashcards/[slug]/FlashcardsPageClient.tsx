'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Flashcard { front: string; back: string }

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance de marché', maths: 'Maths financières',
  dev: 'Développement IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}

interface Props {
  slug:    string
  title:   string
  domain:  string
  cards:   Flashcard[]
  pdfUrl:  string | null
}

export default function FlashcardsPageClient({ slug, title, domain, cards, pdfUrl }: Props) {
  const color = DOMAIN_COLORS[domain] ?? '#3183F7'

  const [started, setStarted] = useState(false)
  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known,   setKnown]   = useState<Set<number>>(new Set())
  const [review,  setReview]  = useState<Set<number>>(new Set())
  const [done,    setDone]    = useState(false)

  const card     = cards[index]
  const total    = cards.length
  const progress = total > 0 ? Math.round(((known.size + review.size) / total) * 100) : 0

  const next = () => {
    setFlipped(false)
    if (index + 1 >= total) setDone(true)
    else setIndex(i => i + 1)
  }

  const handleKnow = () => {
    setKnown(prev => new Set([...prev, index]))
    setReview(prev => { const s = new Set(prev); s.delete(index); return s })
    next()
  }

  const handleReview = () => {
    setReview(prev => new Set([...prev, index]))
    setKnown(prev => { const s = new Set(prev); s.delete(index); return s })
    next()
  }

  const restart = () => {
    setIndex(0); setFlipped(false)
    setKnown(new Set()); setReview(new Set()); setDone(false)
  }

  // ── Écran d'intro ────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
        <nav className="h-14 flex items-center justify-between px-8 sticky top-0 z-10"
          style={{ background: '#292929' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
              style={{ background: '#3183F7' }}>SF</div>
            <div>
              <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
              <div style={{ fontFamily: 'Permanent Marker, cursive', color: '#3183F7', fontSize: 9 }}>Finance</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/documentation/${slug}`} className="text-xs text-white/50 hover:text-white/90 transition-colors">
              ← Retour au chapitre
            </Link>
            <Link href="/dashboard/flashcards" className="text-xs text-white/50 hover:text-white/90 transition-colors">
              Tous les decks
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Domain badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6"
              style={{ background: `${color}15`, color }}>
              {DOMAIN_NAMES[domain] ?? domain}
            </div>

            <div className="text-4xl mb-5">🃏</div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{title}</h1>
            <p className="text-sm text-gray-500 mb-8">
              {total} carte{total > 1 ? 's' : ''} de révision
            </p>

            {/* Cards preview */}
            <div className="relative h-28 mb-8">
              {[2, 1, 0].map(offset => (
                <div key={offset}
                  className="absolute inset-x-0 rounded-2xl"
                  style={{
                    height: 88,
                    top: offset * 6,
                    left: offset * 8,
                    right: offset * 8,
                    background: offset === 0 ? '#fff' : `${color}${offset === 1 ? '20' : '10'}`,
                    border: `1.5px solid ${offset === 0 ? '#E8E8E8' : `${color}20`}`,
                    zIndex: 3 - offset,
                  }}
                >
                  {offset === 0 && cards[0] && (
                    <div className="flex items-center justify-center h-full px-6">
                      <p className="text-sm font-semibold text-gray-700 text-center line-clamp-2">
                        {cards[0].front}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStarted(true)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: color }}
              >
                Commencer la révision →
              </button>

              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                  style={{ border: '1.5px solid #E8E8E8', background: '#fff' }}>
                  Télécharger la fiche PDF
                </a>
              )}

              <Link href={`/quiz/${slug}?level=1`}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Faire le quiz →
              </Link>
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 rounded-xl text-left" style={{ background: '#1C1C2E' }}>
              <div className="text-[11px] font-bold text-white mb-1">💡 Comment utiliser les flashcards</div>
              <div className="text-[10px] text-white/40 leading-relaxed">
                Lisez la question, répondez mentalement, retournez la carte.
                Marquez ce que vous savez et ce que vous devez revoir.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Écran résultats ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#1C1C2E' }}>
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
          <div className="text-4xl mb-4">{known.size === total ? '🎉' : known.size > review.size ? '✅' : '📚'}</div>
          <div className="text-lg font-black text-gray-800 mb-1">Session terminée !</div>
          <div className="text-xs text-gray-500 mb-6">{total} cartes passées en revue</div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl p-4" style={{ background: '#E6FAF3', border: '1.5px solid #A7F3D0' }}>
              <div className="text-2xl font-black text-green-700">{known.size}</div>
              <div className="text-xs text-green-600 font-semibold">Je sais ✓</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#FEF0EE', border: '1.5px solid #FECACA' }}>
              <div className="text-2xl font-black text-red-700">{review.size}</div>
              <div className="text-xs text-red-600 font-semibold">À revoir</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={restart}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ border: '1.5px solid #E8E8E8' }}>
              Recommencer
            </button>
            <Link href={`/quiz/${slug}?level=1`}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white text-center"
              style={{ background: color }}>
              Faire le quiz →
            </Link>
          </div>
          <Link href={`/documentation/${slug}`}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Retour au chapitre
          </Link>
        </div>
      </div>
    )
  }

  // ── Viewer ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#1C1C2E' }}>

      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <div>
          <div className="text-white font-bold text-sm truncate max-w-xs">{title}</div>
          <div className="text-white/40 text-xs">{index + 1} / {total}</div>
        </div>
        <Link href={`/documentation/${slug}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,.08)' }}>
          ✕
        </Link>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-6">
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,.1)' }}>
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: color }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[9px]">
          <span style={{ color: '#36D399' }}>{known.size} sus ✓</span>
          <span className="text-white/30">{total - known.size - review.size} restantes</span>
          <span style={{ color: '#F56751' }}>{review.size} à revoir</span>
        </div>
      </div>

      {/* Card flip */}
      <div className="w-full max-w-lg cursor-pointer select-none"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped(f => !f)}>
        <div className="relative w-full transition-all duration-500"
          style={{
            height: 280,
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>

          {/* Face avant */}
          <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden', background: '#fff', border: `2px solid ${color}30` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color }}>Question</div>
            <div className="text-base font-semibold text-gray-800 leading-relaxed">{card.front}</div>
            <div className="mt-6 text-xs text-gray-400">Tapez pour voir la réponse →</div>
          </div>

          {/* Face arrière */}
          <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#0F0F1E',
              border: `2px solid ${color}60`,
            }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color }}>Réponse</div>
            <div className="text-base font-semibold text-white leading-relaxed whitespace-pre-line">{card.back}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {flipped ? (
        <div className="flex gap-3 mt-6 w-full max-w-lg">
          <button onClick={handleReview}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-red-400 transition-all hover:bg-red-900/20"
            style={{ border: '1.5px solid rgba(245,103,81,.4)', background: 'rgba(245,103,81,.08)' }}>
            À revoir
          </button>
          <button onClick={handleKnow}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-green-400 transition-all hover:bg-green-900/20"
            style={{ border: '1.5px solid rgba(54,211,153,.4)', background: 'rgba(54,211,153,.08)' }}>
            Je sais ✓
          </button>
        </div>
      ) : (
        <div className="mt-6 text-xs text-white/30">Cliquez sur la carte pour révéler la réponse</div>
      )}

      {/* Dots */}
      <div className="flex gap-1.5 mt-5">
        {cards.map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i === index ? color
                : known.has(i) ? '#36D399'
                : review.has(i) ? '#F56751'
                : 'rgba(255,255,255,.15)',
            }} />
        ))}
      </div>
    </div>
  )
}
