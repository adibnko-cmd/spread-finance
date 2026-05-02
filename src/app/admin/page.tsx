import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function AdminPage() {
  const supabase = adminClient()

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: platinumUsers },
    { count: enterpriseUsers },
    { data: recentUsers },
    { data: xpData },
    { data: quizData },
    { data: flagsData },
    { data: activityData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'platinum'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'enterprise'),
    supabase.from('profiles').select('id, first_name, last_name, plan, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('xp_log').select('xp_earned'),
    supabase.from('quiz_results').select('passed, score'),
    supabase.from('content_flags').select('flag_type'),
    supabase.from('activity_log').select('created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const totalXp         = (xpData ?? []).reduce((s, r) => s + r.xp_earned, 0)
  const totalQuizzes    = quizData?.length ?? 0
  const passedQuizzes   = (quizData ?? []).filter(q => q.passed).length
  const avgScore        = totalQuizzes > 0 ? Math.round((quizData ?? []).reduce((s, q) => s + q.score, 0) / totalQuizzes) : 0
  const freeUsers       = (totalUsers ?? 0) - (premiumUsers ?? 0) - (platinumUsers ?? 0) - (enterpriseUsers ?? 0)
  const activeThisWeek  = activityData?.length ?? 0

  const flagsByType: Record<string, number> = {}
  for (const f of flagsData ?? []) {
    flagsByType[f.flag_type] = (flagsByType[f.flag_type] ?? 0) + 1
  }

  const PLAN_COLORS = { free: '#9CA3AF', premium: '#3183F7', platinum: '#A855F7', enterprise: '#36D399' }

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Vue d&apos;ensemble</div>
        <div className="text-sm text-gray-500 mt-0.5">Tableau de bord administrateur — Spread Finance</div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Utilisateurs total',   value: totalUsers ?? 0,        color: '#1C1C2E' },
          { label: 'Membres Premium',      value: premiumUsers ?? 0,      color: '#3183F7' },
          { label: 'Membres Platinum',     value: platinumUsers ?? 0,     color: '#A855F7' },
          { label: 'Comptes Entreprise',   value: enterpriseUsers ?? 0,   color: '#36D399' },
          { label: 'Actifs cette semaine', value: activeThisWeek,         color: '#36D399' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[11px] font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-3xl font-black" style={{ color }}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Répartition plans */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-700 mb-3">Répartition des plans</div>
          {[
            { label: 'Freemium',   value: freeUsers,              plan: 'free'       },
            { label: 'Premium',    value: premiumUsers ?? 0,      plan: 'premium'    },
            { label: 'Platinum',   value: platinumUsers ?? 0,     plan: 'platinum'   },
            { label: 'Entreprise', value: enterpriseUsers ?? 0,   plan: 'enterprise' },
          ].map(({ label, value, plan }) => {
            const pct = totalUsers ? Math.round((value / totalUsers) * 100) : 0
            return (
              <div key={plan} className="mb-2">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-gray-600">{label}</span>
                  <span className="font-bold" style={{ color: PLAN_COLORS[plan as keyof typeof PLAN_COLORS] }}>{value} ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: '#F0F0F0', overflow: 'hidden' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLAN_COLORS[plan as keyof typeof PLAN_COLORS] }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats quiz */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-700 mb-3">Quiz & XP</div>
          {[
            { label: 'Total quiz passés',   value: totalQuizzes.toLocaleString(),      color: '#3183F7' },
            { label: 'Quiz réussis',        value: `${passedQuizzes} (${totalQuizzes ? Math.round(passedQuizzes / totalQuizzes * 100) : 0}%)`, color: '#36D399' },
            { label: 'Score moyen',         value: `${avgScore}%`,                     color: '#FFC13D' },
            { label: 'XP total distribué',  value: totalXp.toLocaleString(),           color: '#A855F7' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-[11px] text-gray-500">{label}</span>
              <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Content flags */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-700 mb-3">Contenus sauvegardés</div>
          {[
            { label: '❤️ Favoris',    key: 'favorite',   color: '#F56751' },
            { label: '🔖 À réviser', key: 'to_review',  color: '#FFC13D' },
            { label: '📄 À lire',    key: 'to_read',    color: '#3183F7' },
          ].map(({ label, key, color }) => (
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-[11px] text-gray-600">{label}</span>
              <span className="text-sm font-bold" style={{ color }}>{(flagsByType[key] ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Derniers inscrits */}
      <div className="bg-white rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-800">Derniers inscrits</div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['Nom', 'Plan', 'Inscrit le'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase px-5 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentUsers ?? []).map((u, i) => {
              const planColor = PLAN_COLORS[u.plan as keyof typeof PLAN_COLORS] ?? '#888'
              return (
                <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none' }}>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${planColor}20`, color: planColor }}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
