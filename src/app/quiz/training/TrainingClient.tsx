'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Question {
  _key: string
  text: string
  explanation: string
  answers: { text: string; isCorrect: boolean }[]
  domain: string
  level: number
}

interface Props {
  questions: Question[]
  isPremium: boolean
}

const DOMAINS = [
  { slug: 'all',     name: 'Tous', color: '#292929' },
  { slug: 'finance', name: 'Finance', color: '#3183F7' },
  { slug: 'maths',   name: 'Maths',   color: '#A855F7' },
  { slug: 'dev',     name: 'Dev',     color: '#1a5fc8' },
  { slug: 'pm',      name: 'PM',      color: '#FFC13D' },
  { slug: 'ml',      name: 'ML',      color: '#F56751' },
]

const DIFFICULTIES = [
  { slug: 'easy',   label: 'Facile',   levels: [1],    premium: false },
  { slug: 'medium', label: 'Moyen',    levels: [2],    premium: false },
  { slug: 'hard',   label: 'Difficile',levels: [3],    premium: true  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Phase = 'config' | 'playing' | 'results'

export function TrainingClient({ questions, isPremium }: Props) {
  const [phase,      setPhase]      = useState<Phase>('config')
  const [domain,     setDomain]     = useState('all')
  const [difficulty, setDifficulty] = useState('easy')
  const [gameQ,      setGameQ]      = useState<Question[]>([])
  const [current,    setCurrent]    = useState(0)
  const [selected,   setSelected]   = useState<number | null>(null)
  const [revealed,   setRevealed]   = useState(false)
  const [score,      setScore]      = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState<{ xp_earned: number; cash_earned: number; passed: boolean } | null>(null)

  const diff = DIFFICULTIES.find(d => d.slug === difficulty)!

  const filtered = useMemo(() => {
    let q = questions.filter(q => diff.levels.includes(q.level))
    if (domain !== 'all') q = q.filter(q => q.domain === domain)
    return q
  }, [questions, domain, difficulty])

  function startGame() {
    const picked = shuffle(filtered).slice(0, 10)
    setGameQ(picked)
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setResult(null)
    setPhase('playing')
  }

  function handleAnswer(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (gameQ[current].answers[idx]?.isCorrect) setScore(s => s + 1)
  }

  async function handleNext() {
    if (current < gameQ.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setPhase('results')
      setSubmitting(true)
      try {
        const res = await fetch('/api/quiz/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'training',
            domain_slug: domain === 'all' ? undefined : domain,
            difficulty,
            total_questions: gameQ.length,
            correct_answers: score + (gameQ[current].answers[selected!]?.isCorrect ? 1 : 0),
          }),
        })
        const data = await res.json()
        setResult(data)
      } catch {}
      setSubmitting(false)
    }
  }

  // ── Config ──────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
        <div className="w-full max-w-md">
          <Link href="/dashboard/quiz" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quiz & Évaluations
          </Link>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">🎯</span>
              <div>
                <div className="text-base font-black text-gray-800">Training libre</div>
                <div className="text-xs text-gray-400">Questions aléatoires de la bibliothèque</div>
              </div>
            </div>

            {/* Domain */}
            <div className="mb-5">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Domaine</div>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map(d => (
                  <button
                    key={d.slug}
                    onClick={() => setDomain(d.slug)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: domain === d.slug ? d.color : '#F5F5F5',
                      color: domain === d.slug ? '#fff' : '#666',
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Difficulté</div>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => {
                  const locked = d.premium && !isPremium
                  return (
                    <button
                      key={d.slug}
                      onClick={() => !locked && setDifficulty(d.slug)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all relative"
                      style={{
                        background: difficulty === d.slug ? '#1C1C2E' : '#F5F5F5',
                        color: difficulty === d.slug ? '#fff' : locked ? '#ccc' : '#666',
                        cursor: locked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {d.label}
                      {locked && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#EBF2FF', color: '#3183F7' }}>
                          Premium
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-[11px] text-gray-400 mb-4 text-center">
              {filtered.length} questions disponibles · 10 sélectionnées aléatoirement
            </div>

            <button
              onClick={startGame}
              disabled={filtered.length === 0}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#3183F7' }}
            >
              Commencer →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────
  if (phase === 'playing') {
    const q = gameQ[current]
    const progress = ((current) / gameQ.length) * 100

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E8E8E8' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#3183F7' }} />
            </div>
            <span className="text-xs font-bold text-gray-500 flex-shrink-0">{current + 1}/{gameQ.length}</span>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: '#36D399' }}>✓ {score}</span>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-5">{q.text}</p>

            <div className="flex flex-col gap-2 mb-5">
              {q.answers.map((a, i) => {
                let bg = '#F5F5F5', color = '#333', border = 'transparent'
                if (revealed) {
                  if (a.isCorrect)          { bg = '#E6FAF3'; color = '#0d7a56'; border = '#36D399' }
                  else if (i === selected)  { bg = '#FEF0EE'; color = '#c0392b'; border = '#F56751' }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all"
                    style={{ background: bg, color, border: `1.5px solid ${border}` }}
                  >
                    {a.text}
                  </button>
                )
              })}
            </div>

            {revealed && q.explanation && (
              <div className="rounded-xl p-3 mb-4 text-xs leading-relaxed" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>
                💡 {q.explanation}
              </div>
            )}

            {revealed && (
              <button
                onClick={handleNext}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: '#1C1C2E' }}
              >
                {current < gameQ.length - 1 ? 'Suivant →' : 'Voir les résultats →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────
  const finalScore = Math.round((score / gameQ.length) * 100)
  const passed = finalScore >= 70
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-5xl mb-4">{passed ? '🎉' : '😅'}</div>
          <div className="text-2xl font-black mb-1" style={{ color: passed ? '#36D399' : '#F56751' }}>{finalScore}%</div>
          <div className="text-sm font-bold text-gray-800 mb-1">{passed ? 'Réussi !' : 'Pas encore'}</div>
          <div className="text-xs text-gray-400 mb-6">{score} / {gameQ.length} bonnes réponses</div>

          {!submitting && result && (
            <div className="flex items-center justify-center gap-4 mb-6">
              {result.xp_earned > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#EBF2FF' }}>
                  <span className="text-sm">⭐</span>
                  <span className="text-xs font-black text-blue-700">+{result.xp_earned} XP</span>
                </div>
              )}
              {result.cash_earned > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#FFF8E6' }}>
                  <span className="text-sm">💰</span>
                  <span className="text-xs font-black" style={{ color: '#b37700' }}>+{result.cash_earned}</span>
                </div>
              )}
            </div>
          )}

          <Link
            href="/dashboard/quiz"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quiz &amp; Évaluations
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('config') }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: '#F5F5F5', color: '#333' }}
            >
              Reconfigurer
            </button>
            <button
              onClick={startGame}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: '#3183F7' }}
            >
              Rejouer →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
