import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const DOMAINS = ['finance', 'maths', 'dev', 'pm', 'ml'] as const

async function assertEnterprise() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return null
  return user
}

export async function GET() {
  const user = await assertEnterprise()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()

  // Fetch members
  const { data: members } = await db
    .from('enterprise_members')
    .select('user_id, role, joined_at')
    .eq('enterprise_id', user.id)
    .order('joined_at', { ascending: false })

  if (!members?.length) return NextResponse.json([])

  const userIds = members.map(m => m.user_id)

  // Fetch profiles + auth emails in parallel
  const [{ data: profiles }, { data: authData }, { data: assignments }, { data: chapterProgress }, { data: quizResults }, { data: xpLogs }] =
    await Promise.all([
      db.from('profiles').select('id, first_name, last_name').in('id', userIds),
      db.auth.admin.listUsers({ perPage: 1000 }),
      db.from('formation_assignments').select('user_id, domains, deadline, notes, assigned_at').eq('enterprise_id', user.id),
      db.from('chapter_progress').select('user_id, domain_slug, status').in('user_id', userIds),
      db.from('quiz_results').select('user_id, domain_slug, passed').in('user_id', userIds),
      db.from('xp_log').select('user_id, xp_earned').in('user_id', userIds),
    ])

  const emailMap     = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? '']))
  const profileMap   = new Map((profiles ?? []).map(p => [p.id, p]))
  const assignMap    = new Map((assignments ?? []).map(a => [a.user_id, a]))

  // Aggregate progress per user
  const progressMap = new Map<string, { chapters_completed: number; quizzes_passed: number; total_xp: number; by_domain: Record<string, { chapters_completed: number; quizzes_passed: number }> }>()

  for (const uid of userIds) {
    const byDomain: Record<string, { chapters_completed: number; quizzes_passed: number }> = {}

    for (const d of DOMAINS) {
      byDomain[d] = { chapters_completed: 0, quizzes_passed: 0 }
    }

    for (const row of (chapterProgress ?? []).filter(r => r.user_id === uid)) {
      if (row.status === 'completed' || row.status === 'validated') {
        byDomain[row.domain_slug] ??= { chapters_completed: 0, quizzes_passed: 0 }
        byDomain[row.domain_slug].chapters_completed++
      }
    }

    for (const row of (quizResults ?? []).filter(r => r.user_id === uid && r.passed)) {
      byDomain[row.domain_slug] ??= { chapters_completed: 0, quizzes_passed: 0 }
      byDomain[row.domain_slug].quizzes_passed++
    }

    const total_xp = (xpLogs ?? []).filter(r => r.user_id === uid).reduce((s, r) => s + (r.xp_earned ?? 0), 0)
    const chapters_completed = Object.values(byDomain).reduce((s, d) => s + d.chapters_completed, 0)
    const quizzes_passed     = Object.values(byDomain).reduce((s, d) => s + d.quizzes_passed, 0)

    progressMap.set(uid, { chapters_completed, quizzes_passed, total_xp, by_domain: byDomain })
  }

  const result = members.map(m => {
    const p   = profileMap.get(m.user_id)
    const a   = assignMap.get(m.user_id) ?? null
    const prg = progressMap.get(m.user_id) ?? { chapters_completed: 0, quizzes_passed: 0, total_xp: 0, by_domain: {} }

    return {
      user_id:    m.user_id,
      role:       m.role,
      joined_at:  m.joined_at,
      first_name: p?.first_name ?? null,
      last_name:  p?.last_name ?? null,
      email:      emailMap.get(m.user_id) ?? '—',
      assignment: a ? { domains: a.domains, deadline: a.deadline, notes: a.notes, assigned_at: a.assigned_at } : null,
      progress:   prg,
    }
  })

  return NextResponse.json(result)
}

const assignSchema = z.object({
  user_id:  z.string().uuid(),
  domains:  z.array(z.enum(DOMAINS)).min(1),
  deadline: z.string().nullable().optional(),
  notes:    z.string().max(500).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const user = await assertEnterprise()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = assignSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { user_id, domains, deadline, notes } = parsed.data
  const db = adminClient()

  // Verify member belongs to this enterprise
  const { data: membership } = await db
    .from('enterprise_members')
    .select('user_id')
    .eq('enterprise_id', user.id)
    .eq('user_id', user_id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Collaborateur introuvable' }, { status: 404 })

  const { error } = await db.from('formation_assignments').upsert(
    {
      enterprise_id: user.id,
      user_id,
      domains,
      deadline:    deadline ?? null,
      notes:       notes ?? null,
      updated_at:  new Date().toISOString(),
    },
    { onConflict: 'enterprise_id,user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await assertEnterprise()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const db = adminClient()
  const { error } = await db
    .from('formation_assignments')
    .delete()
    .eq('enterprise_id', user.id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
