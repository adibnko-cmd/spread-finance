import { adminClient } from '@/lib/supabase/admin-server'
import { notFound } from 'next/navigation'
import { TestClient } from './TestClient'

interface Props { params: Promise<{ token: string }> }

export default async function CandidatTestPage({ params }: Props) {
  const { token } = await params
  const db = adminClient()

  const { data: test } = await db
    .from('candidate_tests')
    .select('id, title, description, question_count, time_limit, questions, is_active')
    .eq('token', token)
    .single()

  if (!test || !test.is_active) notFound()

  // Retirer isCorrect avant d'envoyer au client
  const safeQuestions = (test.questions as Array<{
    text: string; explanation: string; domain: string
    answers: { text: string; isCorrect: boolean }[]
  }>).map(q => ({
    text:    q.text,
    domain:  q.domain,
    answers: q.answers.map(a => ({ text: a.text })),
  }))

  return (
    <TestClient
      token={token}
      title={test.title}
      description={test.description}
      questions={safeQuestions}
      timeLimit={test.time_limit}
    />
  )
}
