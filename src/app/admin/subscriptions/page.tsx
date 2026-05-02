import { adminClient } from '@/lib/supabase/admin-server'

export const dynamic = 'force-dynamic'

const PRICES = { free: 0, premium: 19, platinum: 29 }

export default async function AdminSubscriptionsPage() {
  const db = adminClient()

  const [
    { data: profiles },
    { data: planChanges },
    { data: recentSignups },
  ] = await Promise.all([
    db.from('profiles').select('plan, created_at'),
    db.from('activity_log')
      .select('user_id, metadata, created_at')
      .eq('action_type', 'subscription_changed')
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('profiles')
      .select('id, first_name, last_name, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const all = profiles ?? []
  const byPlan = {
    free:     all.filter(p => p.plan === 'free').length,
    premium:  all.filter(p => p.plan === 'premium').length,
    platinum: all.filter(p => p.plan === 'platinum').length,
  }
  const mrr = byPlan.premium * PRICES.premium + byPlan.platinum * PRICES.platinum
  const arr = mrr * 12

  // Growth: signups per week (last 8 weeks)
  const now = Date.now()
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now - (7 - i) * 7 * 86400000)
    const weekEnd   = new Date(now - (6 - i) * 7 * 86400000)
    return {
      label: weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      count: all.filter(p => {
        const d = new Date(p.created_at)
        return d >= weekStart && d < weekEnd
      }).length,
    }
  })
  const maxWeek = Math.max(...weeks.map(w => w.count), 1)

  const PLAN_COLORS = { free: '#9CA3AF', premium: '#3183F7', platinum: '#A855F7' }

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Abonnements</div>
        <div className="text-sm text-gray-500 mt-0.5">Revenus et évolution des plans</div>
      </div>

      {/* MRR / ARR */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">MRR estimé</div>
          <div className="text-3xl font-black text-gray-900">{mrr.toLocaleString('fr-FR')} €</div>
          <div className="text-[11px] text-gray-400 mt-1">mensuel récurrent</div>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">ARR estimé</div>
          <div className="text-3xl font-black" style={{ color: '#36D399' }}>{arr.toLocaleString('fr-FR')} €</div>
          <div className="text-[11px] text-gray-400 mt-1">annuel récurrent</div>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-2">Répartition des plans</div>
          {(['premium', 'platinum', 'free'] as const).map(plan => {
            const pct = all.length ? Math.round((byPlan[plan] / all.length) * 100) : 0
            return (
              <div key={plan} className="mb-1.5">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="font-semibold capitalize" style={{ color: PLAN_COLORS[plan] }}>{plan}</span>
                  <span className="text-gray-400">{byPlan[plan]} ({pct}%)</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: '#F0F0F0' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLAN_COLORS[plan] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Growth chart */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Nouveaux inscrits (8 dernières semaines)</div>
          <div className="flex items-end gap-1.5 h-24">
            {weeks.map(w => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-gray-500">{w.count > 0 ? w.count : ''}</span>
                <div className="w-full rounded-t" style={{
                  height: `${Math.max((w.count / maxWeek) * 80, w.count > 0 ? 4 : 0)}px`,
                  background: '#3183F7',
                  minHeight: w.count > 0 ? 4 : 0,
                }} />
                <span className="text-[8px] text-gray-400">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent plan changes */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Changements de plan récents</div>
          {(planChanges ?? []).length === 0 ? (
            <div className="text-xs text-gray-400 py-4 text-center">Aucun changement enregistré.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {(planChanges ?? []).slice(0, 8).map(e => (
                <div key={e.created_at + e.user_id} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 truncate">{String((e.metadata as Record<string,unknown>)?.from ?? '?')} → <strong>{String((e.metadata as Record<string,unknown>)?.to ?? '?')}</strong></span>
                  <span className="text-[10px] text-gray-400">{new Date(e.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue by plan detail */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-800 mb-4">Détail par plan</div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['Plan', 'Abonnés', 'Prix/mois', 'MRR', 'ARR'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['premium', 'platinum'] as const).map((plan, i) => (
              <tr key={plan} style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : '1px solid #F0F0F0' }}>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold capitalize px-2 py-0.5 rounded-full"
                    style={{ background: `${PLAN_COLORS[plan]}18`, color: PLAN_COLORS[plan] }}>
                    {plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-800">{byPlan[plan]}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{PRICES[plan]} €</td>
                <td className="px-4 py-3 text-xs font-bold text-gray-800">{(byPlan[plan] * PRICES[plan]).toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: '#36D399' }}>{(byPlan[plan] * PRICES[plan] * 12).toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 mt-3 px-4">* Estimations basées sur les prix configurés (Premium 19€/mois, Platinum 29€/mois). Mettre à jour si les prix changent.</p>
      </div>
    </div>
  )
}
