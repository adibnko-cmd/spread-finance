import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  week_id:         z.string().min(1),
  total_questions: z.number().int().min(1),
  correct_answers: z.number().int().min(0),
  time_seconds:    z.number().int().min(0).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { week_id, total_questions, correct_answers, time_seconds } = parsed.data
  const score = Math.round((correct_answers / total_questions) * 100)
  const passed = score >= 50

  const { error } = await supabase.from('competition_results').upsert({
    user_id:         user.id,
    week_id,
    score,
    total_questions,
    correct_answers,
    time_seconds:    time_seconds ?? null,
    attempted_at:    new Date().toISOString(),
  }, { onConflict: 'user_id,week_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (passed) {
    await Promise.all([
      supabase.from('xp_log').insert({
        user_id:     user.id,
        source_type: 'quiz_free',
        source_id:   week_id,
        xp_earned:   25,
      }),
      supabase.from('cash_log').insert({
        user_id:     user.id,
        source_type: 'quiz_competition',
        source_id:   week_id,
        cash_earned: 20,
      }),
    ])
  }

  return NextResponse.json({ success: true, score, passed })
}
