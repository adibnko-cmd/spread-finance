'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'

const DOMAIN_ORDER = ['finance', 'maths', 'dev', 'pm', 'ml']
const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance de marché', maths: 'Maths financières',
  dev: 'Développement IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}
const DOMAIN_EMOJIS: Record<string, string> = {
  finance: '📈', maths: '∑', dev: '💻', pm: '📋', ml: '🤖',
}

type Chapter = {
  _id: string
  slug: string
  title: string
  domain: string
  part: number
  partTitle: string
  order: number
}

type EvalResult = { score: number; passed: boolean; highestPassedLevel: number; partTitle?: string }

type DomainSection = {
  domain: string
  name: string
  color: string
  emoji: string
  parts: {
    part: number
    partTitle: string
    chapters: Chapter[]
    evalResult?: EvalResult
  }[]
}

type Props = {
  chapters: Chapter[]
  progressMap: Record<string, string>
  quizMap: Record<string, { score: number; passed: boolean }>
  evalMap: Record<string, EvalResult>
}

function getStars(score: number | undefined): 0 | 1 | 2 | 3 {
  if (score === undefined || score < 50) return 0
  if (score >= 90) return 3
  if (score >= 70) return 2
  return 1
}

function Stars({ count }: { count: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex gap-0.5 justify-center mt-1">
      {([1, 2, 3] as const).map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12">
          <path
            d="M6 1l1.3 3h3.2l-2.6 1.9.9 3L6 7.4 3.2 8.9l.9-3L1.5 4h3.2z"
            fill={i <= count ? '#FFC13D' : '#E2E8F0'}
          />
        </svg>
      ))}
    </div>
  )
}

function ChapterNode({ chapter, color, stars, isRead }: {
  chapter: Chapter
  color: string
  stars: 0 | 1 | 2 | 3
  isRead: boolean
}) {
  const bg = stars > 0 ? color : isRead ? '#94A3B8' : '#D1D5DB'

  return (
    <Link href={`/documentation/${chapter.slug}`} className="flex flex-col items-center w-24 group flex-shrink-0">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ background: bg, border: '4px solid white', boxShadow: `0 4px 14px ${bg}50` }}
      >
        {stars > 0 ? (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
            <path d="M10 2l2 5h5l-4 3.5 1.5 5L10 13l-4.5 2.5L7 10.5 3 7h5z" />
          </svg>
        ) : isRead ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l4 4 6-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="w-3 h-3 rounded-full bg-white opacity-40" />
        )}
      </div>
      <Stars count={stars} />
      {isRead && stars === 0 && (
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 leading-tight"
          style={{ background: '#D1FAE5', color: '#059669' }}>
          Lu
        </span>
      )}
      <span className="text-[10px] font-semibold text-center mt-1 leading-tight text-gray-700 px-1 line-clamp-2">
        {chapter.title}
      </span>
    </Link>
  )
}

function PartSerpentine({ chapters, color, progressMap, quizMap }: {
  chapters: Chapter[]
  color: string
  progressMap: Record<string, string>
  quizMap: Record<string, { score: number; passed: boolean }>
}) {
  const rows: Chapter[][] = []
  for (let i = 0; i < chapters.length; i += 3) rows.push(chapters.slice(i, i + 3))

  return (
    <div className="space-y-1">
      {rows.map((row, rowIndex) => {
        const isReversed = rowIndex % 2 === 1
        const displayRow = isReversed ? [...row].reverse() : row
        const isLastRow = rowIndex === rows.length - 1

        return (
          <div key={rowIndex}>
            {/* Node row */}
            <div className="flex items-start justify-between">
              {displayRow.map((ch, i) => {
                const quiz = quizMap[ch.slug]
                const stars = getStars(quiz?.score)
                const status = progressMap[ch.slug]
                const isRead = !!status && status !== 'not_started'
                return (
                  <Fragment key={ch._id}>
                    <ChapterNode chapter={ch} color={color} stars={stars} isRead={isRead} />
                    {i < displayRow.length - 1 && (
                      <div className="flex-1 flex items-center mt-7 mx-1">
                        <div className="h-1 w-full rounded-full" style={{ background: `${color}28` }} />
                      </div>
                    )}
                  </Fragment>
                )
              })}
              {/* Pad incomplete last row */}
              {row.length < 3 && Array(3 - row.length).fill(null).map((_, j) => (
                <div key={j} className="w-24 flex-shrink-0" />
              ))}
            </div>

            {/* Vertical bend to next row */}
            {!isLastRow && (
              <div
                className="flex py-1"
                style={{ justifyContent: isReversed ? 'flex-start' : 'flex-end',
                          paddingLeft: isReversed ? '44px' : undefined,
                          paddingRight: !isReversed ? '44px' : undefined }}
              >
                <div className="w-0.5 h-5 rounded-full" style={{ background: `${color}40` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EvalNode({ domain, part, partTitle, color, evalResult }: {
  domain: string
  part: number
  partTitle: string
  color: string
  evalResult?: EvalResult
}) {
  const stars = (evalResult?.highestPassedLevel ?? 0) as 0 | 1 | 2 | 3
  const passed = stars > 0

  return (
    <Link
      href={`/evaluation/${domain}/${part}/1`}
      className="flex items-center gap-3 mt-5 p-3 rounded-2xl border-2 border-dashed group transition-all hover:shadow-sm"
      style={{
        borderColor: passed ? color : '#CBD5E1',
        background: passed ? `${color}0D` : '#FAFAFA',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
        style={{ background: passed ? color : '#E2E8F0' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4h10M3 7.5h10M3 11h6" stroke={passed ? 'white' : '#9CA3AF'}
            strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-gray-800">Évaluation — Partie {part}</div>
        <div className="text-[10px] text-gray-400 truncate">{partTitle}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {/* Étoiles : 1 par niveau passé */}
        <div className="flex gap-0.5">
          {([1, 2, 3] as const).map(i => (
            <svg key={i} width="13" height="13" viewBox="0 0 12 12">
              <path
                d="M6 1l1.3 3h3.2l-2.6 1.9.9 3L6 7.4 3.2 8.9l.9-3L1.5 4h3.2z"
                fill={i <= stars ? '#FFC13D' : '#E2E8F0'}
              />
            </svg>
          ))}
        </div>
        {passed ? (
          <span className="text-[10px] font-black" style={{ color }}>{evalResult!.score}%</span>
        ) : (
          <span className="text-[10px] font-semibold text-gray-400">Commencer →</span>
        )}
      </div>
    </Link>
  )
}

const DOMAIN_FILTERS = [
  { key: 'global',  label: 'Global',   emoji: '🌐' },
  { key: 'finance', label: 'Finance',  emoji: '📈' },
  { key: 'maths',   label: 'Maths',    emoji: '∑'  },
  { key: 'dev',     label: 'Dev',      emoji: '💻' },
  { key: 'pm',      label: 'PM',       emoji: '📋' },
  { key: 'ml',      label: 'ML',       emoji: '🤖' },
]

export default function RoadmapClient({ chapters, progressMap, quizMap, evalMap }: Props) {
  const [selectedDomain, setSelectedDomain] = useState<string>('global')

  const filteredChapters = selectedDomain === 'global'
    ? chapters
    : chapters.filter(c => c.domain === selectedDomain)

  const totalChapters = filteredChapters.length
  const readCount     = filteredChapters.filter(c => progressMap[c.slug] && progressMap[c.slug] !== 'not_started').length
  const starredCount  = filteredChapters.filter(c => getStars(quizMap[c.slug]?.score) > 0).length

  const domainSections: DomainSection[] = []
  for (const domain of DOMAIN_ORDER) {
    const domainChapters = filteredChapters
      .filter(c => c.domain === domain)
      .sort((a, b) => a.part !== b.part ? a.part - b.part : a.order - b.order)
    if (domainChapters.length === 0) continue

    const partNumbers = [...new Set(domainChapters.map(c => c.part))].sort((a, b) => a - b)

    domainSections.push({
      domain,
      name: DOMAIN_NAMES[domain],
      color: DOMAIN_COLORS[domain],
      emoji: DOMAIN_EMOJIS[domain],
      parts: partNumbers.map(part => ({
        part,
        partTitle: domainChapters.find(c => c.part === part)?.partTitle ?? `Partie ${part}`,
        chapters: domainChapters.filter(c => c.part === part),
        evalResult: evalMap[`${domain}-${part}`] as EvalResult | undefined,
      })),
    })
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F6F8' }}>
      <div className="max-w-md mx-auto px-4 py-6 space-y-10">

        {/* Filtre par domaine */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {DOMAIN_FILTERS.map(f => {
            const isActive = selectedDomain === f.key
            const color = isActive ? (DOMAIN_COLORS[f.key] ?? '#1C1C2E') : undefined
            return (
              <button
                key={f.key}
                onClick={() => setSelectedDomain(f.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: isActive ? (color ?? '#1C1C2E') : '#fff',
                  color:      isActive ? '#fff' : '#6B7280',
                  border:     `1.5px solid ${isActive ? (color ?? '#1C1C2E') : '#E8E8E8'}`,
                }}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#fff', border: '1.5px solid #EBEBEB' }}>
            <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1l1.3 3h3.2l-2.6 1.9.9 3L6 7.4 3.2 8.9l.9-3L1.5 4h3.2z" fill="#FFC13D" /></svg>
            <span className="text-[11px] font-bold text-gray-600">{starredCount} / {totalChapters} étoilés</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#fff', border: '1.5px solid #EBEBEB' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#36D399" strokeWidth="1.3"/><path d="M3.5 6l2 2 3-3" stroke="#36D399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[11px] font-bold text-gray-600">{readCount} lus</span>
          </div>
        </div>
        {domainSections.map(section => (
          <div key={section.domain}>
            {/* Domain banner */}
            <div className="rounded-2xl px-4 py-3 mb-6 flex items-center gap-3" style={{ background: section.color }}>
              <span className="text-xl">{section.emoji}</span>
              <div>
                <div className="text-white font-bold text-sm">{section.name}</div>
                <div className="text-white/70 text-[10px]">
                  {section.parts.reduce((acc, p) => acc + p.chapters.length, 0)} chapitres
                  · {section.parts.length} partie{section.parts.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Parts */}
            <div className="space-y-8">
              {section.parts.map(({ part, partTitle, chapters: partChapters, evalResult }) => (
                <div key={part}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-4 px-1"
                    style={{ color: section.color }}>
                    Partie {part} — {partTitle}
                  </div>
                  <PartSerpentine
                    chapters={partChapters}
                    color={section.color}
                    progressMap={progressMap}
                    quizMap={quizMap}
                  />
                  <EvalNode
                    domain={section.domain}
                    part={part}
                    partTitle={partTitle}
                    color={section.color}
                    evalResult={evalResult}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm text-gray-400">Aucun contenu disponible pour l&apos;instant.</p>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
