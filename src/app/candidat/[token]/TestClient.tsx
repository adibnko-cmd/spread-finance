'use client'

import { useState, useEffect, useCallback } from 'react'

interface Question {
  text:    string
  domain:  string
  answers: { text: string }[]
}

interface ResultDetail {
  question:    string
  selected:    number
  correct_idx: number
  is_correct:  boolean
  explanation: string
}

type Phase = 'intro' | 'playing' | 'done' | 'error'

const DOMAIN_COLOR: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

interface Props {
  token:       string
  title:       string
  description: string | null
  questions:   Question[]
  timeLimit:   number | null
}

export function TestClient({ token, title, description, questions, timeLimit }: Props) {
  const [phase,       setPhase]       = useState<Phase>('intro')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [current,     setCurrent]     = useState(0)
  const [answers,     setAnswers]     = useState<number[]>([])
  const [selected,    setSelected]    = useState<number | null>(null)
  const [startTime,   setStartTime]   = useState<number>(0)
  const [remaining,   setRemaining]   = useState<number | null>(timeLimit ? timeLimit * 60 : null)
  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState<{ score: number; correct: number; total: number; details: ResultDetail[] } | null>(null)
  const [errorMsg,    setErrorMsg]    = useState('')

  const submit = useCallback(async (finalAnswers: number[]) => {
    setSubmitting(true)
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    try {
      const res  = await fetch(`/api/quiz/test/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name:  name,
          candidate_email: email,
          answers:         finalAnswers,
          time_seconds:    elapsed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setResult(data)
      setPhase('done')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
      setPhase('error')
    } finally {
      setSubmitting(false)
    }
  }, [token, name, email, startTime])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing' || remaining === null) return
    if (remaining <= 0) { submit(answers); return }
    const id = setTimeout(() => setRemaining(r => (r ?? 0) - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, remaining, answers, submit])

  function startTest(e: React.FormEvent) {
    e.preventDefault()
    setStartTime(Date.now())
    setCurrent(0)
    setAnswers([])
    setSelected(null)
    setPhase('playing')
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
  }

  function handleNext() {
    const newAnswers = [...answers, selected ?? 0]
    setAnswers(newAnswers)
    if (current + 1 >= questions.length) {
      submit(newAnswers)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  function formatTimer(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  // ─── INTRO ────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F6F8' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#EBF2FF', color: '#3183F7' }}>
            Spread Finance — Test candidat
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">{title}</h1>
          {description && <p className="text-sm text-gray-500 leading-relaxed">{description}</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-around text-center mb-5">
            <div>
              <div className="text-2xl font-black text-gray-900">{questions.length}</div>
              <div className="text-[10px] text-gray-400">questions</div>
            </div>
            <div className="w-px h-8" style={{ background: '#E8E8E8' }} />
            <div>
              <div className="text-2xl font-black text-gray-900">{timeLimit ? `${timeLimit} min` : '∞'}</div>
              <div className="text-[10px] text-gray-400">durée</div>
            </div>
            <div className="w-px h-8" style={{ background: '#E8E8E8' }} />
            <div>
              <div className="text-2xl font-black" style={{ color: '#36D399' }}>70%</div>
              <div className="text-[10px] text-gray-400">seuil réussite</div>
            </div>
          </div>

          <form onSubmit={startTest} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prénom et nom *</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email *</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jean.dupont@email.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-black text-white mt-1 transition-opacity hover:opacity-90"
              style={{ background: '#1C1C2E' }}
            >
              Commencer le test →
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400">
          Vos résultats seront transmis à l&apos;entreprise. Aucun compte requis.
        </p>
      </div>
    </div>
  )

  // ─── PLAYING ──────────────────────────────────────────────────────────
  if (phase === 'playing' || submitting) {
    const q = questions[current]
    const progress = ((current) / questions.length) * 100

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F6F8' }}>
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-400 font-semibold">
              Question {current + 1} / {questions.length}
            </div>
            <div className="flex items-center gap-3">
              {remaining !== null && (
                <div
                  className="text-sm font-black px-3 py-1 rounded-full"
                  style={{ background: remaining < 60 ? '#FEF2F0' : '#F5F6F8', color: remaining < 60 ? '#F56751' : '#374151' }}
                >
                  ⏱ {formatTimer(remaining)}
                </div>
              )}
              <div className="text-[10px] text-gray-400">
                {Math.round(((current) / questions.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-gray-200 mb-5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#3183F7' }} />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            {q.domain && (
              <div className="mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${DOMAIN_COLOR[q.domain] ?? '#6B7280'}15`, color: DOMAIN_COLOR[q.domain] ?? '#6B7280' }}>
                  {q.domain}
                </span>
              </div>
            )}
            <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-5">{q.text}</p>

            <div className="flex flex-col gap-2">
              {q.answers.map((a, i) => {
                let bg = '#FAFAFA', color = '#374151', border = '#E8E8E8'
                if (selected !== null) {
                  if (i === selected) { bg = '#EBF2FF'; color = '#3183F7'; border = '#3183F7' }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all font-medium disabled:cursor-default"
                    style={{ background: bg, color, border: `1.5px solid ${border}` }}
                  >
                    <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span>
                    {a.text}
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="w-full mt-4 py-3 rounded-xl text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1C1C2E' }}
              >
                {submitting ? 'Envoi des résultats…' : current + 1 >= questions.length ? 'Terminer le test ✓' : 'Question suivante →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── DONE ─────────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const passed = result.score >= 70

    return (
      <div className="min-h-screen p-4" style={{ background: '#F5F6F8' }}>
        <div className="max-w-lg mx-auto pt-8">
          {/* Score */}
          <div className="bg-white rounded-2xl p-8 text-center mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-5xl mb-3">{passed ? '🎉' : '📚'}</div>
            <div className="text-5xl font-black mb-1"
              style={{ color: passed ? '#36D399' : '#F56751' }}>
              {result.score}%
            </div>
            <div className="text-sm font-bold text-gray-700 mb-1">
              {passed ? 'Félicitations !' : 'Dommage !'}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {result.correct} bonne{result.correct > 1 ? 's' : ''} réponse{result.correct > 1 ? 's' : ''} sur {result.total}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: passed ? '#E6FAF3' : '#FEF2F0', color: passed ? '#0d7a56' : '#dc2626' }}>
              {passed ? '✓ Test réussi' : '✗ Seuil non atteint (70%)'}
            </div>
          </div>

          {/* Correction détaillée */}
          <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Correction</div>
          <div className="flex flex-col gap-2">
            {result.details.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-4"
                style={{ border: `1.5px solid ${d.is_correct ? '#36D399' : '#F56751'}22` }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm flex-shrink-0">{d.is_correct ? '✅' : '❌'}</span>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{d.question}</p>
                </div>
                {!d.is_correct && (
                  <div className="ml-6">
                    <div className="text-[10px] text-gray-400 mb-0.5">Bonne réponse :</div>
                    <div className="text-xs font-semibold" style={{ color: '#36D399' }}>
                      {questions[i]?.answers[d.correct_idx]?.text ?? '—'}
                    </div>
                  </div>
                )}
                {d.explanation && (
                  <p className="ml-6 mt-1.5 text-[10px] text-gray-400 leading-relaxed">💡 {d.explanation}</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-4">
            Vos résultats ont été transmis à l&apos;entreprise.
          </p>
        </div>
      </div>
    )
  }

  // ─── ERROR ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F6F8' }}>
      <div className="text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <div className="text-sm font-bold text-gray-700 mb-1">Une erreur est survenue</div>
        <div className="text-xs text-gray-400">{errorMsg || 'Veuillez réessayer.'}</div>
      </div>
    </div>
  )
}
