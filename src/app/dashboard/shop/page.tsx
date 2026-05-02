import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/shop')

  const earnedRes = await supabase.from('cash_log').select('cash_earned').eq('user_id', user.id)
  const totalEarned = (earnedRes.data ?? []).reduce((s, r) => s + r.cash_earned, 0)

  // shop_purchases may not exist yet if migration 010 hasn't been run
  let totalSpent = 0
  let ownedItems: { item_id: string; expires_at: string | null; purchased_at: string }[] = []
  try {
    const [spentRes, purchasesRes] = await Promise.all([
      supabase.from('shop_purchases').select('cash_spent').eq('user_id', user.id),
      supabase.from('shop_purchases')
        .select('item_id, expires_at, purchased_at')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false }),
    ])
    totalSpent = (spentRes.data ?? []).reduce((s, r) => s + r.cash_spent, 0)
    ownedItems = purchasesRes.data ?? []
  } catch {
    // table not yet created — treat as 0 spent
  }

  const balance = totalEarned - totalSpent

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-black text-gray-800">Boutique</div>
          <div className="text-xs text-gray-400 mt-0.5">Dépensez votre Cash Game</div>
        </div>
      </div>

      <ShopClient initialBalance={balance} ownedItems={ownedItems} />
    </div>
  )
}
