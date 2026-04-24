import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const evalSchema = z.object({
  domain_slug:      z.enum(['finance', 'maths', 'dev', 'pm', 'ml']),
  part:             z.number().int().min(1),
  part_title:       z.string().optional(),
  difficulty_level: z.number().int().min(1).max(3),
  total_questions:  z.number().int().min(1),
  correct_answers:  z.number().int().min(0),
  time_seconds:     z.number().int().min(0).optional(),
  answers:          z.array(z.number().nullable()).optional(),
})

const XP_MAP: Record<number, number> = { 1: 25, 2: 40, 3: 75 }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const parsed = evalSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { domain_slug, part, part_title, difficulty_level, total_questions, correct_answers, time_seconds, answers } = parsed.data

  // Niveau 3 → Premium requis
  if (difficulty_level === 3) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (profile?.plan === 'free') {
      return NextResponse.json({ error: 'Premium requis', upgrade: true }, { status: 403 })
    }
  }

  const score  = Math.round((correct_answers / total_questions) * 100)
  const passed = score >= 70

  const { data: result, error } = await supabase
    .from('evaluation_results')
    .insert({
      user_id:          user.id,
      domain_slug,
      part,
      part_title:       part_title ?? null,
      difficulty_level,
      score,
      total_questions,
      correct_answers,
      passed,
      time_seconds:     time_seconds ?? null,
      answers:          answers ? JSON.stringify(answers) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // XP si évaluation réussie
  if (passed) {
    const xp = XP_MAP[difficulty_level] ?? 25
    await supabase.from('xp_log').insert({
      user_id:     user.id,
      source_type: `evaluation_level${difficulty_level}`,
      source_id:   `${domain_slug}-part${part}`,
      xp_earned:   xp,
    })

    await supabase.from('activity_log').insert({
      user_id:      user.id,
      action_type:  'evaluation_passed',
      target_type:  'evaluation',
      target_slug:  `${domain_slug}-part${part}`,
      target_title: part_title ?? null,
      metadata:     { score, difficulty_level, xp_earned: xp },
    })
  }

  return NextResponse.json({
    success: true,
    score,
    passed,
    xp_earned: passed ? (XP_MAP[difficulty_level] ?? 0) : 0,
    data: result,
  })
}
