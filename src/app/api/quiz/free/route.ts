import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  mode:            z.enum(['training', 'speed', 'knockout']),
  domain_slug:     z.string().optional(),
  difficulty:      z.enum(['easy', 'medium', 'hard']).optional(),
  total_questions: z.number().int().min(1),
  correct_answers: z.number().int().min(0),
  time_seconds:    z.number().int().min(0).optional(),
})

const XP_MAP:   Record<string, number> = { training: 10, speed: 20, knockout: 30 }
const CASH_MAP: Record<string, number> = { training: 3,  speed: 8,  knockout: 15 }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { mode, total_questions, correct_answers, time_seconds } = parsed.data

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  if ((mode === 'speed' || mode === 'knockout') && !isPremium) {
    return NextResponse.json({ error: 'Premium required', upgrade: true }, { status: 403 })
  }

  const score  = Math.round((correct_answers / total_questions) * 100)
  const passed = score >= 70

  if (passed) {
    await Promise.all([
      supabase.from('xp_log').insert({
        user_id:     user.id,
        source_type: 'quiz_free',
        source_id:   mode,
        xp_earned:   XP_MAP[mode] ?? 10,
      }),
      supabase.from('cash_log').insert({
        user_id:     user.id,
        source_type: `quiz_${mode}`,
        source_id:   null,
        cash_earned: CASH_MAP[mode] ?? 3,
      }),
    ])
  }

  await supabase.from('activity_log').insert({
    user_id:     user.id,
    action_type: 'quiz_completed',
    target_type: 'quiz',
    target_slug: mode,
    target_title: `Quiz ${mode}`,
    metadata:    { score, passed, mode, total_questions, correct_answers, time_seconds },
  })

  return NextResponse.json({
    success: true,
    score,
    passed,
    xp_earned:   passed ? (XP_MAP[mode] ?? 10) : 0,
    cash_earned: passed ? (CASH_MAP[mode] ?? 3) : 0,
  })
}
