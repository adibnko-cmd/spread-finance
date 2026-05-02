import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllQuizQuestions } from '@/lib/sanity/client'
import { SpeedClient } from './SpeedClient'

export const dynamic = 'force-dynamic'

export default async function SpeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/quiz/speed')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  if (!isPremium) redirect('/dashboard/quiz')

  const rawQuizzes = await getAllQuizQuestions().catch(() => []) as Array<{
    level: number; chapterSlug: string; domain: string
    questions: Array<{ _key: string; text: string; explanation: string; answers: Array<{ text: string; isCorrect: boolean }> }>
  }>

  const allQuestions = rawQuizzes.flatMap(q =>
    (q.questions ?? []).map(question => ({ ...question, domain: q.domain ?? 'finance', level: q.level ?? 1 }))
  )

  return <SpeedClient questions={allQuestions} />
}
