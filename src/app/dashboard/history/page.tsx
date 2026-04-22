import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DOMAIN_META: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  chapter_opened:    { label: 'Chapitre ouvert',   icon: '📖', color: '#3183F7' },
  chapter_read:      { label: 'Chapitre lu',        icon: '📖', color: '#3183F7' },
  chapter_completed: { label: 'Chapitre validé',    icon: '✅', color: '#36D399' },
  chapter_validated: { label: 'Chapitre certifié',  icon: '🏆', color: '#FFC13D' },
  quiz_completed:    { label: 'Quiz complété',       icon: '🎯', color: '#A855F7' },
  xp_earned:         { label: 'XP gagné',            icon: '⭐', color: '#FFC13D' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByDate(items: Array<any>) {
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const day = new Date(item.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(item)
  }
  return groups
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [activityRes, xpRes] = await Promise.all([
    supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('xp_log')
      .select('xp_earned, source_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const activity = activityRes.data ?? []
  const totalXp  = (xpRes.data ?? []).reduce((s, x) => s + x.xp_earned, 0)

  const groups = groupByDate(activity)

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-black text-gray-800">Historique d&apos;activité</div>
        <div className="text-xs text-gray-400">{totalXp.toLocaleString()} XP total</div>
      </div>

      {activity.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">📋</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucune activité</div>
          <p className="text-xs text-gray-400 mb-5">Commencez un chapitre pour voir votre historique</p>
          <Link
            href="/documentation"
            className="inline-block text-xs font-bold text-white px-5 py-2.5 rounded-xl"
            style={{ background: '#3183F7' }}
          >
            Voir la documentation →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 capitalize">
                {day}
              </div>
              <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
                {items.map((a, i) => {
                  const meta   = ACTION_META[a.action_type] ?? { label: a.action_type, icon: '•', color: '#888' }
                  const domain = a.domain_slug ? DOMAIN_META[a.domain_slug] : null
                  const score  = a.metadata?.score
                  const xp     = a.metadata?.xp_earned

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                      style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none' }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: `${meta.color}15` }}
                      >
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-800">{meta.label}</span>
                          {score !== undefined && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: score >= 70 ? '#E6FAF3' : '#FEF0EE',
                                color: score >= 70 ? '#0d7a56' : '#c0392b',
                              }}
                            >
                              {score}%
                            </span>
                          )}
                          {xp > 0 && (
                            <span className="text-[9px] font-bold text-yellow-600">+{xp} XP</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {domain && (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: domain.color }} />
                              <span className="text-[10px] text-gray-400">{domain.name}</span>
                              <span className="text-gray-200">·</span>
                            </>
                          )}
                          {a.target_title && (
                            <span className="text-[10px] text-gray-400 truncate max-w-xs">{a.target_title}</span>
                          )}
                          {!a.target_title && a.target_slug && (
                            <span className="text-[10px] text-gray-400 truncate max-w-xs">{a.target_slug}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-300 flex-shrink-0">
                        {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
