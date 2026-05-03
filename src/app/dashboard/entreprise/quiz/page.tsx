import { createClient } from '@/lib/supabase/server'
import { QuizManager } from './QuizManager'

export const dynamic = 'force-dynamic'

export default async function EnterpriseQuizPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tests } = await supabase
    .from('candidate_tests')
    .select('id, title, description, token, domains, question_count, time_limit, is_active, created_at')
    .eq('enterprise_id', user.id)
    .order('created_at', { ascending: false })

  // Compter les résultats par test
  const testIds = (tests ?? []).map(t => t.id)
  const { data: resultCounts } = testIds.length > 0
    ? await supabase
        .from('candidate_results')
        .select('test_id')
        .in('test_id', testIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const r of resultCounts ?? []) {
    countMap[r.test_id] = (countMap[r.test_id] ?? 0) + 1
  }

  const formattedTests = (tests ?? []).map(t => ({
    ...t,
    result_count: countMap[t.id] ?? 0,
  }))

  return <QuizManager tests={formattedTests} />
}
