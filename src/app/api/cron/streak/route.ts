// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Cron : Bonus streak journalier
// POST /api/cron/streak — appelé chaque jour à 01:00 UTC
// Sécurisé par CRON_SECRET en header Authorization
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function getDateStr(date: Date) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function POST(request: NextRequest) {
  // Vérification du secret cron
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Service role pour accéder à tous les users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = getDateStr(new Date())
  const yesterday = getDateStr(new Date(Date.now() - 86400_000))

  // Récupérer tous les users ayant eu de l'activité hier
  const { data: activeYesterday } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', `${yesterday}T00:00:00Z`)
    .lt('created_at', `${today}T00:00:00Z`)

  if (!activeYesterday?.length) {
    return NextResponse.json({ awarded: 0, message: 'Aucune activité hier' })
  }

  const userIds = [...new Set(activeYesterday.map(r => r.user_id))]
  let awarded = 0
  const errors: string[] = []

  for (const userId of userIds) {
    // Vérifier si le bonus streak a déjà été attribué aujourd'hui
    const { count } = await supabase
      .from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source_type', 'daily_streak')
      .gte('earned_at', `${today}T00:00:00Z`)

    if ((count ?? 0) > 0) continue

    // Calculer la longueur du streak pour ajuster le bonus (max 3x)
    const streakLength = await computeStreak(supabase, userId, yesterday)
    const bonusXp = Math.min(20 + (streakLength - 1) * 5, 40) // 20 XP base, +5/jour, max 40

    const bonusCash = Math.min(2 + (streakLength - 1), 5) // 2€ base, +1€/jour, max 5€

    const [{ error }] = await Promise.all([
      supabase.from('xp_log').insert({
        user_id:     userId,
        source_type: 'daily_streak',
        source_id:   today,
        xp_earned:   bonusXp,
        earned_at:   new Date().toISOString(),
      }),
      supabase.from('cash_log').insert({
        user_id:     userId,
        source_type: 'daily_streak',
        source_id:   today,
        cash_earned: bonusCash,
      }),
    ])

    if (error) {
      errors.push(`${userId}: ${error.message}`)
      continue
    }

    // Logger l'activité streak
    await supabase.from('activity_log').insert({
      user_id:      userId,
      action_type:  'xp_earned',
      target_type:  'chapter',
      target_slug:  'daily_streak',
      target_title: `Bonus streak — +${bonusXp} XP`,
      metadata:     { xp: bonusXp, cash: bonusCash, streak_days: streakLength },
    })

    awarded++
  }

  return NextResponse.json({
    awarded,
    total_checked: userIds.length,
    errors: errors.length > 0 ? errors : undefined,
    date: today,
  })
}

async function computeStreak(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  startDate: string
): Promise<number> {
  const { data } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(90)

  const days = [...new Set(((data ?? []) as { created_at: string }[]).map(a => getDateStr(new Date(a.created_at))))]
  let count = 0
  let check = startDate

  for (const day of days) {
    if (day === check) {
      count++
      const d = new Date(check)
      d.setDate(d.getDate() - 1)
      check = getDateStr(d)
    } else if (day < check) {
      break
    }
  }

  return count
}
