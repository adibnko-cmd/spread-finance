'use client'

import { useState } from 'react'
import FlashcardViewer, { type Flashcard } from './FlashcardViewer'

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance de marché', maths: 'Maths financières',
  dev: 'Développement IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}

export interface FlashcardDeck {
  slug: string
  title: string
  domain: string
  cardCount: number
  cards: Flashcard[]
  isPdf: boolean
  pdfUrl?: string
}

interface Props {
  decks: FlashcardDeck[]
}

export default function FlashcardsClient({ decks }: Props) {
  const [activeDomain, setActiveDomain] = useState<string>('all')
  const [activeDeck, setActiveDeck]     = useState<FlashcardDeck | null>(null)

  const domains = ['all', ...Array.from(new Set(decks.map(d => d.domain)))]

  const filtered = activeDomain === 'all'
    ? decks
    : decks.filter(d => d.domain === activeDomain)

  return (
    <>
      {activeDeck && activeDeck.cards.length > 0 && (
        <FlashcardViewer
          cards={activeDeck.cards}
          title={activeDeck.title}
          domain={activeDeck.domain}
          onClose={() => setActiveDeck(null)}
        />
      )}

      {/* Domain filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setActiveDomain(d)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeDomain === d
                ? (d === 'all' ? '#292929' : `${DOMAIN_COLORS[d]}15`)
                : '#F5F5F5',
              color: activeDomain === d
                ? (d === 'all' ? '#fff' : DOMAIN_COLORS[d])
                : '#9CA3AF',
              border: activeDomain === d
                ? `1.5px solid ${d === 'all' ? '#292929' : DOMAIN_COLORS[d]}`
                : '1.5px solid transparent',
            }}
          >
            {d === 'all' ? 'Tous' : DOMAIN_NAMES[d] ?? d}
          </button>
        ))}
      </div>

      {/* Decks grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#F9FAFB', border: '1.5px dashed #E8E8E8' }}>
          <div className="text-3xl mb-3">🃏</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucune flashcard disponible</div>
          <p className="text-xs text-gray-400">Des decks seront ajoutés prochainement pour ce domaine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(deck => {
            const color = DOMAIN_COLORS[deck.domain] ?? '#888'
            return (
              <div
                key={deck.slug}
                className="bg-white rounded-2xl p-5 flex flex-col gap-3"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${color}15` }}
                  >
                    🃏
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${color}12`, color }}
                  >
                    {DOMAIN_NAMES[deck.domain] ?? deck.domain}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-800 leading-snug mb-1">{deck.title}</div>
                  <div className="text-[10px] text-gray-400">{deck.cardCount} carte{deck.cardCount > 1 ? 's' : ''}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  {deck.cards.length > 0 && (
                    <button
                      onClick={() => setActiveDeck(deck)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: color }}
                    >
                      Réviser →
                    </button>
                  )}
                  {deck.pdfUrl && (
                    <a
                      href={deck.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl text-xs font-bold transition-colors hover:bg-gray-50 flex-shrink-0"
                      style={{ border: '1.5px solid #E8E8E8', color: '#6B7280' }}
                    >
                      PDF
                    </a>
                  )}
                  {deck.cards.length === 0 && !deck.pdfUrl && (
                    <div className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-400 text-center"
                      style={{ border: '1.5px dashed #E8E8E8' }}>
                      Prochainement
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
