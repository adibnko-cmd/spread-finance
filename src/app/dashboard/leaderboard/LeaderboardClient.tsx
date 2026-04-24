'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevel } from '@/types'

interface LeaderboardEntry {
  id: string
  name: string
  initials: string
  plan: string
  totalXp: number
  weekXp: number
  level: number
  title: string
}

const RANK_STYLES = [
  { bg: '#FFF8E1', border: '#FFC13D', text: '#b37700', medal: '🥇' },
  { bg: '#F5F5F5', border: '#C0C0C0', text: '#666',    medal: '🥈' },
  { bg: '#FFF0E8', border: '#CD7F32', text: '#7a4520', medal: '🥉' },
]

interface Props {
  currentUserId: string
  initialLeaderboard: LeaderboardEntry[]
  initialWeekly: LeaderboardEntry[]
}

export function LeaderboardClient({ currentUserId, initialLeaderboard, initialWeekly }: Props) {
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [weekly, setWeekly]           = useState(initialWeekly)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [pulse, setPulse]             = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    const supabase = createClient()

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

    const buildEntry = (p: { id: string; first_name?: string; last_name?: string; plan: string }) => {
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

    const newLeaderboard = (profiles ?? [])
      .map(buildEntry)
      .filter(u => u.totalXp > 0)
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 50)

    const newWeekly = (profiles ?? [])
      .map(buildEntry)
      .filter(u => u.weekXp > 0)
      .sort((a, b) => b.weekXp - a.weekXp)
      .slice(0, 20)

    setLeaderboard(newLeaderboard)
    setWeekly(newWeekly)
    setLastRefresh(new Date())
    setPulse(true)
    setTimeout(() => setPulse(false), 1000)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Abonnement temps réel sur les nouveaux XP
    const channel = supabase
      .channel('xp_leaderboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xp_log' }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchLeaderboard])

  const currentUserRank = leaderboard.findIndex(u => u.id === currentUserId) + 1
  const currentUserEntry = leaderboard.find(u => u.id === currentUserId)

  return (
    <div className="p-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-black text-gray-800">Classement</div>
            {/* Indicateur temps réel */}
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${pulse ? 'bg-green-400' : 'bg-green-500'} transition-all`}
                style={{ boxShadow: pulse ? '0 0 6px #36D399' : 'none' }} />
              <span className="text-[9px] text-gray-400 font-semibold">LIVE</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {lastRefresh ? `Mis à jour ${lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Communauté Spread Finance'}
          </div>
        </div>
        {currentUserRank > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
            <span className="text-xs font-bold text-blue-700">Votre rang</span>
            <span className="text-sm font-black text-blue-800">#{currentUserRank}</span>
          </div>
        )}
      </div>

      {/* Podium top 3 */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((u, pos) => {
            const rank = pos === 1 ? 0 : pos === 0 ? 1 : 2
            const heights = [56, 72, 44]
            const sizes = ['w-12 h-12 text-sm', 'w-14 h-14 text-base', 'w-12 h-12 text-sm']
            const rs = RANK_STYLES[rank]
            return (
              <div key={u.id} className="flex flex-col items-center flex-1">
                <div className={`${sizes[pos]} rounded-2xl flex items-center justify-center font-black text-white mb-2 ${rank === 0 ? 'ring-2 ring-yellow-400' : ''}`}
                  style={{ background: u.id === currentUserId ? '#3183F7' : '#9CA3AF' }}>
                  {u.initials}
                </div>
                <div className="text-[10px] font-bold text-gray-700 text-center truncate w-full">{u.name.split(' ')[0]}</div>
                <div className="text-[10px] font-bold" style={{ color: rs.text }}>{rank === 0 ? u.totalXp.toLocaleString() : u.totalXp.toLocaleString()} XP</div>
                <div className="w-full mt-1 rounded-t-lg flex items-center justify-center text-xl"
                  style={{ height: heights[pos], background: rs.bg, border: `1.5px solid ${rs.border}` }}>
                  {rs.medal}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grille global + semaine */}
      <div className="grid grid-cols-2 gap-3">
        {/* Global */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Classement global</div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
            {leaderboard.map((u, i) => {
              const isMe = u.id === currentUserId
              const rs   = i < 3 ? RANK_STYLES[i] : null
              return (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none', background: isMe ? '#EBF2FF' : rs?.bg ?? '#fff' }}>
                  <div className="w-6 text-center text-xs font-black flex-shrink-0"
                    style={{ color: rs?.text ?? (isMe ? '#3183F7' : '#9CA3AF') }}>
                    {rs ? rs.medal : `#${i + 1}`}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: isMe ? '#3183F7' : '#9CA3AF' }}>
                    {u.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">
                      {u.name}{isMe && <span className="text-blue-500 ml-1">(vous)</span>}
                    </div>
                    <div className="text-[9px] text-gray-400">Niv. {u.level} · {u.title}</div>
                  </div>
                  <div className="text-[11px] font-bold text-gray-700 flex-shrink-0">
                    {u.totalXp.toLocaleString()}<span className="text-[9px] text-gray-400 ml-0.5">XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Semaine */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cette semaine</div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
            {weekly.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-2xl mb-2">🌱</div>
                <div className="text-xs text-gray-400">Aucune activité cette semaine</div>
              </div>
            ) : weekly.map((u, i) => {
              const isMe = u.id === currentUserId
              const rs   = i < 3 ? RANK_STYLES[i] : null
              return (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none', background: isMe ? '#EBF2FF' : rs?.bg ?? '#fff' }}>
                  <div className="w-6 text-center text-xs font-black flex-shrink-0"
                    style={{ color: rs?.text ?? (isMe ? '#3183F7' : '#9CA3AF') }}>
                    {rs ? rs.medal : `#${i + 1}`}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: isMe ? '#3183F7' : '#9CA3AF' }}>
                    {u.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">
                      {u.name}{isMe && <span className="text-blue-500 ml-1">(vous)</span>}
                    </div>
                    <div className="text-[9px] text-gray-400">Niv. {u.level}</div>
                  </div>
                  <div className="text-[11px] font-bold text-green-600 flex-shrink-0">
                    +{u.weekXp.toLocaleString()}<span className="text-[9px] text-gray-400 ml-0.5">XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats recap */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Membres actifs', value: leaderboard.length, sub: 'avec du XP', color: '#3183F7' },
          { label: 'Votre rang', value: currentUserRank > 0 ? `#${currentUserRank}` : '—', sub: 'classement global', color: '#A855F7' },
          { label: 'Votre XP', value: (currentUserEntry?.totalXp ?? 0).toLocaleString(), sub: 'points accumulés', color: '#36D399' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-[11px] font-bold text-gray-700">{label}</div>
            <div className="text-[10px] text-gray-400">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
