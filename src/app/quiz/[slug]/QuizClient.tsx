'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Answer   { text: string; isCorrect: boolean }
interface Question { text: string; explanation?: string; answers: Answer[] }
interface Quiz     { questions: Question[] }

interface Props {
  chapterSlug:  string
  chapterTitle: string
  domainSlug:   string
  quizLevel:    1 | 2 | 3
  quiz:         Quiz | null
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

const LEVEL_LABELS = ['', 'Niveau 1 — Facile', 'Niveau 2 — Intermédiaire', 'Niveau 3 — Avancé']

export default function QuizClient({ chapterSlug, chapterTitle, domainSlug, quizLevel, quiz }: Props) {
  const color     = DOMAIN_COLORS[domainSlug] ?? '#3183F7'
  const questions = quiz?.questions ?? []

  // ── État ──
  const [phase, setPhase]           = useState<'intro' | 'quiz' | 'results'>('intro')
  const [current, setCurrent]       = useState(0)
  const [selected, setSelected]     = useState<number | null>(null)
  const [revealed, setRevealed]     = useState(false)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [elapsed, setElapsed]       = useState(0)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<{ score: number; passed: boolean; xp_earned: number } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startQuiz = () => {
    setPhase('quiz')
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setUserAnswers([])
    setElapsed(0)
  }

  const selectAnswer = (idx: number) => {
    if (revealed) return
    setSelected(idx)
  }

  const confirmAnswer = () => {
    if (selected === null) return
    setRevealed(true)
  }

  const next = async () => {
    const newAnswers = [...userAnswers, selected]

    if (current + 1 < questions.length) {
      setUserAnswers(newAnswers)
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      // Fin — calculer + soumettre
      if (timerRef.current) clearInterval(timerRef.current)
      const correct = newAnswers.filter((ans, i) => ans !== null && questions[i].answers[ans!]?.isCorrect).length

      setLoading(true)
      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapter_slug:    chapterSlug,
            domain_slug:     domainSlug,
            quiz_level:      quizLevel,
            total_questions: questions.length,
            correct_answers: correct,
            time_seconds:    elapsed,
          }),
        })
        const data = await res.json()
        setResult({ score: data.score, passed: data.passed, xp_earned: data.xp_earned ?? 0 })
      } finally {
        setUserAnswers(newAnswers)
        setLoading(false)
        setPhase('results')
      }
    }
  }

  const q          = questions[current]
  const totalQ     = questions.length
  const correctCount = userAnswers.filter((ans, i) => ans !== null && questions[i].answers[ans!]?.isCorrect).length

  // ── Pas de quiz dans Sanity ──
  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F5F6F8' }}>
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-4">📝</div>
          <div className="text-sm font-black text-gray-800 mb-2">Quiz non disponible</div>
          <p className="text-xs text-gray-500 mb-6">
            Aucune question n&apos;a encore été ajoutée pour ce chapitre (niveau {quizLevel}).
          </p>
          <Link
            href={`/documentation/${chapterSlug}`}
            className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl"
            style={{ background: color }}
          >
            ← Retour au chapitre
          </Link>
        </div>
      </div>
    )
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F5F6F8' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ border: '1.5px solid #E8E8E8' }}>
          {/* Retour */}
          <Link href={`/documentation/${chapterSlug}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour au chapitre
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}18` }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5"/>
              <path d="M9 9.5c.3-1 1.2-1.5 2-1.5s2 .7 2 1.5c0 1.5-2 2-2 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="11" cy="15" r="1" fill={color}/>
            </svg>
          </div>

          <div className="text-lg font-black text-gray-900 mb-1 leading-snug">{chapterTitle}</div>
          <div className="text-xs text-gray-400 mb-5">{totalQ} questions</div>

          {/* Sélecteur de niveau */}
          <div className="flex gap-2 mb-6">
            {([
              { lvl: 1 as const, label: 'Facile' },
              { lvl: 2 as const, label: 'Moyen' },
              { lvl: 3 as const, label: 'Difficile' },
            ]).map(({ lvl, label }) => (
              <a
                key={lvl}
                href={`?level=${lvl}`}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all border"
                style={{
                  background: quizLevel === lvl ? color : 'transparent',
                  color: quizLevel === lvl ? '#fff' : '#9CA3AF',
                  borderColor: quizLevel === lvl ? color : '#E8E8E8',
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {[
              { icon: '⏱', text: 'Pas de limite de temps — prenez le temps de réfléchir' },
              { icon: '✅', text: 'Score ≥ 70% pour valider le chapitre et gagner des XP' },
              { icon: '📖', text: 'Une explication est affichée après chaque réponse' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="text-sm flex-shrink-0">{icon}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            Commencer le quiz →
          </button>
        </div>
      </div>
    )
  }

  // ── RÉSULTATS ──
  if (phase === 'results') {
    const passed    = result?.passed ?? false
    const score     = result?.score  ?? 0
    const xpEarned  = result?.xp_earned ?? 0
    const scoreColor = passed ? '#36D399' : score >= 50 ? '#FFC13D' : '#F56751'

    return (
      <div className="min-h-screen p-6" style={{ background: '#F5F6F8' }}>
        <div className="max-w-xl mx-auto">
          {/* Score card */}
          <div className="bg-white rounded-2xl p-8 mb-4 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-5xl font-black mb-1" style={{ color: scoreColor }}>{score}%</div>
            <div className="text-sm font-bold text-gray-700 mb-0.5">
              {passed ? '🎉 Quiz réussi !' : '😅 Pas encore...'}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {correctCount}/{totalQ} bonnes réponses · {formatTime(elapsed)}
            </div>

            {xpEarned > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4" style={{ background: '#1C1C2E' }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l2 5h5l-4 3 1.5 5L9 12.5 4.5 15 6 10 2 7h5z" fill="#FFC13D"/>
                </svg>
                <span className="text-xs font-bold text-white">+{xpEarned} XP gagnés</span>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8', color: '#555' }}
              >
                Réessayer
              </button>
              <Link
                href={`/documentation/${chapterSlug}`}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: color }}
              >
                Retour au chapitre
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8', color: '#555' }}
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Correction détaillée */}
          <div className="flex flex-col gap-3">
            {questions.map((question, qi) => {
              const userAns    = userAnswers[qi]
              const isCorrect  = userAns !== null && question.answers[userAns!]?.isCorrect
              const correctIdx = question.answers.findIndex(a => a.isCorrect)

              return (
                <div key={qi} className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: isCorrect ? '#E6FAF3' : '#FEF0EE' }}
                    >
                      {isCorrect
                        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#36D399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="#F56751" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      }
                    </div>
                    <div className="text-xs font-semibold text-gray-800">{question.text}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3 pl-7">
                    {question.answers.map((ans, ai) => {
                      const isUser    = ai === userAns
                      const isCorrectAns = ans.isCorrect
                      let bg = '#F9FAFB'
                      let border = '#E8E8E8'
                      let textColor = '#6B7280'
                      if (isCorrectAns) { bg = '#E6FAF3'; border = '#36D399'; textColor = '#0d7a56' }
                      else if (isUser && !isCorrectAns) { bg = '#FEF0EE'; border = '#F56751'; textColor = '#c0392b' }

                      return (
                        <div
                          key={ai}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}
                        >
                          {isCorrectAns && <span className="font-bold">✓</span>}
                          {isUser && !isCorrectAns && <span className="font-bold">✗</span>}
                          {!isCorrectAns && !isUser && <span className="opacity-0">·</span>}
                          <span className={isCorrectAns || (isUser && !isCorrectAns) ? 'font-semibold' : ''}>{ans.text}</span>
                        </div>
                      )
                    })}
                  </div>

                  {question.explanation && (
                    <div className="pl-7 text-[11px] text-gray-500 leading-relaxed p-2 rounded-lg" style={{ background: '#F5F6F8' }}>
                      💡 {question.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ EN COURS ──
  const pct = ((current) / totalQ) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      {/* Header */}
      <div className="bg-white border-b flex items-center px-6 h-14 gap-4" style={{ borderColor: '#E8E8E8' }}>
        <Link href={`/documentation/${chapterSlug}`} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 8H6M6 8l3-3M6 8l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Barre de progression */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>

        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
          {current + 1}/{totalQ}
        </span>
        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{formatTime(elapsed)}</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-lg">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color }}>
            Question {current + 1}
          </div>

          <div className="text-base font-bold text-gray-900 mb-6 leading-snug">
            {q.text}
          </div>

          {/* Réponses */}
          <div className="flex flex-col gap-2.5 mb-6">
            {q.answers.map((ans, ai) => {
              let bg      = '#fff'
              let border  = '#E8E8E8'
              let textCol = '#374151'

              if (revealed) {
                if (ans.isCorrect)              { bg = '#E6FAF3'; border = '#36D399'; textCol = '#0d7a56' }
                else if (ai === selected)        { bg = '#FEF0EE'; border = '#F56751'; textCol = '#c0392b' }
                else                             { bg = '#F9FAFB'; textCol = '#9CA3AF'; border = '#F0F0F0' }
              } else if (ai === selected) {
                bg = `${color}12`; border = color; textCol = '#111'
              }

              return (
                <button
                  key={ai}
                  onClick={() => selectAnswer(ai)}
                  disabled={revealed}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `1.5px solid ${border}`, color: textCol, cursor: revealed ? 'default' : 'pointer' }}
                >
                  <div
                    className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all"
                    style={{
                      borderColor: revealed && ans.isCorrect ? '#36D399' : revealed && ai === selected && !ans.isCorrect ? '#F56751' : ai === selected ? color : '#D1D5DB',
                      background:  revealed && ans.isCorrect ? '#36D399' : revealed && ai === selected && !ans.isCorrect ? '#F56751' : ai === selected ? color : 'transparent',
                      color: ai === selected || (revealed && ans.isCorrect) ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {String.fromCharCode(65 + ai)}
                  </div>
                  <span className="text-sm font-medium">{ans.text}</span>
                </button>
              )
            })}
          </div>

          {/* Explication */}
          {revealed && q.explanation && (
            <div className="p-4 rounded-xl mb-4 text-xs text-gray-600 leading-relaxed" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
              <span className="font-bold text-blue-700">Explication : </span>{q.explanation}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2">
            {!revealed ? (
              <button
                onClick={confirmAnswer}
                disabled={selected === null}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                style={{ background: selected !== null ? color : '#D1D5DB', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
              >
                Valider
              </button>
            ) : (
              <button
                onClick={next}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: color }}
              >
                {loading ? 'Enregistrement...' : current + 1 < totalQ ? 'Question suivante →' : 'Voir les résultats →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
