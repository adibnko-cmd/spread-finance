'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Answer   { text: string; isCorrect: boolean }
interface Question { _key?: string; text: string; competency?: string; explanation?: string; answers: Answer[] }
interface Evaluation {
  _id: string; domain: string; part: number; partTitle: string; level: number
  questions: Question[]
}

interface Props {
  domain:     string
  domainName: string
  part:       number
  level:      1 | 2 | 3
  evaluation: Evaluation | null
  isPremium:  boolean
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

const LEVEL_META = {
  1: { label: 'Facile',    color: '#36D399', bg: '#E6FAF3' },
  2: { label: 'Moyen',     color: '#FFC13D', bg: '#FFFBEB' },
  3: { label: 'Difficile', color: '#F56751', bg: '#FFF5F3' },
}

export default function EvaluationClient({ domain, domainName, part, level, evaluation, isPremium }: Props) {
  const color     = DOMAIN_COLORS[domain] ?? '#3183F7'
  const lvlMeta   = LEVEL_META[level]
  const questions = evaluation?.questions ?? []

  const [phase, setPhase]       = useState<'intro' | 'quiz' | 'results'>('intro')
  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [elapsed, setElapsed]   = useState(0)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ score: number; passed: boolean; xp_earned: number } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase !== 'quiz') return
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startEval = () => {
    setPhase('quiz'); setCurrent(0); setSelected(null)
    setRevealed(false); setUserAnswers([]); setElapsed(0)
  }

  const confirmAnswer = () => { if (selected !== null) setRevealed(true) }

  const next = async () => {
    const newAnswers = [...userAnswers, selected]

    if (current + 1 < questions.length) {
      setUserAnswers(newAnswers); setCurrent(c => c + 1)
      setSelected(null); setRevealed(false)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      const correct = newAnswers.filter(
        (ans, i) => ans !== null && questions[i].answers[ans!]?.isCorrect
      ).length

      setLoading(true)
      try {
        const res = await fetch('/api/evaluation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_slug:      domain,
            part,
            part_title:       evaluation?.partTitle,
            difficulty_level: level,
            total_questions:  questions.length,
            correct_answers:  correct,
            time_seconds:     elapsed,
            answers:          newAnswers,
          }),
        })
        const data = await res.json()
        setResult({ score: data.score ?? 0, passed: data.passed ?? false, xp_earned: data.xp_earned ?? 0 })
      } finally {
        setUserAnswers(newAnswers); setLoading(false); setPhase('results')
      }
    }
  }

  const q          = questions[current]
  const totalQ     = questions.length
  const pct        = phase === 'quiz' ? (current / totalQ) * 100 : 0

  // ── Pas de contenu dans Sanity ──
  if (!evaluation || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F5F6F8' }}>
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-4">📋</div>
          <div className="text-sm font-black text-gray-800 mb-2">Évaluation non disponible</div>
          <p className="text-xs text-gray-500 mb-2">
            L&apos;évaluation de la Partie {part} (niveau {lvlMeta.label}) n&apos;a pas encore été créée.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Ajoutez les questions dans <strong>Sanity Studio</strong> (type : Évaluation de partie).
          </p>
          <Link
            href={`/documentation?domain=${domain}`}
            className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl"
            style={{ background: color }}
          >
            ← Retour à {domainName}
          </Link>
        </div>
      </div>
    )
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F5F6F8' }}>
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full" style={{ border: '1.5px solid #E8E8E8' }}>
          <Link
            href={`/documentation?domain=${domain}`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour à {domainName}
          </Link>

          {/* Badge domaine */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}15`, color }}>
              {domainName}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: lvlMeta.bg, color: lvlMeta.color }}>
              {lvlMeta.label}
            </span>
          </div>

          <div className="text-xl font-black text-gray-900 mb-1">
            Évaluation — Partie {part}
          </div>
          <div className="text-sm text-gray-500 mb-5">{evaluation.partTitle}</div>

          {/* Sélecteur de niveau */}
          <div className="flex gap-2 mb-6">
            {([1, 2, 3] as const).map(lvl => {
              const m = LEVEL_META[lvl]
              const isActive = level === lvl
              const locked   = lvl === 3 && !isPremium
              return (
                <a
                  key={lvl}
                  href={locked ? '#' : `/evaluation/${domain}/${part}/${lvl}`}
                  onClick={locked ? e => e.preventDefault() : undefined}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center transition-all border relative"
                  style={{
                    background:   isActive ? m.color : 'transparent',
                    color:        isActive ? '#fff' : locked ? '#ccc' : m.color,
                    borderColor:  isActive ? m.color : locked ? '#E8E8E8' : `${m.color}50`,
                    cursor:       locked ? 'not-allowed' : 'pointer',
                  }}
                  title={locked ? 'Niveau Difficile réservé aux membres Premium' : undefined}
                >
                  {m.label}
                  {locked && (
                    <span className="absolute -top-2 -right-1 text-[8px] font-bold px-1.5 py-px rounded-full bg-blue-100 text-blue-600">Pro</span>
                  )}
                </a>
              )
            })}
          </div>

          {/* Infos */}
          <div className="flex flex-col gap-2 mb-6 p-4 rounded-xl" style={{ background: '#F8F9FA' }}>
            {[
              { icon: '📊', text: `${totalQ} questions couvrant tous les chapitres de la partie` },
              { icon: '✅', text: 'Score ≥ 70% pour valider et gagner des XP' },
              { icon: isPremium ? '📖' : '🔒', text: isPremium ? 'Correction complète avec explications à la fin' : 'Correction détaillée réservée aux membres Premium' },
              { icon: '⏱', text: 'Pas de limite de temps — évaluation complète' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="flex-shrink-0">{icon}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {!isPremium && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
              <span className="text-sm">💡</span>
              <div>
                <div className="text-[11px] font-bold text-blue-700">Premium — Correction complète</div>
                <div className="text-[10px] text-blue-500">Les membres Premium voient les explications par question et le détail par compétence.</div>
              </div>
            </div>
          )}

          <button
            onClick={startEval}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            Commencer l&apos;évaluation ({totalQ} questions) →
          </button>
        </div>
      </div>
    )
  }

  // ── RÉSULTATS ──
  if (phase === 'results') {
    const passed     = result?.passed ?? false
    const score      = result?.score  ?? 0
    const xpEarned   = result?.xp_earned ?? 0
    const scoreColor = passed ? '#36D399' : score >= 50 ? '#FFC13D' : '#F56751'

    // Calcul par compétence
    const competencyMap = new Map<string, { correct: number; total: number }>()
    questions.forEach((q, i) => {
      const comp = q.competency ?? 'Général'
      const entry = competencyMap.get(comp) ?? { correct: 0, total: 0 }
      entry.total++
      if (userAnswers[i] !== null && userAnswers[i] !== undefined && q.answers[userAnswers[i]!]?.isCorrect) {
        entry.correct++
      }
      competencyMap.set(comp, entry)
    })

    const correctCount = userAnswers.filter(
      (ans, i) => ans !== null && questions[i].answers[ans!]?.isCorrect
    ).length

    return (
      <div className="min-h-screen p-6" style={{ background: '#F5F6F8' }}>
        <div className="max-w-2xl mx-auto">

          {/* Score card */}
          <div className="bg-white rounded-2xl p-8 mb-4 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color }}>
              Évaluation · Partie {part} — {evaluation.partTitle}
            </div>
            <div className="text-6xl font-black mb-1" style={{ color: scoreColor }}>{score}%</div>
            <div className="text-sm font-bold text-gray-700 mb-1">
              {passed ? '🎉 Évaluation réussie !' : score >= 50 ? '😅 Presque ! Encore un effort.' : '📚 À retravailler'}
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

            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={startEval}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8', color: '#555' }}
              >
                Réessayer
              </button>
              <Link
                href={`/documentation?domain=${domain}`}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: color }}
              >
                ← {domainName}
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-xs font-bold border"
                style={{ border: '1.5px solid #E8E8E8', color: '#555' }}
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Compétences */}
          {competencyMap.size > 1 && (
            <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="text-xs font-bold text-gray-800 mb-3">Résultats par compétence</div>
              <div className="flex flex-col gap-3">
                {Array.from(competencyMap.entries()).map(([comp, { correct, total }]) => {
                  const pctComp = Math.round((correct / total) * 100)
                  const compColor = pctComp >= 70 ? '#36D399' : pctComp >= 50 ? '#FFC13D' : '#F56751'
                  return (
                    <div key={comp}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{comp}</span>
                        <span className="text-xs font-bold" style={{ color: compColor }}>
                          {correct}/{total} ({pctComp}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
                        <div className="h-full rounded-full" style={{ width: `${pctComp}%`, background: compColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Correction détaillée — Premium uniquement */}
          {isPremium ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Correction complète
              </div>
              {questions.map((question, qi) => {
                const userAns   = userAnswers[qi]
                const isCorrect = userAns !== null && userAns !== undefined && question.answers[userAns]?.isCorrect

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
                      <div>
                        {question.competency && (
                          <div className="text-[10px] font-bold mb-0.5" style={{ color }}>{question.competency}</div>
                        )}
                        <div className="text-xs font-semibold text-gray-800 leading-snug">{question.text}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-3 pl-7">
                      {question.answers.map((ans, ai) => {
                        const isUser = ai === userAns
                        let bg = '#F9FAFB', border = '#E8E8E8', textColor = '#6B7280'
                        if (ans.isCorrect) { bg = '#E6FAF3'; border = '#36D399'; textColor = '#0d7a56' }
                        else if (isUser)   { bg = '#FEF0EE'; border = '#F56751'; textColor = '#c0392b' }
                        return (
                          <div key={ai} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                            style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}
                          >
                            {ans.isCorrect && <span className="font-bold flex-shrink-0">✓</span>}
                            {isUser && !ans.isCorrect && <span className="font-bold flex-shrink-0">✗</span>}
                            {!ans.isCorrect && !isUser && <span className="opacity-0 flex-shrink-0">·</span>}
                            <span className={ans.isCorrect || isUser ? 'font-semibold' : ''}>{ans.text}</span>
                          </div>
                        )
                      })}
                    </div>

                    {question.explanation && (
                      <div className="pl-7 text-[11px] text-gray-600 leading-relaxed p-3 rounded-lg" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
                        <span className="font-bold text-blue-700">Explication : </span>
                        {question.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="text-2xl mb-3">🔒</div>
              <div className="text-sm font-black text-gray-800 mb-2">Correction complète — Premium</div>
              <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
                Les membres Premium accèdent à la correction détaillée de chaque question avec explications et bonne réponse mise en évidence.
              </p>
              <Link
                href="/#pricing"
                className="inline-block text-xs font-bold text-white px-6 py-2.5 rounded-xl"
                style={{ background: '#3183F7' }}
              >
                Passer Premium →
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── QUIZ EN COURS ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      {/* Header */}
      <div className="bg-white border-b flex items-center px-6 h-14 gap-4" style={{ borderColor: '#E8E8E8' }}>
        <button
          onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('intro') }}
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          title="Quitter l'évaluation"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 8H6M6 8l3-3M6 8l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
        </div>

        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{current + 1}/{totalQ}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: lvlMeta.bg, color: lvlMeta.color }}
        >
          {lvlMeta.label}
        </span>
        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{formatTime(elapsed)}</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-xl">
          {q.competency && (
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
              {q.competency}
            </div>
          )}
          <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">
            Question {current + 1} sur {totalQ}
          </div>
          <div className="text-base font-bold text-gray-900 mb-6 leading-snug">{q.text}</div>

          {/* Réponses */}
          <div className="flex flex-col gap-2.5 mb-6">
            {q.answers.map((ans, ai) => {
              let bg = '#fff', border = '#E8E8E8', textCol = '#374151'
              if (revealed) {
                if (ans.isCorrect)      { bg = '#E6FAF3'; border = '#36D399'; textCol = '#0d7a56' }
                else if (ai === selected) { bg = '#FEF0EE'; border = '#F56751'; textCol = '#c0392b' }
                else                      { bg = '#F9FAFB'; textCol = '#9CA3AF'; border = '#F0F0F0' }
              } else if (ai === selected) {
                bg = `${color}12`; border = color; textCol = '#111'
              }

              return (
                <button
                  key={ai}
                  onClick={() => { if (!revealed) setSelected(ai) }}
                  disabled={revealed}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `1.5px solid ${border}`, color: textCol, cursor: revealed ? 'default' : 'pointer' }}
                >
                  <div
                    className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{
                      borderColor: revealed && ans.isCorrect ? '#36D399' : revealed && ai === selected && !ans.isCorrect ? '#F56751' : ai === selected ? color : '#D1D5DB',
                      background:  revealed && ans.isCorrect ? '#36D399' : revealed && ai === selected && !ans.isCorrect ? '#F56751' : ai === selected ? color : 'transparent',
                      color:       ai === selected || (revealed && ans.isCorrect) ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {String.fromCharCode(65 + ai)}
                  </div>
                  <span className="text-sm font-medium">{ans.text}</span>
                </button>
              )
            })}
          </div>

          {/* Feedback révélé — sans explication (réservée aux résultats Premium) */}
          {revealed && (
            <div
              className="p-3 rounded-xl mb-4 text-xs font-semibold"
              style={{
                background: userAnswers.length < questions.length && questions[current]?.answers[selected ?? -1]?.isCorrect ? '#E6FAF3' : '#FEF0EE',
                color:      questions[current]?.answers[selected ?? -1]?.isCorrect ? '#0d7a56' : '#c0392b',
              }}
            >
              {questions[current]?.answers[selected ?? -1]?.isCorrect ? '✓ Bonne réponse !' : '✗ Mauvaise réponse'}
            </div>
          )}

          {/* Bouton */}
          {!revealed ? (
            <button
              onClick={confirmAnswer}
              disabled={selected === null}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: selected !== null ? color : '#D1D5DB', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
            >
              Valider
            </button>
          ) : (
            <button
              onClick={next}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: color }}
            >
              {loading ? 'Enregistrement...' : current + 1 < totalQ ? 'Question suivante →' : 'Voir les résultats →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
