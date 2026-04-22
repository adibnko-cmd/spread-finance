'use client'

import { useState } from 'react'

export interface Flashcard {
  front: string
  back: string
  domain?: string
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

interface Props {
  cards: Flashcard[]
  title: string
  domain: string
  onClose: () => void
}

export default function FlashcardViewer({ cards, title, domain, onClose }: Props) {
  const [index, setIndex]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown]     = useState<Set<number>>(new Set())
  const [review, setReview]   = useState<Set<number>>(new Set())
  const [done, setDone]       = useState(false)

  const color = DOMAIN_COLORS[domain] ?? '#3183F7'
  const card  = cards[index]
  const total = cards.length
  const progress = Math.round(((known.size + review.size) / total) * 100)

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

  const next = () => {
    setFlipped(false)
    if (index + 1 >= total) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  const restart = () => {
    setIndex(0)
    setFlipped(false)
    setKnown(new Set())
    setReview(new Set())
    setDone(false)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }}>
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
          <div className="text-4xl mb-4">{known.size === total ? '🎉' : '✅'}</div>
          <div className="text-lg font-black text-gray-800 mb-2">Session terminée !</div>
          <div className="text-sm text-gray-500 mb-6">
            {total} cartes passées en revue
          </div>

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

          <div className="flex gap-2">
            <button
              onClick={restart}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100"
              style={{ border: '1.5px solid #E8E8E8' }}
            >
              Recommencer
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: color }}
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(28,28,46,.95)' }}>
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <div>
          <div className="text-white font-bold text-sm">{title}</div>
          <div className="text-white/40 text-xs">{index + 1} / {total}</div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,.08)' }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,.1)' }}>
          <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: color }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[9px]">
          <span style={{ color: '#36D399' }}>{known.size} sus ✓</span>
          <span className="text-white/30">{total - known.size - review.size} restantes</span>
          <span style={{ color: '#F56751' }}>{review.size} à revoir</span>
        </div>
      </div>

      {/* Card avec animation flip */}
      <div
        className="w-full max-w-lg cursor-pointer select-none"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full transition-all duration-500"
          style={{
            height: 260,
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Face avant */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: 'hidden',
              background: '#fff',
              border: `2px solid ${color}30`,
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color }}>
              Question
            </div>
            <div className="text-base font-semibold text-gray-800 leading-relaxed">{card.front}</div>
            <div className="mt-6 text-xs text-gray-400">Tapez pour voir la réponse →</div>
          </div>

          {/* Face arrière */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#1C1C2E',
              border: `2px solid ${color}60`,
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color }}>
              Réponse
            </div>
            <div className="text-base font-semibold text-white leading-relaxed">{card.back}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {flipped ? (
        <div className="flex gap-3 mt-6 w-full max-w-lg">
          <button
            onClick={handleReview}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-red-400 transition-all hover:bg-red-900/20"
            style={{ border: '1.5px solid rgba(245,103,81,.4)', background: 'rgba(245,103,81,.08)' }}
          >
            À revoir
          </button>
          <button
            onClick={handleKnow}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-green-400 transition-all hover:bg-green-900/20"
            style={{ border: '1.5px solid rgba(54,211,153,.4)', background: 'rgba(54,211,153,.08)' }}
          >
            Je sais ✓
          </button>
        </div>
      ) : (
        <div className="mt-6 text-xs text-white/30 text-center">
          Cliquez sur la carte pour révéler la réponse
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 mt-4">
        {cards.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i === index ? color
                : known.has(i) ? '#36D399'
                : review.has(i) ? '#F56751'
                : 'rgba(255,255,255,.2)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
