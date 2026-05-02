'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Question {
  _key: string; text: string; explanation: string
  answers: { text: string; isCorrect: boolean }[]
}

interface LeaderboardEntry {
  rank: number; name: string; isMe: boolean
  score: number; correct: number; total: number; time: number | null
}

interface MyResult {
  score: number; correct_answers: number; total_questions: number
  time_seconds: number | null; attempted_at: string
}

interface Props {
  weekId: string
  questions: Question[]
  myResult: MyResult | null
  leaderboard: LeaderboardEntry[]
}

type Phase = 'lobby' | 'playing' | 'done'

export function CompetitionClient({ weekId, questions, myResult, leaderboard }: Props) {
  const [phase,    setPhase]    = useState<Phase>(myResult ? 'done' : 'lobby')
  const [current,  setCurrent]  = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState(0)
  const [elapsed,  setElapsed]  = useState(0)
  const [result,   setResult]   = useState<MyResult | null>(myResult)
  const [board,    setBoard]    = useState<LeaderboardEntry[]>(leaderboard)
  const startTime = useRef<number>(0)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function startGame() {
    setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setElapsed(0)
    startTime.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    setPhase('playing')
  }

  function handleAnswer(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (questions[current].answers[idx]?.isCorrect) setScore(s => s + 1)
  }

  async function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1); setSelected(null); setRevealed(false)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      const timeSec = Math.floor((Date.now() - startTime.current) / 1000)
      const finalScore = current + 1 === questions.length
        ? Math.round(((score + (questions[current].answers[selected!]?.isCorrect ? 1 : 0)) / questions.length) * 100)
        : Math.round((score / questions.length) * 100)

      try {
        await fetch('/api/quiz/competition', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ week_id: weekId, total_questions: questions.length, correct_answers: score, time_seconds: timeSec }),
        })
        setResult({ score: finalScore, correct_answers: score, total_questions: questions.length, time_seconds: timeSec, attempted_at: new Date().toISOString() })
      } catch {}
      setPhase('done')
    }
  }

  const formatTime = (s: number | null) => s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Lobby ────────────────────────────────────────────────────────
  if (phase === 'lobby') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
      <div className="w-full max-w-2xl">
        <Link href="/dashboard/quiz" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <div className="grid grid-cols-2 gap-4">
          {/* Info */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="text-base font-black text-gray-800">Compétition semaine</div>
                <div className="text-[10px] font-mono text-gray-400">{weekId}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-5 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="font-bold text-gray-800">{questions.length}</span> questions communes</div>
              <div className="flex items-center gap-2"><span className="font-bold text-gray-800">1 seule</span> tentative par semaine</div>
              <div className="flex items-center gap-2"><span className="font-bold text-gray-800">+25</span> 💰 si score ≥ 50%</div>
            </div>
            <button onClick={startGame} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#36D399' }}>
              Participer →
            </button>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xs font-bold text-gray-800 mb-3">Classement actuel</div>
            {board.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">Aucun participant encore cette semaine.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {board.map(e => (
                  <div key={e.rank} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: e.isMe ? '#EBF2FF' : 'transparent' }}>
                    <span className="text-[10px] font-black w-5 text-right" style={{ color: e.rank <= 3 ? ['#FFC13D', '#C0C0C0', '#CD7F32'][e.rank - 1] : '#aaa' }}>
                      {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : e.rank}
                    </span>
                    <span className="flex-1 text-[11px] font-semibold truncate" style={{ color: e.isMe ? '#1a5fc8' : '#374151' }}>{e.name}</span>
                    <span className="text-[11px] font-black" style={{ color: e.score >= 70 ? '#36D399' : '#FFC13D' }}>{e.score}%</span>
                    <span className="text-[9px] text-gray-400">{formatTime(e.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Playing ──────────────────────────────────────────────────────
  if (phase === 'playing') {
    const q = questions[current]
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E8E8E8' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%`, background: '#36D399' }} />
            </div>
            <span className="text-xs font-bold text-gray-500">{current + 1}/{questions.length}</span>
            <span className="text-xs text-gray-400">{formatTime(elapsed)}</span>
          </div>
          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-5">{q.text}</p>
            <div className="flex flex-col gap-2 mb-4">
              {q.answers.map((a, i) => {
                let bg = '#F5F5F5', color = '#333', border = 'transparent'
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
            {revealed && q.explanation && <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>💡 {q.explanation}</div>}
            {revealed && <button onClick={handleNext} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#1C1C2E' }}>{current < questions.length - 1 ? 'Suivant →' : 'Terminer →'}</button>}
          </div>
        </div>
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────
  const r = result!
  const passed = r.score >= 50
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F6F8' }}>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-4xl mb-3">{passed ? '🏆' : '📝'}</div>
            <div className="text-3xl font-black mb-1" style={{ color: passed ? '#36D399' : '#FFC13D' }}>{r.score}%</div>
            <div className="text-xs text-gray-400 mb-4">{r.correct_answers}/{r.total_questions} · {formatTime(r.time_seconds)}</div>
            {passed && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: '#FFF8E6' }}>
                  <span>💰</span><span className="text-xs font-black" style={{ color: '#b37700' }}>+20</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: '#EBF2FF' }}>
                  <span>⭐</span><span className="text-xs font-black text-blue-700">+25 XP</span>
                </div>
              </div>
            )}
            <Link href="/dashboard/quiz" className="block w-full py-2.5 rounded-xl text-xs font-bold text-white text-center" style={{ background: '#1C1C2E' }}>
              Retour au dashboard
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xs font-bold text-gray-800 mb-3">Classement final</div>
            {board.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">Actualisez la page pour voir le classement.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {board.map(e => (
                  <div key={e.rank} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: e.isMe ? '#EBF2FF' : 'transparent' }}>
                    <span className="text-[10px] font-black w-5 text-right" style={{ color: e.rank <= 3 ? ['#FFC13D', '#C0C0C0', '#CD7F32'][e.rank - 1] : '#aaa' }}>
                      {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : e.rank}
                    </span>
                    <span className="flex-1 text-[11px] font-semibold truncate" style={{ color: e.isMe ? '#1a5fc8' : '#374151' }}>{e.name}</span>
                    <span className="text-[11px] font-black" style={{ color: e.score >= 70 ? '#36D399' : '#FFC13D' }}>{e.score}%</span>
                    <span className="text-[9px] text-gray-400">{formatTime(e.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
