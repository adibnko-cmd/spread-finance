import { notFound, redirect } from 'next/navigation'
import { getChapterBySlug, getArticleBySlug, getQuizByChapter } from '@/lib/sanity/client'
import { createClient } from '@/lib/supabase/server'
import QuizClient from './QuizClient'

export const dynamic = 'force-dynamic'

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}) {
  const { slug }  = await params
  const { level } = await searchParams
  const quizLevel = Math.min(3, Math.max(1, parseInt(level ?? '1', 10))) as 1 | 2 | 3

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/quiz/${slug}`)

  // Chercher chapitre OU article
  const [chapter, article, quiz] = await Promise.all([
    getChapterBySlug(slug).catch(() => null),
    getArticleBySlug(slug).catch(() => null),
    getQuizByChapter(slug, quizLevel).catch(() => null),
  ])

  const content = chapter ?? article
  if (!content) notFound()

  if (quizLevel === 3) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (profile?.plan === 'free') redirect(`/quiz/${slug}?level=1&upgrade=1`)
  }

  return (
    <QuizClient
      chapterSlug={slug}
      chapterTitle={content.title}
      domainSlug={content.domain}
      quizLevel={quizLevel}
      quiz={quiz}
    />
  )
}
