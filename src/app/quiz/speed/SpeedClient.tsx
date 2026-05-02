'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface Question {
  _key: string; text: string; explanation: string
  answers: { text: string; isCorrect: boolean }[]
  domain: string; level: number
}

interface Props { questions: Question[] }

const DIFFICULTIES = [
  { slug: 'easy',   label: 'Facile',    levels: [1], timer: 30, bonus: 10 },
  { slug: 'medium', label: 'Moyen',     levels: [2], timer: 20, bonus: 15 },
  { slug: 'hard',   label: 'Difficile', levels: [3], timer: 15, bonus: 20 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

type Phase = 'config' | 'playing' | 'results'

export function SpeedClient({ questions }: Props) {
  const [phase,      setPhase]      = useState<Phase>('config')
  const [difficulty, setDifficulty] = useState('easy')
  const [gameQ,      setGameQ]      = useState<Question[]>([])
  const [current,    setCurrent]    = useState(0)
  const [selected,   setSelected]   = useState<number | null>(null)
  const [revealed,   setRevealed]   = useState(false)
  const [score,      setScore]      = useState(0)
  const [bonusXp,    setBonusXp]    = useState(0)
  const [timeLeft,   setTimeLeft]   = useState(30)
  const [result,     setResult]     = useState<{ xp_earned: number; cash_earned: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const diff = DIFFICULTIES.find(d => d.slug === difficulty)!

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    setTimeLeft(diff.timer)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer()
          setRevealed(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [diff.timer, stopTimer])

  useEffect(() => { return () => stopTimer() }, [stopTimer])

  function startGame() {
    const filtered = shuffle(questions.filter(q => diff.levels.includes(q.level))).slice(0, 10)
    setGameQ(filtered)
    setCurrent(0); setSelected(null); setRevealed(false)
    setScore(0); setBonusXp(0); setResult(null)
    setPhase('playing')
    setTimeout(startTimer, 100)
  }

  function handleAnswer(idx: number) {
    if (revealed) return
    stopTimer()
    setSelected(idx)
    setRevealed(true)
    const correct = gameQ[current].answers[idx]?.isCorrect
    if (correct) {
      setScore(s => s + 1)
      if (timeLeft > diff.timer * 0.5) setBonusXp(b => b + diff.bonus)
    }
  }

  async function handleNext() {
    if (current < gameQ.length - 1) {
      setCurrent(c => c + 1); setSelected(null); setRevealed(false)
      startTimer()
    } else {
      setPhase('results')
      const finalScore = Math.round((score / gameQ.length) * 100)
      try {
        const res = await fetch('/api/quiz/free', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'speed', difficulty, total_questions: gameQ.length, correct_answers: score, time_seconds: 0 }),
        })
        const data = await res.json()
        setResult({ ...data, xp_earned: (data.xp_earned ?? 0) + bonusXp })
      } catch {}
    }
  }

  const timerPct = (timeLeft / diff.timer) * 100
  const timerColor = timerPct > 50 ? '#36D399' : timerPct > 25 ? '#FFC13D' : '#F56751'

  if (phase === 'config') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
      <div className="w-full max-w-md">
        <Link href="/dashboard/quiz" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-6">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl">⚡</span>
            <div>
              <div className="text-base font-black text-white">Mode Speed</div>
              <div className="text-xs text-white/40">Chrono par question — bonus XP si rapide</div>
            </div>
          </div>
          <div className="mb-6">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Difficulté</div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.slug} onClick={() => setDifficulty(d.slug)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: difficulty === d.slug ? '#FFC13D' : 'rgba(255,255,255,.08)', color: difficulty === d.slug ? '#1C1C2E' : 'rgba(255,255,255,.5)' }}>
                  <div>{d.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{d.timer}s · +{d.bonus} bonus</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={startGame} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#FFC13D', color: '#1C1C2E' }}>
            Démarrer ⚡
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'playing') {
    const q = gameQ[current]
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
        <div className="w-full max-w-lg">
          {/* Timer bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40">{current + 1}/{gameQ.length}</span>
              <span className="text-lg font-black" style={{ color: timerColor }}>{timeLeft}s</span>
              <span className="text-xs font-bold" style={{ color: '#36D399' }}>✓ {score} | +{bonusXp} bonus XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${timerPct}%`, background: timerColor }} />
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)' }}>
            <p className="text-sm font-semibold text-white leading-relaxed mb-5">{q.text}</p>
            <div className="flex flex-col gap-2 mb-4">
              {q.answers.map((a, i) => {
                let bg = 'rgba(255,255,255,.06)', color = 'rgba(255,255,255,.8)', border = 'rgba(255,255,255,.1)'
                if (revealed) {
                  if (a.isCorrect)         { bg = '#E6FAF3'; color = '#0d7a56'; border = '#36D399' }
                  else if (i === selected) { bg = '#FEF0EE'; color = '#c0392b'; border = '#F56751' }
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
            {revealed && (
              <button onClick={handleNext} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: '#FFC13D', color: '#1C1C2E' }}>
                {current < gameQ.length - 1 ? 'Suivant →' : 'Résultats →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const finalScore = Math.round((score / gameQ.length) * 100)
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1C1C2E' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">{finalScore >= 70 ? '⚡' : '😅'}</div>
        <div className="text-3xl font-black mb-1" style={{ color: '#FFC13D' }}>{finalScore}%</div>
        <div className="text-sm text-white/60 mb-2">{score}/{gameQ.length} · +{bonusXp} XP vitesse</div>
        {result && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {result.xp_earned > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(49,131,247,.15)' }}><span>⭐</span><span className="text-xs font-black text-blue-400">+{result.xp_earned} XP</span></div>}
            {result.cash_earned > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,193,61,.15)' }}><span>💰</span><span className="text-xs font-black" style={{ color: '#FFC13D' }}>+{result.cash_earned}</span></div>}
          </div>
        )}
        <Link
          href="/dashboard/quiz"
          className="flex items-center justify-center gap-1.5 text-xs mb-4 transition-colors"
          style={{ color: 'rgba(255,255,255,.4)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Quiz &amp; Évaluations
        </Link>
        <div className="flex gap-3">
          <button onClick={() => setPhase('config')} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)' }}>Reconfigurer</button>
          <button onClick={startGame} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#FFC13D', color: '#1C1C2E' }}>Rejouer ⚡</button>
        </div>
      </div>
    </div>
  )
}
