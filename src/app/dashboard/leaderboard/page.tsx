import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLevel } from '@/types'
import { LeaderboardClient } from './LeaderboardClient'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/leaderboard')

  const [{ data: xpData }, { data: profiles }] = await Promise.all([
    supabase.from('xp_log').select('user_id, xp_earned, earned_at'),
    supabase.from('profiles').select('id, first_name, last_name, plan'),
  ])

  const xpByUser: Record<string, number> = {}
  for (const row of xpData ?? []) {
    xpByUser[row.user_id] = (xpByUser[row.user_id] ?? 0) + row.xp_earned
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const weeklyByUser: Record<string, number> = {}
  for (const row of (xpData ?? []).filter(r => r.earned_at >= weekAgo)) {
    weeklyByUser[row.user_id] = (weeklyByUser[row.user_id] ?? 0) + row.xp_earned
  }

  const buildEntry = (p: { id: string; first_name?: string | null; last_name?: string | null; plan: string }) => {
    const totalXp = xpByUser[p.id] ?? 0
    const { level, title } = getLevel(totalXp)
    return {
      id: p.id,
      name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Anonyme',
      initials: `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || '?',
      plan: p.plan,
      totalXp,
      weekXp: weeklyByUser[p.id] ?? 0,
      level,
      title,
    }
  }

  const initialLeaderboard = (profiles ?? [])
    .map(buildEntry)
    .filter(u => u.totalXp > 0)
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, 50)

  const initialWeekly = (profiles ?? [])
    .map(buildEntry)
    .filter(u => u.weekXp > 0)
    .sort((a, b) => b.weekXp - a.weekXp)
    .slice(0, 20)

  return (
    <LeaderboardClient
      currentUserId={user.id}
      initialLeaderboard={initialLeaderboard}
      initialWeekly={initialWeekly}
    />
  )
}
