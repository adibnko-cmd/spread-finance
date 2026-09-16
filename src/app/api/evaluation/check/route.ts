// SF-EVAL-01 — correction d'UNE question, après que l'utilisateur a validé sa réponse.
// Ne renvoie ni explication ni score : le score n'est calculé qu'à la soumission finale.
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { EVAL_DOMAINS, correctIndexOf, isPremiumPlan, loadEvaluation } from '@/lib/evaluation'

const checkSchema = z.object({
  domain_slug:      z.enum(EVAL_DOMAINS),
  part:             z.number().int().min(1),
  difficulty_level: z.number().int().min(1).max(3),
  question_index:   z.number().int().min(0),
  answer:           z.number().int().min(0),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const parsed = checkSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  const { domain_slug, part, difficulty_level, question_index, answer } = parsed.data

  if (difficulty_level === 3) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (!isPremiumPlan(profile?.plan)) return NextResponse.json({ error: 'Premium requis', upgrade: true }, { status: 403 })
  }

  const evaluation = await loadEvaluation(domain_slug, part, difficulty_level)
  const question = evaluation?.questions?.[question_index]
  if (!question) return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
  if (answer >= (question.answers ?? []).length) return NextResponse.json({ error: 'Réponse invalide' }, { status: 400 })

  const correctIndex = correctIndexOf(question)
  return NextResponse.json({ isCorrect: answer === correctIndex, correctIndex })
}
