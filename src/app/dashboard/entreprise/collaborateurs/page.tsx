import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import { CollaborateursClient } from './CollaborateursClient'

export const dynamic = 'force-dynamic'

export default async function CollaborateursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: ep } = await supabase
    .from('enterprise_profiles').select('seats').eq('id', user.id).single()

  const db = adminClient()

  const { data: members } = await db
    .from('enterprise_members')
    .select('user_id, role, joined_at')
    .eq('enterprise_id', user.id)
    .order('joined_at', { ascending: false })

  const userIds = (members ?? []).map(m => m.user_id)
  const { data: profiles } = userIds.length > 0
    ? await db.from('profiles').select('id, first_name, last_name, plan').in('id', userIds)
    : { data: [] }

  const emails: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authUsers) {
      if (userIds.includes(u.id)) emails[u.id] = u.email ?? ''
    }
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const formatted = (members ?? []).map(m => {
    const p = profileMap.get(m.user_id)
    return {
      user_id:    m.user_id,
      role:       m.role as 'admin' | 'member',
      joined_at:  m.joined_at,
      first_name: p?.first_name ?? null,
      last_name:  p?.last_name ?? null,
      email:      emails[m.user_id] ?? '—',
      plan:       (p?.plan ?? 'free') as string,
    }
  })

  return (
    <CollaborateursClient
      members={formatted}
      seats={ep?.seats ?? 0}
      usedSeats={formatted.length}
    />
  )
}
