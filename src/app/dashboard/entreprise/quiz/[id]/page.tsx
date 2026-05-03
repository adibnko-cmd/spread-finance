import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TestResultsClient } from './TestResultsClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function TestResultsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: test } = await supabase
    .from('candidate_tests')
    .select('id, title, description, domains, question_count, time_limit, is_active, created_at, token')
    .eq('id', id)
    .eq('enterprise_id', user.id)
    .single()

  if (!test) notFound()

  const { data: results } = await supabase
    .from('candidate_results')
    .select('id, candidate_name, candidate_email, score, correct_answers, total_questions, time_seconds, completed_at')
    .eq('test_id', id)
    .order('completed_at', { ascending: false })

  const allResults = results ?? []
  const avg = allResults.length > 0
    ? Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length)
    : null
  const passRate = allResults.length > 0
    ? Math.round((allResults.filter(r => r.score >= 70).length / allResults.length) * 100)
    : null

  return (
    <TestResultsClient
      test={{ ...test, domains: test.domains ?? [] }}
      results={allResults}
      stats={{ avg, passRate, total: allResults.length }}
    />
  )
}
