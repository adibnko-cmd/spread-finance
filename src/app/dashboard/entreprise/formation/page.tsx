import { adminClient } from '@/lib/supabase/admin-server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FormationClient } from './FormationClient'

export const dynamic = 'force-dynamic'

export default async function FormationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') redirect('/dashboard')

  const db = adminClient()

  const { data: members } = await db
    .from('enterprise_members')
    .select('user_id, role, joined_at')
    .eq('enterprise_id', user.id)
    .order('joined_at', { ascending: false })

  if (!members?.length) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="text-lg font-black text-gray-900">Formation groupe</div>
          <div className="text-sm text-gray-400 mt-0.5">Assignez des parcours de formation à vos collaborateurs.</div>
        </div>
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">👥</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucun collaborateur</div>
          <div className="text-xs text-gray-400">Ajoutez d&apos;abord des collaborateurs depuis l&apos;onglet Collaborateurs.</div>
        </div>
      </div>
    )
  }

  const userIds = members.map(m => m.user_id)

  const [
    { data: profiles },
    { data: authData },
    { data: assignments },
    { data: chapterProgress },
    { data: quizResults },
    { data: xpLogs },
  ] = await Promise.all([
    db.from('profiles').select('id, first_name, last_name').in('id', userIds),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from('formation_assignments').select('user_id, domains, deadline, notes, assigned_at').eq('enterprise_id', user.id),
    db.from('chapter_progress').select('user_id, domain_slug, status').in('user_id', userIds),
    db.from('quiz_results').select('user_id, domain_slug, passed').in('user_id', userIds),
    db.from('xp_log').select('user_id, xp_earned').in('user_id', userIds),
  ])

  const emailMap   = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? '']))
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const assignMap  = new Map((assignments ?? []).map(a => [a.user_id, a]))

  const DOMAINS = ['finance', 'maths', 'dev', 'pm', 'ml'] as const

  const memberData = members.map(m => {
    const p = profileMap.get(m.user_id)
    const a = assignMap.get(m.user_id) ?? null

    const byDomain: Record<string, { chapters_completed: number; quizzes_passed: number }> = {}
    for (const d of DOMAINS) byDomain[d] = { chapters_completed: 0, quizzes_passed: 0 }

    for (const row of (chapterProgress ?? []).filter(r => r.user_id === m.user_id)) {
      if (row.status === 'completed' || row.status === 'validated') {
        byDomain[row.domain_slug] ??= { chapters_completed: 0, quizzes_passed: 0 }
        byDomain[row.domain_slug].chapters_completed++
      }
    }
    for (const row of (quizResults ?? []).filter(r => r.user_id === m.user_id && r.passed)) {
      byDomain[row.domain_slug] ??= { chapters_completed: 0, quizzes_passed: 0 }
      byDomain[row.domain_slug].quizzes_passed++
    }

    const total_xp           = (xpLogs ?? []).filter(r => r.user_id === m.user_id).reduce((s, r) => s + (r.xp_earned ?? 0), 0)
    const chapters_completed  = Object.values(byDomain).reduce((s, d) => s + d.chapters_completed, 0)
    const quizzes_passed      = Object.values(byDomain).reduce((s, d) => s + d.quizzes_passed, 0)

    return {
      user_id:    m.user_id,
      first_name: p?.first_name ?? null,
      last_name:  p?.last_name ?? null,
      email:      emailMap.get(m.user_id) ?? '—',
      assignment: a ? { domains: a.domains as string[], deadline: a.deadline as string | null, notes: a.notes as string | null } : null,
      progress:   { chapters_completed, quizzes_passed, total_xp, by_domain: byDomain },
    }
  })

  return <FormationClient members={memberData} />
}
