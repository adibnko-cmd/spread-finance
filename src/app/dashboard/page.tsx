import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui'
import { getLevel } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Non connecté</div>

  // Récupérer toutes les données en parallèle
  const [profileRes, progressRes, quizRes, xpRes, activityRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('chapter_progress').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('quiz_results').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }).limit(5),
    supabase.from('xp_log').select('xp_earned').eq('user_id', user.id),
    supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
  ])

  const profile  = profileRes.data
  const progress = progressRes.data ?? []
  const quizzes  = quizRes.data ?? []
  const xpLogs   = xpRes.data ?? []
  const activity = activityRes.data ?? []

  const totalXp       = xpLogs.reduce((s, x) => s + x.xp_earned, 0)
  const { level, title: levelTitle, nextLevelXp, currentLevelXp } = getLevel(totalXp)
  const xpProgress    = ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  const chaptersValidated = progress.filter(p => p.status === 'validated').length
  const chaptersSeen      = progress.filter(p => p.status !== 'not_started').length
  const avgScore = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length)
    : 0

  // Progression par domaine
  const domains = ['finance', 'maths', 'dev', 'pm', 'ml']
  const domainColors: Record<string, string> = {
    finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
  }
  const domainNames: Record<string, string> = {
    finance: 'Finance de marché', maths: 'Maths financières',
    dev: 'Développement IT', pm: 'Gestion de projet', ml: 'Machine Learning',
  }
  const domainTotals: Record<string, number> = { finance: 8, maths: 6, dev: 7, pm: 5, ml: 6 }

  const domainProgress = domains.map(d => ({
    slug: d, name: domainNames[d], color: domainColors[d],
    total: domainTotals[d],
    validated: progress.filter(p => p.domain_slug === d && p.status === 'validated').length,
    seen: progress.filter(p => p.domain_slug === d && p.status !== 'not_started').length,
  }))

  // Derniers chapitres en cours
  const inProgress = progress.filter(p => p.status === 'in_progress' || p.status === 'completed').slice(0, 3)

  const isPremium  = profile?.plan === 'premium' || profile?.plan === 'platinum'
  const firstName  = profile?.first_name ?? 'vous'

  return (
    <div className="p-5">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-xl px-5 h-14" style={{ border: '1.5px solid #EBEBEB' }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Bonjour {firstName} 👋</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {chaptersSeen > 0
              ? `${chaptersValidated} chapitre${chaptersValidated > 1 ? 's' : ''} validé${chaptersValidated > 1 ? 's' : ''} · continuez votre progression`
              : 'Bienvenue — commencez votre premier chapitre'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">{firstName.substring(0, 1)}.{profile?.last_name?.substring(0, 1) ?? ''}.</span>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: isPremium ? '#EBF2FF' : '#f0f0f0', color: isPremium ? '#1a5fc8' : '#888' }}
          >
            {profile?.plan === 'premium' ? 'Premium' : profile?.plan === 'platinum' ? 'Platinum' : 'Free'}
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#3183F7' }}
          >
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
        </div>
      </div>

      {/* XP BAR */}
      <div className="rounded-xl p-4 mb-4 flex items-center gap-4" style={{ background: '#1C1C2E' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2l2 5h5l-4 3 1.5 5L9 12.5 4.5 15 6 10 2 7h5z" fill="#FFC13D"/>
        </svg>
        <span className="text-xs font-bold text-blue-400 whitespace-nowrap">Niveau {level} — {levelTitle}</span>
        <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, xpProgress)}%`, background: '#3183F7' }} />
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">{totalXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Chapitres vus',   value: chaptersSeen,        color: '#292929', delta: '' },
          { label: 'Acquis',          value: chaptersValidated,   color: '#36D399', delta: '✓' },
          { label: 'Score quiz moy.', value: `${avgScore}%`,      color: '#FFC13D', delta: '' },
          { label: 'XP total',        value: totalXp.toLocaleString(), color: '#A855F7', delta: '' },
        ].map(({ label, value, color, delta }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] font-semibold text-gray-500 mb-1.5">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}{delta && <span className="text-sm ml-1">{delta}</span>}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Reprendre */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-800">Reprendre</span>
            <Link href="/documentation" className="text-xs font-semibold" style={{ color: '#3183F7' }}>Voir tout →</Link>
          </div>
          {inProgress.length > 0 ? (
            <div className="flex flex-col gap-2">
              {inProgress.map(p => (
                <Link
                  key={p.chapter_slug}
                  href={`/documentation/${p.chapter_slug}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors hover:border-blue-300 hover:bg-blue-50"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domainColors[p.domain_slug] ?? '#888' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{p.chapter_slug}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{domainNames[p.domain_slug]}</div>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3183F7' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5 2l3 3-3 3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="text-xs text-gray-400 mb-3">Aucun chapitre en cours</div>
              <Link href="/documentation" className="text-xs font-bold text-white px-4 py-2 rounded-lg" style={{ background: '#3183F7' }}>
                Commencer →
              </Link>
            </div>
          )}
        </div>

        {/* Progression */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-800">Ma progression</span>
            {!isPremium && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f0f0f0', color: '#888' }}>Free</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {domainProgress.filter(d => d.seen > 0 || d.validated > 0).slice(0, 4).map(d => (
              <ProgressBar
                key={d.slug}
                value={d.total > 0 ? Math.round((d.validated / d.total) * 100) : 0}
                color={d.color}
                height={5}
                showLabel
                label={d.name}
              />
            ))}
            {domainProgress.filter(d => d.seen > 0).length === 0 && (
              <p className="text-xs text-gray-400 py-4 text-center">Commencez un chapitre pour voir votre progression</p>
            )}
          </div>
          {!isPremium && (
            <div className="mt-3 p-2.5 rounded-lg flex items-center justify-between" style={{ background: '#EBF2FF' }}>
              <span className="text-[10px] font-semibold" style={{ color: '#1a5fc8' }}>Débloquer l'analyse complète</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#3183F7' }}>Premium</span>
            </div>
          )}
        </div>
      </div>

      {/* QUIZ RÉCENTS */}
      <div className="bg-white rounded-xl p-4 mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-800">Évaluations récentes</span>
          <Link href="/dashboard/quiz" className="text-xs font-semibold" style={{ color: '#3183F7' }}>Voir tout →</Link>
        </div>
        {quizzes.length > 0 ? (
          <div className="flex flex-col">
            {quizzes.slice(0, 4).map(q => {
              const color = q.passed ? '#36D399' : q.score >= 50 ? '#FFC13D' : '#F56751'
              return (
                <div key={q.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      {q.passed
                        ? <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        : <path d="M3 3l6 6M9 3l-6 6" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
                      }
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{q.chapter_slug} — Quiz N{q.quiz_level}</div>
                    <div className="text-[10px] text-gray-400">{domainNames[q.domain_slug]} · {new Date(q.attempted_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <span className="text-sm font-black flex-shrink-0" style={{ color }}>{q.score}%</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">Aucun quiz passé pour l'instant</p>
        )}
      </div>

      {/* ACTIVITÉ RÉCENTE */}
      {activity.length > 0 && (
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-3">Activité récente</div>
          <div className="grid grid-cols-2 gap-x-6">
            {activity.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3183F7' }} />
                <span className="text-[11px] text-gray-600 flex-1 truncate">{a.target_title ?? a.action_type}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
