import { createClient } from '@/lib/supabase/server'
import { getChaptersByDomain } from '@/lib/sanity/client'
import { redirect } from 'next/navigation'
import RoadmapClient from './RoadmapClient'

export const dynamic = 'force-dynamic'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/roadmap')

  const [chapters, progressRes, quizRes, evalRes] = await Promise.all([
    getChaptersByDomain().catch(() => []),
    supabase.from('chapter_progress').select('chapter_slug, status').eq('user_id', user.id),
    supabase.from('quiz_results').select('chapter_slug, score, passed').eq('user_id', user.id),
    supabase.from('evaluation_results').select('domain_slug, part, part_title, score, passed, difficulty_level, attempted_at').eq('user_id', user.id),
  ])

  // chapter_slug → status
  const progressMap: Record<string, string> = {}
  for (const p of progressRes.data ?? []) progressMap[p.chapter_slug] = p.status

  // chapter_slug → best quiz
  const quizMap: Record<string, { score: number; passed: boolean }> = {}
  for (const q of quizRes.data ?? []) {
    const existing = quizMap[q.chapter_slug]
    if (!existing || q.score > existing.score) quizMap[q.chapter_slug] = { score: q.score, passed: q.passed }
  }

  // `${domain}-${part}` → meilleur résultat agrégé
  const evalMap: Record<string, { score: number; passed: boolean; highestPassedLevel: number; partTitle?: string }> = {}
  for (const e of evalRes.data ?? []) {
    const key = `${e.domain_slug}-${e.part}`
    const existing = evalMap[key]
    const passedLevel = e.passed ? (e.difficulty_level as number) : 0
    if (!existing) {
      evalMap[key] = {
        score: e.score,
        passed: e.passed,
        highestPassedLevel: passedLevel,
        partTitle: e.part_title ?? undefined,
      }
    } else {
      evalMap[key] = {
        score: Math.max(existing.score, e.score),
        passed: existing.passed || e.passed,
        highestPassedLevel: Math.max(existing.highestPassedLevel, passedLevel),
        partTitle: existing.partTitle ?? (e.part_title ?? undefined),
      }
    }
  }

  return (
    <RoadmapClient
      chapters={chapters}
      progressMap={progressMap}
      quizMap={quizMap}
      evalMap={evalMap}
    />
  )
}
