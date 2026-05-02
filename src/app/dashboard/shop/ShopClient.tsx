'use client'

import { useState } from 'react'
import { SHOP_ITEMS, type ShopItem } from '@/lib/shop/items'

interface OwnedItem { item_id: string; expires_at: string | null; purchased_at: string }

interface Props {
  initialBalance: number
  ownedItems:     OwnedItem[]
}

export default function ShopClient({ initialBalance, ownedItems }: Props) {
  const [balance, setBalance]   = useState(initialBalance)
  const [loading, setLoading]   = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [filter, setFilter]     = useState<'all' | 'boost' | 'cosmetic'>('all')

  const isOwned = (id: string) => {
    const p = ownedItems.find(o => o.item_id === id)
    if (!p) return false
    if (!p.expires_at) return true
    return new Date(p.expires_at) > new Date()
  }

  const handleBuy = async (item: ShopItem) => {
    if (loading) return
    setLoading(item.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/shop', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ item_id: item.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de l\'achat')
      } else {
        setBalance(json.new_balance)
        setSuccess(`${item.name} acheté !`)
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(null)
    }
  }

  const categories = [
    { key: 'all',      label: 'Tout' },
    { key: 'boost',    label: 'Boosts' },
    { key: 'cosmetic', label: 'Cosmétiques' },
  ] as const

  const filtered = filter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === filter)

  return (
    <div>
      {/* Balance + filtres */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className="px-3 py-1 rounded-full text-[11px] font-bold transition-colors"
              style={{
                background: filter === c.key ? '#FFC13D' : '#f5f5f5',
                color:      filter === c.key ? '#7a4f00' : '#888',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: '#1C1C2E' }}
        >
          <span className="text-sm">💰</span>
          <span className="text-sm font-black" style={{ color: '#FFC13D' }}>{balance.toLocaleString()}</span>
          <span className="text-[10px] text-white/40">cash</span>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold" style={{ background: '#E6FAF3', color: '#0d7a56' }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold" style={{ background: '#FEE9E6', color: '#c0392b' }}>
          {error}
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(item => {
          const owned     = isOwned(item.id)
          const canAfford = balance >= item.price
          const busy      = loading === item.id

          return (
            <div
              key={item.id}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: owned ? '#E6FAF3' : '#fff',
                border:     `1.5px solid ${owned ? '#36D399' : '#E8E8E8'}`,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl leading-none">{item.icon}</span>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: item.category === 'boost' ? '#EBF2FF' : '#F5EBFF',
                    color:      item.category === 'boost' ? '#1a5fc8' : '#7e3af2',
                  }}
                >
                  {item.category === 'boost' ? 'Boost' : 'Cosmétique'}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-800 mb-0.5">{item.name}</div>
                <div className="text-[10px] text-gray-500 leading-snug">{item.description}</div>
                {item.durationH && (
                  <div className="text-[10px] text-gray-400 mt-0.5">Durée : {item.durationH}h</div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1">
                  <span className="text-sm">💰</span>
                  <span className="text-sm font-black" style={{ color: '#FFC13D' }}>{item.price}</span>
                </div>
                {owned ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: '#36D399', color: '#fff' }}>
                    Possédé ✓
                  </span>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || busy}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-opacity"
                    style={{
                      background: canAfford ? '#FFC13D' : '#f0f0f0',
                      color:      canAfford ? '#7a4f00' : '#aaa',
                      cursor:     canAfford ? 'pointer' : 'not-allowed',
                      opacity:    busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? '...' : canAfford ? 'Acheter' : 'Insuffisant'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* How to earn */}
      <div className="mt-6 rounded-xl p-4" style={{ background: '#F9FAFB', border: '1.5px solid #E8E8E8' }}>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Comment gagner du cash ?</div>
        <div className="flex flex-col gap-1.5">
          {[
            ['Quiz Niveau 1 réussi',  '+5 💰'],
            ['Quiz Niveau 2 réussi',  '+10 💰'],
            ['Quiz Niveau 3 réussi',  '+25 💰'],
            ['Streak journalier',      '+2 à +5 💰'],
          ].map(([label, reward]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-600">{label}</span>
              <span className="text-[11px] font-bold" style={{ color: '#FFC13D' }}>{reward}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
