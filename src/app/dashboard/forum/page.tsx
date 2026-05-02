import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ForumClient } from './ForumClient'

export const dynamic = 'force-dynamic'

export default async function ForumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/forum')

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('id, domain, title, content, is_pinned, is_locked, vote_count, post_count, last_activity_at, created_at, user_id')
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(60)

  const userIds = [...new Set((threads ?? []).map(t => t.user_id))]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [
    p.id,
    [p.first_name, p.last_name?.[0] ? p.last_name[0] + '.' : ''].filter(Boolean).join(' ').trim() || 'Anonyme',
  ]))

  const formattedThreads = (threads ?? []).map(t => ({
    id:               t.id,
    domain:           t.domain,
    title:            t.title,
    content:          t.content,
    is_pinned:        t.is_pinned,
    is_locked:        t.is_locked,
    vote_count:       t.vote_count,
    post_count:       t.post_count,
    last_activity_at: t.last_activity_at,
    created_at:       t.created_at,
    authorName:       profileMap.get(t.user_id) ?? 'Anonyme',
  }))

  return <ForumClient threads={formattedThreads} currentUserId={user.id} />
}
