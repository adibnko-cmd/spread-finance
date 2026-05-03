import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { data: members } = await db
    .from('enterprise_members')
    .select('user_id, role, invited_at, joined_at')
    .eq('enterprise_id', user.id)
    .order('joined_at', { ascending: false })

  if (!members?.length) return NextResponse.json([])

  const userIds = members.map(m => m.user_id)
  const { data: profiles } = await db
    .from('profiles')
    .select('id, first_name, last_name, plan')
    .in('id', userIds)

  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const result = members.map(m => {
    const p = profileMap.get(m.user_id)
    return {
      user_id:    m.user_id,
      role:       m.role,
      joined_at:  m.joined_at,
      first_name: p?.first_name ?? null,
      last_name:  p?.last_name ?? null,
      email:      emailMap.get(m.user_id) ?? '—',
      plan:       p?.plan ?? 'free',
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const user = await assertEnterprise()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role = 'member' } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const db = adminClient()

  // Vérifier les sièges
  const { data: ep } = await db
    .from('enterprise_profiles').select('seats, company_name').eq('id', user.id).single()
  const { count } = await db
    .from('enterprise_members').select('*', { count: 'exact', head: true }).eq('enterprise_id', user.id)
  if (ep && (count ?? 0) >= ep.seats) {
    return NextResponse.json({ error: `Limite de ${ep.seats} siège(s) atteinte` }, { status: 400 })
  }

  // Trouver l'utilisateur par email
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim())
  if (!target) return NextResponse.json({ error: 'Aucun compte trouvé avec cet email' }, { status: 404 })
  if (target.id === user.id) return NextResponse.json({ error: 'Vous ne pouvez pas vous ajouter vous-même' }, { status: 400 })

  const { error } = await db.from('enterprise_members').upsert(
    { enterprise_id: user.id, user_id: target.id, role, invited_at: new Date().toISOString(), joined_at: new Date().toISOString() },
    { onConflict: 'enterprise_id,user_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('profiles').update({ plan: 'enterprise' }).eq('id', target.id)

  const { data: profile } = await db.from('profiles').select('first_name, last_name').eq('id', target.id).single()

  return NextResponse.json({
    user_id:   target.id,
    email:     target.email,
    role,
    joined_at: new Date().toISOString(),
    first_name: profile?.first_name ?? null,
    last_name:  profile?.last_name ?? null,
    plan:       'enterprise',
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await assertEnterprise()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const db = adminClient()

  const { error } = await db
    .from('enterprise_members').delete()
    .eq('enterprise_id', user.id)
    .eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await db
    .from('enterprise_members').select('*', { count: 'exact', head: true }).eq('user_id', user_id)
  if ((count ?? 0) === 0) {
    await db.from('profiles').update({ plan: 'free' }).eq('id', user_id)
  }

  return NextResponse.json({ success: true })
}
