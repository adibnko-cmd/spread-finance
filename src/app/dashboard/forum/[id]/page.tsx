import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ThreadClient } from './ThreadClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

function formatName(p: { first_name?: string | null; last_name?: string | null } | undefined): string {
  if (!p) return 'Anonyme'
  return [p.first_name, p.last_name?.[0] ? p.last_name[0] + '.' : '']
    .filter(Boolean).join(' ').trim() || 'Anonyme'
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('id, domain, title, content, is_pinned, is_locked, vote_count, post_count, view_count, user_id, created_at, last_activity_at')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (!thread) notFound()

  // Increment view count (best-effort)
  supabase.from('forum_threads').update({ view_count: (thread.view_count ?? 0) + 1 }).eq('id', id)

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, content, vote_count, is_solution, is_deleted, created_at, updated_at, user_id')
    .eq('thread_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  const allUserIds = [...new Set([thread.user_id, ...(posts ?? []).map(p => p.user_id)].filter(Boolean))]
  const { data: profiles } = allUserIds.length > 0
    ? await supabase.from('profiles').select('id, first_name, last_name, plan, is_admin').in('id', allUserIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // My votes
  const allIds = [id, ...(posts ?? []).map(p => p.id)]
  const { data: myVotes } = await supabase
    .from('forum_votes')
    .select('target_type, target_id')
    .eq('user_id', user.id)
    .in('target_id', allIds)

  const votedSet = new Set((myVotes ?? []).map(v => `${v.target_type}:${v.target_id}`))
  const isAdmin  = (profileMap.get(user.id) as { is_admin?: boolean } | undefined)?.is_admin ?? false

  return (
    <ThreadClient
      thread={{
        id:         thread.id,
        domain:     thread.domain,
        title:      thread.title,
        content:    thread.content,
        is_pinned:  thread.is_pinned,
        is_locked:  thread.is_locked,
        vote_count: thread.vote_count,
        post_count: thread.post_count,
        created_at: thread.created_at,
        user_id:    thread.user_id,
        authorName: formatName(profileMap.get(thread.user_id) as Parameters<typeof formatName>[0]),
        authorPlan: (profileMap.get(thread.user_id) as { plan?: string } | undefined)?.plan ?? 'free',
        hasVoted:   votedSet.has(`thread:${id}`),
      }}
      posts={(posts ?? []).map(p => ({
        id:          p.id,
        content:     p.content,
        vote_count:  p.vote_count,
        is_solution: p.is_solution,
        created_at:  p.created_at,
        updated_at:  p.updated_at,
        user_id:     p.user_id,
        authorName:  formatName(profileMap.get(p.user_id) as Parameters<typeof formatName>[0]),
        authorPlan:  (profileMap.get(p.user_id) as { plan?: string } | undefined)?.plan ?? 'free',
        hasVoted:    votedSet.has(`post:${p.id}`),
      }))}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  )
}
