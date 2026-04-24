// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — API Route : Soumission Quiz
// POST /api/quiz — enregistre le résultat + déclenche validation
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { sendQuizPassedEmail } from '@/lib/email'

const quizSubmitSchema = z.object({
  chapter_slug:    z.string().min(1),
  domain_slug:     z.enum(['finance', 'maths', 'dev', 'pm', 'ml']),
  quiz_level:      z.number().int().min(1).max(3),
  total_questions: z.number().int().min(1),
  correct_answers: z.number().int().min(0),
  time_seconds:    z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = quizSubmitSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { chapter_slug, domain_slug, quiz_level, total_questions, correct_answers, time_seconds } = parsed.data

  // Vérifier accès quiz niveau 3 (Premium requis) + charger le profil
  const { data: profile } = await supabase
    .from('profiles').select('plan, first_name').eq('id', user.id).single()
  if (quiz_level === 3 && profile?.plan === 'free') {
    return NextResponse.json({ error: 'Premium required', upgrade: true }, { status: 403 })
  }

  const score  = Math.round((correct_answers / total_questions) * 100)
  const passed = score >= 70

  // Enregistrer le résultat
  const { data: result, error } = await supabase
    .from('quiz_results')
    .insert({
      user_id:         user.id,
      chapter_slug,
      domain_slug,
      quiz_level,
      score,
      total_questions,
      correct_answers,
      time_seconds:    time_seconds ?? null,
      passed,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si quiz réussi → valider le chapitre + XP
  if (passed) {
    await supabase
      .from('chapter_progress')
      .upsert({
        user_id:       user.id,
        chapter_slug,
        domain_slug,
        status:        'validated',
        validated_at:  new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'user_id,chapter_slug' })

    // XP selon niveau du quiz
    const xpMap: Record<number, number> = { 1: 15, 2: 25, 3: 50 }
    await supabase.from('xp_log').insert({
      user_id:     user.id,
      source_type: `quiz_level${quiz_level}` as 'quiz_level1' | 'quiz_level2' | 'quiz_level3',
      source_id:   chapter_slug,
      xp_earned:   xpMap[quiz_level],
    })
  }

  // Log activité
  await supabase.from('activity_log').insert({
    user_id:     user.id,
    action_type: 'quiz_completed',
    target_type: 'quiz',
    target_slug: chapter_slug,
    metadata:    { score, passed, quiz_level },
  })

  // Email si quiz réussi (fire-and-forget, pas bloquant)
  if (passed && user.email) {
    const xpMap: Record<number, number> = { 1: 15, 2: 25, 3: 50 }
    sendQuizPassedEmail(
      user.email,
      profile?.first_name ?? 'vous',
      chapter_slug,
      score,
      quiz_level,
      xpMap[quiz_level] ?? 0,
    ).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    score,
    passed,
    xp_earned: passed ? [15, 25, 50][quiz_level - 1] : 0,
    data: result,
  })
}
