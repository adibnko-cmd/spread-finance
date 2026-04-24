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

export default async function QuizHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [{ data: quizzes }, sanityChapters] = await Promise.all([
    supabase.from('quiz_results').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }),
    getChaptersByDomain().catch(() => []),
  ])

  const results = quizzes ?? []
  const chapterTitleMap = new Map(
    ((sanityChapters ?? []) as Array<{ slug: string; title: string }>).map(c => [c.slug, c.title])
  )
  const total   = results.length
  const passed  = results.filter(q => q.passed).length
  const avgScore = total > 0
    ? Math.round(results.reduce((s, q) => s + q.score, 0) / total)
    : 0
  const bestScore = total > 0 ? Math.max(...results.map(q => q.score)) : 0

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-black text-gray-800">Mes quiz</div>
        <Link
          href="/documentation"
          className="text-xs font-bold text-white px-4 py-2 rounded-xl"
          style={{ background: '#3183F7' }}
        >
          Faire un quiz →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Quiz passés',   value: total,         color: '#292929' },
          { label: 'Réussis',       value: passed,        color: '#36D399' },
          { label: 'Score moyen',   value: `${avgScore}%`, color: '#FFC13D' },
          { label: 'Meilleur score',value: `${bestScore}%`, color: '#3183F7' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
          <span className="text-xs font-bold text-gray-800">Historique</span>
        </div>

        {results.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-2xl mb-3">📝</div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Aucun quiz passé</p>
            <p className="text-[10px] text-gray-400 mb-4">Lisez un chapitre et testez vos connaissances</p>
            <Link
              href="/documentation"
              className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl"
              style={{ background: '#3183F7' }}
            >
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
                  {/* Score badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${scoreColor}18`, color: scoreColor }}
                  >
                    {q.score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">
                      {chapterTitleMap.get(q.chapter_slug) ?? q.chapter_slug} — Niveau {q.quiz_level}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: domain?.color ?? '#888' }} />
                      <span className="text-[10px] text-gray-400">
                        {domain?.name ?? q.domain_slug}
                      </span>
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

                  {/* Résultat */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {q.correct_answers}/{q.total_questions} bonnes rép.
                    </span>
                    <span
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: q.passed ? '#E6FAF3' : '#FEF0EE',
                        color:      q.passed ? '#0d7a56' : '#c0392b',
                      }}
                    >
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
  )
}
