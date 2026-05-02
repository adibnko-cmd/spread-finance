import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getChaptersByDomain } from '@/lib/sanity/client'

export const dynamic = 'force-dynamic'

const DOMAIN_META: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

const LEVEL_LABELS: Record<number, string> = { 1: 'Niveau 1', 2: 'Niveau 2', 3: 'Niveau 3' }

export default async function QuizPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [{ data: quizzes }, { data: evals }, sanityChapters] = await Promise.all([
    supabase.from('quiz_results').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }),
    supabase.from('evaluation_results').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }),
    getChaptersByDomain().catch(() => []),
  ])

  const results   = quizzes ?? []
  const evalList  = evals   ?? []

  const chapterTitleMap = new Map(
    ((sanityChapters ?? []) as Array<{ slug: string; title: string }>).map(c => [c.slug, c.title])
  )

  const total    = results.length
  const passed   = results.filter(q => q.passed).length
  const avgScore = total > 0 ? Math.round(results.reduce((s, q) => s + q.score, 0) / total) : 0
  const bestScore = total > 0 ? Math.max(...results.map(q => q.score)) : 0

  const evalTotal  = evalList.length
  const evalPassed = evalList.filter(e => e.passed).length
  const evalAvg    = evalTotal > 0 ? Math.round(evalList.reduce((s, e) => s + e.score, 0) / evalTotal) : 0
  const evalBest   = evalTotal > 0 ? Math.max(...evalList.map(e => e.difficulty_level as number)) : 0

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  return (
    <div className="p-5 space-y-6">

      {/* ── MODES DE JEU ─────────────────────────────────────────────── */}
      <div>
        <div className="text-sm font-black text-gray-800 mb-4">Modes de jeu</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              href: '/quiz/training', label: 'Training libre', emoji: '🎯',
              desc: 'Questions aléatoires, toutes catégories. Facile → Difficile.',
              color: '#3183F7', bg: '#EBF2FF', premium: false,
            },
            {
              href: '/quiz/speed', label: 'Mode Speed', emoji: '⚡',
              desc: 'Chrono par question. Bonus XP si rapide.',
              color: '#FFC13D', bg: '#FFF8E6', premium: true,
            },
            {
              href: '/quiz/knockout', label: 'Mode Knockout', emoji: '💀',
              desc: 'Une mauvaise réponse = game over.',
              color: '#F56751', bg: '#FEF0EE', premium: true,
            },
            {
              href: '/quiz/competition', label: 'Compétition', emoji: '🏆',
              desc: 'Classement hebdomadaire — questions communes.',
              color: '#36D399', bg: '#E6FAF3', premium: false,
            },
          ].map(({ href, label, emoji, desc, color, bg, premium }) => {
            const locked = premium && !isPremium
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{emoji}</span>
                  {locked && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#EBF2FF', color: '#3183F7' }}>Premium</span>
                  )}
                </div>
                <div className="text-xs font-black" style={{ color }}>{label}</div>
                <div className="text-[10px] leading-relaxed" style={{ color: '#666' }}>{desc}</div>
              </>
            )
            const shared = {
              className: 'rounded-xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-md',
              style: { background: bg, border: `1.5px solid ${color}30`, opacity: locked ? 0.65 : 1, textDecoration: 'none' },
            }
            return locked
              ? <div key={label} {...shared} style={{ ...shared.style, cursor: 'not-allowed' }}>{inner}</div>
              : <Link key={label} href={href} {...shared}>{inner}</Link>
          })}
        </div>
      </div>

      {/* ── QUIZ ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-black text-gray-800">Quiz chapitres</div>
          <Link href="/documentation" className="text-xs font-bold text-white px-4 py-2 rounded-xl" style={{ background: '#3183F7' }}>
            Faire un quiz →
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Quiz passés',    value: total,          color: '#292929' },
            { label: 'Réussis',        value: passed,         color: '#36D399' },
            { label: 'Score moyen',    value: `${avgScore}%`, color: '#FFC13D' },
            { label: 'Meilleur score', value: `${bestScore}%`, color: '#3183F7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="text-[10px] font-semibold text-gray-500 mb-1">{label}</div>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <span className="text-xs font-bold text-gray-800">Historique</span>
          </div>

          {results.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Aucun quiz passé</p>
              <p className="text-[10px] text-gray-400 mb-4">Lisez un chapitre et testez vos connaissances</p>
              <Link href="/documentation" className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl" style={{ background: '#3183F7' }}>
                Voir la documentation →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {results.map(q => {
                const scoreColor = q.passed ? '#36D399' : q.score >= 50 ? '#FFC13D' : '#F56751'
                const domain     = DOMAIN_META[q.domain_slug]
                return (
                  <div key={q.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: `${scoreColor}18`, color: scoreColor }}>
                      {q.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">
                        {chapterTitleMap.get(q.chapter_slug) ?? q.chapter_slug} — Niveau {q.quiz_level}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: domain?.color ?? '#888' }} />
                        <span className="text-[10px] text-gray-400">{domain?.name ?? q.domain_slug}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(q.attempted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {q.time_seconds && (
                          <>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{Math.round(q.time_seconds / 60)} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">{q.correct_answers}/{q.total_questions} bonnes rép.</span>
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ background: q.passed ? '#E6FAF3' : '#FEF0EE', color: q.passed ? '#0d7a56' : '#c0392b' }}>
                        {q.passed ? 'Réussi' : 'Échoué'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ÉVALUATIONS ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-black text-gray-800">Évaluations QCM</div>
          <Link href="/dashboard/roadmap" className="text-xs font-bold text-white px-4 py-2 rounded-xl" style={{ background: '#1C1C2E' }}>
            Road Map →
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Évals passées',  value: evalTotal,                      color: '#292929' },
            { label: 'Réussies',       value: evalPassed,                     color: '#36D399' },
            { label: 'Score moyen',    value: evalTotal > 0 ? `${evalAvg}%` : '—', color: '#FFC13D' },
            { label: 'Niveau max atteint', value: evalBest > 0 ? `Niv. ${evalBest}` : '—', color: '#A855F7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="text-[10px] font-semibold text-gray-500 mb-1">{label}</div>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <span className="text-xs font-bold text-gray-800">Historique</span>
          </div>

          {evalList.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Aucune évaluation passée</p>
              <p className="text-[10px] text-gray-400 mb-4">Terminez une partie pour débloquer l&apos;évaluation</p>
              <Link href="/dashboard/roadmap" className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl" style={{ background: '#3183F7' }}>
                Voir la Road Map →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {evalList.map(e => {
                const scoreColor = e.passed ? '#36D399' : e.score >= 50 ? '#FFC13D' : '#F56751'
                const domain     = DOMAIN_META[e.domain_slug]
                const stars      = e.passed ? (e.difficulty_level as number) : 0
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: `${scoreColor}18`, color: scoreColor }}>
                      {e.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">
                        {e.part_title ?? `Partie ${e.part}`} — {LEVEL_LABELS[e.difficulty_level as number] ?? `Niveau ${e.difficulty_level}`}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: domain?.color ?? '#888' }} />
                        <span className="text-[10px] text-gray-400">{domain?.name ?? e.domain_slug}</span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(e.attempted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {([1, 2, 3] as const).map(i => (
                          <svg key={i} width="12" height="12" viewBox="0 0 12 12">
                            <path d="M6 1l1.3 3h3.2l-2.6 1.9.9 3L6 7.4 3.2 8.9l.9-3L1.5 4h3.2z" fill={i <= stars ? '#FFC13D' : '#E2E8F0'} />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ background: e.passed ? '#E6FAF3' : '#FEF0EE', color: e.passed ? '#0d7a56' : '#c0392b' }}>
                        {e.passed ? 'Réussi' : 'Échoué'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
