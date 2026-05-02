import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { syncAchievements } from '@/lib/achievements-sync'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const newlyUnlocked = await syncAchievements(supabase as Parameters<typeof syncAchievements>[0], user.id)
    return NextResponse.json({ newly_unlocked: newlyUnlocked })
  } catch (err) {
    console.error('Achievement sync error:', err)
    return NextResponse.json({ newly_unlocked: [] })
  }
}
