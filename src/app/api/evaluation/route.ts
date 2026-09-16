// SF-EVAL-01 (2026-09-16) — le score est calculé ici, depuis le document Sanity.
// Avant : l'API faisait confiance au `correct_answers` envoyé par le navigateur.
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { EVAL_DOMAINS, correctIndexOf, isPremiumPlan, loadEvaluation, type QuestionCorrection } from '@/lib/evaluation'

const evalSchema = z.object({
  domain_slug:      z.enum(EVAL_DOMAINS),
  part:             z.number().int().min(1),
  difficulty_level: z.number().int().min(1).max(3),
  time_seconds:     z.number().int().min(0).optional(),
  answers:          z.array(z.number().int().min(0).nullable()),
})

const XP_MAP: Record<number, number> = { 1: 25, 2: 40, 3: 75 }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // SF-EVAL-03 (2026-09-16) — xp_log et evaluation_results ne sont plus écrivables avec la session de l'utilisateur
  // (RLS, migration 016) : écriture par la clé service, côté serveur uniquement, après authentification.
  const db = adminClient()

  const parsed = evalSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { domain_slug, part, difficulty_level, time_seconds, answers } = parsed.data

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const premium = isPremiumPlan(profile?.plan)

  // Niveau 3 → Premium requis (un plan absent n'est pas un plan Premium)
  if (difficulty_level === 3 && !premium) {
    return NextResponse.json({ error: 'Premium requis', upgrade: true }, { status: 403 })
  }

  const evaluation = await loadEvaluation(domain_slug, part, difficulty_level)
  const questions  = evaluation?.questions ?? []
  if (questions.length === 0) return NextResponse.json({ error: 'Évaluation introuvable' }, { status: 404 })
  if (answers.length !== questions.length) return NextResponse.json({ error: 'Nombre de réponses incorrect' }, { status: 400 })

  const correction: QuestionCorrection[] = questions.map(q => ({
    correctIndex: correctIndexOf(q),
    ...(premium && q.explanation ? { explanation: q.explanation } : {}),
  }))
  const total_questions = questions.length
  const correct_answers = answers.filter((a, i) => a !== null && a === correction[i].correctIndex).length
  const score  = Math.round((correct_answers / total_questions) * 100)
  const passed = score >= 70

  // XP : une seule fois par domaine × partie × niveau (avant : à chaque réussite, tentatives illimitées)
  let alreadyPassed = false
  if (passed) {
    const { count } = await supabase
      .from('evaluation_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('domain_slug', domain_slug)
      .eq('part', part)
      .eq('difficulty_level', difficulty_level)
      .eq('passed', true)
    alreadyPassed = (count ?? 0) > 0
  }

  const { data: result, error } = await db
    .from('evaluation_results')
    .insert({
      user_id:          user.id,
      domain_slug,
      part,
      part_title:       evaluation?.partTitle ?? null,
      difficulty_level,
      score,
      total_questions,
      correct_answers,
      passed,
      time_seconds:     time_seconds ?? null,
      answers:          JSON.stringify(answers),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const xp_earned = passed && !alreadyPassed ? (XP_MAP[difficulty_level] ?? 25) : 0

  if (xp_earned > 0) {
    await db.from('xp_log').insert({
      user_id:     user.id,
      source_type: `evaluation_level${difficulty_level}`,
      source_id:   `${domain_slug}-part${part}`,
      xp_earned,
    })
  }

  if (passed) {
    await supabase.from('activity_log').insert({
      user_id:      user.id,
      action_type:  'evaluation_passed',
      target_type:  'evaluation',
      target_slug:  `${domain_slug}-part${part}`,
      target_title: evaluation?.partTitle ?? null,
      metadata:     { score, difficulty_level, xp_earned },
    })
  }

  return NextResponse.json({
    success: true,
    score,
    passed,
    correct_answers,
    total_questions,
    xp_earned,
    correction,
    data: result,
  })
}
