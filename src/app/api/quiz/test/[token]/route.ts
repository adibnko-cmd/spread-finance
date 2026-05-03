import { adminClient } from '@/lib/supabase/admin-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

interface Props { params: Promise<{ token: string }> }

// GET — récupère le test par token (sans les bonnes réponses)
export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params
  const db = adminClient()

  const { data: test } = await db
    .from('candidate_tests')
    .select('id, title, description, question_count, time_limit, questions, is_active')
    .eq('token', token)
    .single()

  if (!test || !test.is_active) {
    return NextResponse.json({ error: 'Test introuvable ou désactivé' }, { status: 404 })
  }

  // Retirer isCorrect des réponses avant d'envoyer au candidat
  const safeQuestions = (test.questions as Array<{
    text: string; explanation: string; domain: string
    answers: { text: string; isCorrect: boolean }[]
  }>).map((q, idx) => ({
    index:   idx,
    text:    q.text,
    domain:  q.domain,
    answers: q.answers.map(a => ({ text: a.text })),
  }))

  return NextResponse.json({
    id:             test.id,
    title:          test.title,
    description:    test.description,
    question_count: test.question_count,
    time_limit:     test.time_limit,
    questions:      safeQuestions,
  })
}

const submitSchema = z.object({
  candidate_name:  z.string().min(1).max(100),
  candidate_email: z.string().email(),
  answers:         z.array(z.number().int().min(0)),
  time_seconds:    z.number().int().min(0),
})

// POST — soumet les réponses du candidat
export async function POST(req: NextRequest, { params }: Props) {
  const { token } = await params
  const db = adminClient()

  const { data: test } = await db
    .from('candidate_tests')
    .select('id, questions, is_active')
    .eq('token', token)
    .single()

  if (!test || !test.is_active) {
    return NextResponse.json({ error: 'Test introuvable ou désactivé' }, { status: 404 })
  }

  const parsed = submitSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { candidate_name, candidate_email, answers, time_seconds } = parsed.data
  const questions = test.questions as Array<{ answers: { text: string; isCorrect: boolean }[] }>

  let correct = 0
  const total = questions.length
  for (let i = 0; i < Math.min(answers.length, total); i++) {
    if (questions[i].answers[answers[i]]?.isCorrect) correct++
  }
  const score = Math.round((correct / total) * 100)

  const { error } = await db.from('candidate_results').insert({
    test_id:         test.id,
    candidate_name:  candidate_name.trim(),
    candidate_email: candidate_email.toLowerCase().trim(),
    score,
    correct_answers: correct,
    total_questions: total,
    time_seconds,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Résultat avec explications
  const details = questions.map((q, i) => ({
    question:    (q as { text: string } & typeof q).text ?? '',
    selected:    answers[i] ?? -1,
    correct_idx: q.answers.findIndex(a => a.isCorrect),
    is_correct:  q.answers[answers[i]]?.isCorrect ?? false,
    explanation: (q as { explanation?: string } & typeof q).explanation ?? '',
  }))

  return NextResponse.json({ score, correct, total, details })
}
