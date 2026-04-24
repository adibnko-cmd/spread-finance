import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsCharts } from './AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/analytics')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  // Charger les données pour les graphiques
  const [xpRes, quizRes, progressRes, activityRes] = await Promise.all([
    supabase.from('xp_log').select('xp_earned, earned_at, source_type').eq('user_id', user.id).order('earned_at', { ascending: true }),
    supabase.from('quiz_results').select('score, passed, quiz_level, domain_slug, attempted_at').eq('user_id', user.id).order('attempted_at', { ascending: false }).limit(20),
    supabase.from('chapter_progress').select('domain_slug, status, time_spent_seconds').eq('user_id', user.id),
    supabase.from('activity_log').select('created_at, action_type').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('created_at', { ascending: true }),
  ])

  const xpLogs   = xpRes.data ?? []
  const quizzes  = quizRes.data ?? []
  const progress = progressRes.data ?? []
  const activity = activityRes.data ?? []

  const totalXp         = xpLogs.reduce((s, x) => s + x.xp_earned, 0)
  const totalQuizzes    = quizzes.length
  const passedQuizzes   = quizzes.filter(q => q.passed).length
  const avgScore        = totalQuizzes > 0 ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / totalQuizzes) : 0
  const chaptersValidated = progress.filter(p => p.status === 'validated').length

  // XP par jour (30 derniers jours)
  const xpByDay: Record<string, number> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    xpByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const log of xpLogs) {
    const day = new Date(log.earned_at).toISOString().slice(0, 10)
    if (day in xpByDay) xpByDay[day] += log.xp_earned
  }
  const xpChartData = Object.entries(xpByDay).map(([date, xp]) => ({
    date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    xp,
  }))

  // Scores quiz (10 derniers)
  const quizChartData = quizzes.slice(0, 10).reverse().map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: q.score,
    passed: q.passed,
    level: q.quiz_level,
  }))

  // Progression par domaine
  const DOMAIN_TOTALS: Record<string, number> = { finance: 8, maths: 6, dev: 7, pm: 5, ml: 6 }
  const DOMAIN_NAMES: Record<string, string> = {
    finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Projet', ml: 'ML / IA',
  }
  const DOMAIN_COLORS: Record<string, string> = {
    finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
  }

  const domainChartData = Object.entries(DOMAIN_TOTALS).map(([slug, total]) => ({
    name: DOMAIN_NAMES[slug],
    color: DOMAIN_COLORS[slug],
    validated: progress.filter(p => p.domain_slug === slug && p.status === 'validated').length,
    seen: progress.filter(p => p.domain_slug === slug && p.status !== 'not_started').length,
    total,
    timeHours: Math.round(
      progress.filter(p => p.domain_slug === slug).reduce((s, p) => s + (p.time_spent_seconds ?? 0), 0) / 3600 * 10
    ) / 10,
  }))

  // Activité par jour (heatmap simplifiée)
  const activityByDay: Record<string, number> = {}
  for (const a of activity) {
    const day = new Date(a.created_at).toISOString().slice(0, 10)
    activityByDay[day] = (activityByDay[day] ?? 0) + 1
  }

  return (
    <div className="p-5 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-black text-gray-800">Analytics</div>
          <div className="text-xs text-gray-400 mt-0.5">Votre progression en détail — 30 derniers jours</div>
        </div>
        {!isPremium && (
          <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#f0f0f0', color: '#888' }}>
            Données complètes réservées Premium
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'XP total',          value: totalXp.toLocaleString(),  color: '#A855F7', suffix: ' XP' },
          { label: 'Quiz passés',        value: totalQuizzes,              color: '#3183F7', suffix: '' },
          { label: 'Taux de réussite',   value: `${totalQuizzes > 0 ? Math.round(passedQuizzes / totalQuizzes * 100) : 0}%`, color: '#36D399', suffix: '' },
          { label: 'Chapitres validés',  value: chaptersValidated,         color: '#FFC13D', suffix: '' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Graphiques (client component) */}
      <AnalyticsCharts
        xpChartData={xpChartData}
        quizChartData={quizChartData}
        domainChartData={domainChartData}
        avgScore={avgScore}
      />
    </div>
  )
}
