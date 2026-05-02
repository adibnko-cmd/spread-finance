'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Question {
  _key: string; text: string; explanation: string
  answers: { text: string; isCorrect: boolean }[]
  domain: string; level: number
}

interface Props { questions: Question[] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

type Phase = 'intro' | 'playing' | 'dead' | 'clear'

export function KnockoutClient({ questions }: Props) {
  const [phase,    setPhase]    = useState<Phase>('intro')
  const [gameQ,    setGameQ]    = useState<Question[]>([])
  const [current,  setCurrent]  = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [streak,   setStreak]   = useState(0)
  const [result,   setResult]   = useState<{ xp_earned: number; cash_earned: number } | null>(null)

  function startGame() {
    setGameQ(shuffle(questions).slice(0, 30))
    setCurrent(0); setSelected(null); setRevealed(false); setStreak(0); setResult(null)
    setPhase('playing')
  }

  async function handleAnswer(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = gameQ[current].answers[idx]?.isCorrect
    if (!correct) {
      setPhase('dead')
      try {
        const res = await fetch('/api/quiz/free', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'knockout', total_questions: current + 1, correct_answers: streak, time_seconds: 0 }),
        })
        setResult(await res.json())
      } catch {}
    } else {
      setStreak(s => s + 1)
    }
  }

  function handleNext() {
    if (current + 1 >= gameQ.length) {
      setPhase('clear')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const DOMAIN_COLORS: Record<string, string> = { finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751' }

  if (phase === 'intro') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
      <div className="w-full max-w-md text-center">
        <Link href="/dashboard/quiz" className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-8">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <div className="text-6xl mb-4">💀</div>
        <div className="text-2xl font-black text-white mb-2">Mode Knockout</div>
        <div className="text-sm text-white/50 mb-8 leading-relaxed">
          Questions aléatoires de tous les niveaux et domaines.<br/>
          <strong className="text-white/80">Une seule mauvaise réponse</strong> et c&apos;est terminé.
        </div>
        <div className="flex items-center justify-center gap-6 mb-8 text-xs text-white/40">
          <span>Difficulté : Mixte</span>
          <span>·</span>
          <span>Sans limite</span>
          <span>·</span>
          <span>Premium only</span>
        </div>
        <button onClick={startGame} className="w-full py-3 rounded-xl text-sm font-black" style={{ background: '#F56751', color: '#fff' }}>
          Je tente ma chance 💀
        </button>
      </div>
    </div>
  )

  if (phase === 'dead') {
    const record = streak
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">💀</div>
          <div className="text-2xl font-black text-white mb-1">Game Over</div>
          <div className="text-sm text-white/50 mb-2">Éliminé à la question {current + 1}</div>
          <div className="text-4xl font-black mb-1" style={{ color: '#F56751' }}>{record}</div>
          <div className="text-xs text-white/40 mb-6">bonne{record > 1 ? 's' : ''} réponse{record > 1 ? 's' : ''} d&apos;affilée</div>
          {result && result.xp_earned > 0 && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(49,131,247,.15)' }}><span>⭐</span><span className="text-xs font-black text-blue-400">+{result.xp_earned} XP</span></div>
              {result.cash_earned > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,193,61,.15)' }}><span>💰</span><span className="text-xs font-black" style={{ color: '#FFC13D' }}>+{result.cash_earned}</span></div>}
            </div>
          )}
          {/* Mauvaise réponse */}
          {revealed && gameQ[current] && (
            <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'rgba(245,103,81,.1)', border: '1.5px solid rgba(245,103,81,.3)' }}>
              <div className="text-[10px] font-bold text-red-400 mb-1">Bonne réponse :</div>
              <div className="text-xs text-white/70">{gameQ[current].answers.find(a => a.isCorrect)?.text}</div>
              {gameQ[current].explanation && <div className="text-[10px] text-white/40 mt-2">💡 {gameQ[current].explanation}</div>}
            </div>
          )}
          <button onClick={startGame} className="w-full py-3 rounded-xl text-sm font-black" style={{ background: '#F56751' }}>
            Réessayer 💀
          </button>
          <Link
            href="/dashboard/quiz"
            className="flex items-center justify-center gap-1.5 text-xs mt-4 transition-colors"
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quiz &amp; Évaluations
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'clear') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏆</div>
        <div className="text-2xl font-black text-white mb-1">Parfait !</div>
        <div className="text-sm text-white/50 mb-6">Toutes les questions réussies sans faute.</div>
        <button onClick={startGame} className="w-full py-3 rounded-xl text-sm font-black text-white" style={{ background: '#36D399' }}>Nouvelle session</button>
        <Link
          href="/dashboard/quiz"
          className="flex items-center justify-center gap-1.5 text-xs mt-4 transition-colors"
          style={{ color: 'rgba(255,255,255,.4)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Quiz &amp; Évaluations
        </Link>
      </div>
    </div>
  )

  const q = gameQ[current]
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: '#36D399' }} />
            ))}
            {streak > 10 && <span className="text-xs font-black" style={{ color: '#36D399' }}>+{streak - 10}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLORS[q.domain] ?? '#888' }} />
            <span className="text-xs text-white/40">Q{current + 1}</span>
            <span className="text-xs font-black" style={{ color: '#36D399' }}>🔥 {streak}</span>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.08)' }}>
          <p className="text-sm font-semibold text-white leading-relaxed mb-5">{q.text}</p>
          <div className="flex flex-col gap-2 mb-4">
            {q.answers.map((a, i) => {
              let bg = 'rgba(255,255,255,.06)', color = 'rgba(255,255,255,.8)', border = 'rgba(255,255,255,.08)'
              if (revealed) {
                if (a.isCorrect)         { bg = '#E6FAF3'; color = '#0d7a56'; border = '#36D399' }
                else if (i === selected) { bg = '#3d0a0a'; color = '#F56751'; border = '#F56751' }
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)}
                  className="w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{ background: bg, color, border: `1.5px solid ${border}` }}>
                  {a.text}
                </button>
              )
            })}
          </div>
          {revealed && gameQ[current].answers[selected!]?.isCorrect && (
            <button onClick={handleNext} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: '#36D399', color: '#fff' }}>
              Continuer →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
