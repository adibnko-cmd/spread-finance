import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  target_type: z.enum(['thread', 'post']),
  target_id:   z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { target_type, target_id } = parsed.data

  const { data: existing } = await supabase
    .from('forum_votes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('forum_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
    return NextResponse.json({ voted: false })
  }

  await supabase.from('forum_votes').insert({ user_id: user.id, target_type, target_id })
  return NextResponse.json({ voted: true })
}
