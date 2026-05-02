import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { SHOP_ITEMS } from '@/lib/shop/items'

const purchaseSchema = z.object({
  item_id: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = purchaseSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const item = SHOP_ITEMS.find(i => i.id === parsed.data.item_id)
  if (!item) return NextResponse.json({ error: 'Item introuvable' }, { status: 404 })

  // Calculer le solde disponible
  const earnedRes = await supabase.from('cash_log').select('cash_earned').eq('user_id', user.id)
  const totalEarned = (earnedRes.data ?? []).reduce((s, r) => s + r.cash_earned, 0)
  let totalSpent = 0
  try {
    const spentRes = await supabase.from('shop_purchases').select('cash_spent').eq('user_id', user.id)
    totalSpent = (spentRes.data ?? []).reduce((s, r) => s + r.cash_spent, 0)
  } catch { /* table not yet migrated */ }
  const balance = totalEarned - totalSpent

  if (balance < item.price) {
    return NextResponse.json({ error: 'Solde insuffisant', balance }, { status: 402 })
  }

  const expiresAt = item.durationH
    ? new Date(Date.now() + item.durationH * 3_600_000).toISOString()
    : null

  const { error } = await supabase.from('shop_purchases').insert({
    user_id:    user.id,
    item_id:    item.id,
    cash_spent: item.price,
    expires_at: expiresAt,
    metadata:   { name: item.name, category: item.category },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success:     true,
    new_balance: balance - item.price,
    item_id:     item.id,
    expires_at:  expiresAt,
  })
}
