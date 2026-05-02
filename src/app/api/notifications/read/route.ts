import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []

  const now = new Date().toISOString()

  if (ids.length > 0) {
    await supabase.from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .in('id', ids)
  } else {
    await supabase.from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  return NextResponse.json({ success: true })
}
