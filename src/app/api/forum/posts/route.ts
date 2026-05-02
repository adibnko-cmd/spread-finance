import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  thread_id: z.string().uuid(),
  content:   z.string().min(1).max(3000),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { thread_id, content } = parsed.data

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('id, user_id, title, is_locked')
    .eq('id', thread_id)
    .eq('is_deleted', false)
    .single()

  if (!thread) return NextResponse.json({ error: 'Sujet introuvable' }, { status: 404 })
  if (thread.is_locked) return NextResponse.json({ error: 'Ce sujet est verrouillé' }, { status: 403 })

  const { data: post, error } = await supabase
    .from('forum_posts')
    .insert({ thread_id, user_id: user.id, content })
    .select('id, content, vote_count, is_solution, created_at, updated_at, user_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify thread author (if different from poster)
  if (thread.user_id !== user.id) {
    const { data: poster } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const posterName = [poster?.first_name, poster?.last_name?.[0] ? poster.last_name[0] + '.' : '']
      .filter(Boolean).join(' ').trim() || 'Quelqu\'un'

    await supabase.from('notifications').insert({
      user_id:  thread.user_id,
      type:     'forum_reply',
      actor_id: user.id,
      title:    `Nouvelle réponse — ${thread.title.slice(0, 60)}${thread.title.length > 60 ? '…' : ''}`,
      body:     `${posterName} a répondu à votre sujet.`,
      link:     `/dashboard/forum/${thread_id}`,
    })
  }

  return NextResponse.json(post)
}
