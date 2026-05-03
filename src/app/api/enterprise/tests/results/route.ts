import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const testId = req.nextUrl.searchParams.get('test_id')
  if (!testId) return NextResponse.json({ error: 'test_id requis' }, { status: 400 })

  // Vérifier que le test appartient à l'entreprise
  const { data: test } = await supabase
    .from('candidate_tests').select('id, title').eq('id', testId).eq('enterprise_id', user.id).single()
  if (!test) return NextResponse.json({ error: 'Test introuvable' }, { status: 404 })

  const { data: results } = await supabase
    .from('candidate_results')
    .select('id, candidate_name, candidate_email, score, correct_answers, total_questions, time_seconds, completed_at')
    .eq('test_id', testId)
    .order('completed_at', { ascending: false })

  return NextResponse.json(results ?? [])
}
