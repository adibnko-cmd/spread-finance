import { adminClient } from '@/lib/supabase/admin-server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type EventType = 'test_result' | 'member_join' | 'test_created' | 'job_posted'

interface ActivityEvent {
  type:      EventType
  label:     string
  sublabel:  string
  date:      string
  icon:      string
  color:     string
  bg:        string
}

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') redirect('/dashboard')

  const db = adminClient()

  const [
    { data: results },
    { data: members },
    { data: tests },
    { data: jobs },
    { data: authData },
  ] = await Promise.all([
    db.from('candidate_results')
      .select('id, candidate_name, candidate_email, score, completed_at, test_id')
      .in('test_id',
        db.from('candidate_tests').select('id').eq('enterprise_id', user.id) as unknown as string[]
      )
      .order('completed_at', { ascending: false })
      .limit(50),
    db.from('enterprise_members')
      .select('user_id, joined_at')
      .eq('enterprise_id', user.id)
      .order('joined_at', { ascending: false }),
    db.from('candidate_tests')
      .select('id, title, created_at')
      .eq('enterprise_id', user.id)
      .order('created_at', { ascending: false }),
    db.from('jobs')
      .select('id, title, posted_at')
      .eq('posted_by', user.id)
      .order('posted_at', { ascending: false })
      .limit(20),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap   = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? '']))
  const testTitleMap = new Map((tests ?? []).map(t => [t.id, t.title]))

  // Build unified event stream
  const events: ActivityEvent[] = []

  for (const r of results ?? []) {
    const passed = r.score >= 70
    events.push({
      type:     'test_result',
      label:    `${r.candidate_name} — ${r.score}% ${passed ? '✓' : '✗'}`,
      sublabel: `Test : ${testTitleMap.get(r.test_id) ?? '—'}`,
      date:     r.completed_at,
      icon:     passed ? '🎯' : '📋',
      color:    passed ? '#0d7a56' : '#6B7280',
      bg:       passed ? '#E6FAF3' : '#F5F6F8',
    })
  }

  for (const m of members ?? []) {
    const email = emailMap.get(m.user_id) ?? m.user_id
    events.push({
      type:     'member_join',
      label:    email,
      sublabel: 'Nouveau collaborateur ajouté',
      date:     m.joined_at,
      icon:     '👤',
      color:    '#3183F7',
      bg:       '#EBF2FF',
    })
  }

  for (const t of tests ?? []) {
    events.push({
      type:     'test_created',
      label:    t.title,
      sublabel: 'Test candidat créé',
      date:     t.created_at,
      icon:     '📝',
      color:    '#A855F7',
      bg:       '#F5F0FF',
    })
  }

  for (const j of jobs ?? []) {
    events.push({
      type:     'job_posted',
      label:    j.title,
      sublabel: "Offre d'emploi déposée",
      date:     j.posted_at,
      icon:     '💼',
      color:    '#b37700',
      bg:       '#FFF8E6',
    })
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Historique</div>
        <div className="text-sm text-gray-400 mt-0.5">Toute l&apos;activité de votre espace entreprise.</div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">📅</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucune activité pour l&apos;instant</div>
          <div className="text-xs text-gray-400">Les résultats de tests, ajouts de membres et offres apparaîtront ici.</div>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px" style={{ background: '#E8E8E8' }} />

          <div className="flex flex-col gap-0">
            {events.map((ev, i) => (
              <div key={i} className="flex items-start gap-4 pb-4">
                {/* Icon dot */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base flex-shrink-0 relative z-10"
                  style={{ background: ev.bg, border: `2px solid ${ev.color}30` }}
                >
                  {ev.icon}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl px-4 py-3 flex-1" style={{ border: '1.5px solid #F0F1F3' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{ev.label}</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: ev.color }}>{ev.sublabel}</div>
                    </div>
                    <div className="text-[9px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {timeLabel(ev.date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
