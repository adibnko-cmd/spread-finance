import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  result_id: z.string().uuid(),
  status:    z.enum(['pending', 'retained', 'rejected']),
  hr_note:   z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { result_id, status, hr_note } = parsed.data
  const db = adminClient()

  // Verify the result belongs to a test owned by this enterprise
  const { data: result } = await db
    .from('candidate_results')
    .select('id, test_id')
    .eq('id', result_id)
    .single()

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: test } = await db
    .from('candidate_tests')
    .select('enterprise_id')
    .eq('id', result.test_id)
    .single()

  if (!test || test.enterprise_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update: Record<string, unknown> = { status }
  if (hr_note !== undefined) update.hr_note = hr_note

  const { error } = await db
    .from('candidate_results')
    .update(update)
    .eq('id', result_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
