import type { SupabaseClient } from '@supabase/supabase-js'
import { computeAchievements, ACHIEVEMENT_CASH } from './achievements'

type SyncResult = { id: string; icon: string; title: string; cash: number }[]

export async function syncAchievements(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncResult> {
  const [xpRes, progressRes, quizRes, badgesRes, activityRes] = await Promise.all([
    supabase.from('xp_log').select('xp_earned').eq('user_id', userId),
    supabase.from('chapter_progress').select('status, domain_slug').eq('user_id', userId),
    supabase.from('quiz_results').select('passed, score, quiz_level').eq('user_id', userId),
    supabase.from('user_badges').select('badge_key').eq('user_id', userId),
    supabase.from('activity_log').select('created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(90),
  ])

  const totalXp = ((xpRes.data ?? []) as { xp_earned: number }[])
    .reduce((s, r) => s + r.xp_earned, 0)

  const progress     = (progressRes.data ?? []) as { status: string; domain_slug: string }[]
  const quizResults  = (quizRes.data ?? []) as { passed: boolean; score: number; quiz_level: number }[]
  const unlockedKeys = new Set(((badgesRes.data ?? []) as { badge_key: string }[]).map(b => b.badge_key))

  const chaptersValidated = progress.filter(p => p.status === 'validated' || p.status === 'completed').length
  const chaptersSeen      = progress.filter(p => p.status !== 'not_started').length
  const domainsActive     = new Set(progress.filter(p => p.status !== 'not_started').map(p => p.domain_slug)).size
  const quizCompleted     = quizResults.filter(r => r.passed).length
  const perfectScores     = quizResults.filter(r => r.score === 100).length
  const level3Quizzes     = quizResults.filter(r => r.quiz_level === 3 && r.passed).length

  // Calcule le streak depuis activity_log
  const days = [...new Set(
    ((activityRes.data ?? []) as { created_at: string }[]).map(a => a.created_at.slice(0, 10))
  )]
  let streakDays = 0
  if (days.length > 0) {
    const today     = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    if (days[0] === today || days[0] === yesterday) {
      let check = days[0]
      for (const day of days) {
        if (day === check) {
          streakDays++
          const d = new Date(check)
          d.setDate(d.getDate() - 1)
          check = d.toISOString().slice(0, 10)
        } else if (day < check) break
      }
    }
  }

  const achievements = computeAchievements({
    totalXp, chaptersValidated, chaptersSeen,
    quizCompleted, perfectScores, level3Quizzes,
    streakDays, domainsActive,
  })

  const newlyUnlocked = achievements.filter(a => a.unlocked && !unlockedKeys.has(a.id))
  if (newlyUnlocked.length === 0) return []

  for (const a of newlyUnlocked) {
    const cash = ACHIEVEMENT_CASH[a.id] ?? 0
    await supabase.from('user_badges').upsert(
      { user_id: userId, badge_key: a.id, badge_name: a.title },
      { onConflict: 'user_id,badge_key', ignoreDuplicates: true },
    )
    if (cash > 0) {
      await supabase.from('cash_log').insert({
        user_id:     userId,
        source_type: 'achievement',
        source_id:   a.id,
        cash_earned: cash,
      })
    }
  }

  return newlyUnlocked.map(a => ({
    id:    a.id,
    icon:  a.icon,
    title: a.title,
    cash:  ACHIEVEMENT_CASH[a.id] ?? 0,
  }))
}
