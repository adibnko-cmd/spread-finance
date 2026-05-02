import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.discriminatedUnion('entity', [
  z.object({
    entity:    z.literal('thread'),
    id:        z.string().uuid(),
    action:    z.enum(['pin', 'lock', 'delete']),
  }),
  z.object({
    entity:    z.literal('post'),
    id:        z.string().uuid(),
    action:    z.enum(['delete', 'solution']),
    thread_id: z.string().uuid().optional(),
  }),
])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = profile?.is_admin ?? false

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const body = parsed.data

  if (body.entity === 'thread') {
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const patch: Record<string, unknown> = {}
    if (body.action === 'pin')    patch.is_pinned  = true
    if (body.action === 'lock')   patch.is_locked  = true
    if (body.action === 'delete') patch.is_deleted = true

    const { error } = await supabase.from('forum_threads').update(patch).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // entity === 'post'
  if (body.action === 'delete') {
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { error } = await supabase.from('forum_posts').update({ is_deleted: true }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'solution') {
    // Only thread author can mark solution
    const { data: post } = await supabase
      .from('forum_posts').select('thread_id').eq('id', body.id).single()
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const { data: thread } = await supabase
      .from('forum_threads').select('user_id').eq('id', post.thread_id).single()
    if (!thread || (thread.user_id !== user.id && !isAdmin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: current } = await supabase
      .from('forum_posts').select('is_solution').eq('id', body.id).single()
    const { error } = await supabase
      .from('forum_posts').update({ is_solution: !current?.is_solution }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, is_solution: !current?.is_solution })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
