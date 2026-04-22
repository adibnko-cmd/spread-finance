import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLevel } from '@/types'

export const dynamic = 'force-dynamic'

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

const RANK_STYLES = [
  { bg: '#FFF8E1', border: '#FFC13D', text: '#b37700', medal: '🥇' },
  { bg: '#F5F5F5', border: '#C0C0C0', text: '#666',    medal: '🥈' },
  { bg: '#FFF0E8', border: '#CD7F32', text: '#7a4520', medal: '🥉' },
]

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/leaderboard')

  // Top users by XP — aggregate xp_log par user, join profiles
  const { data: xpData } = await supabase
    .from('xp_log')
    .select('user_id, xp_earned')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, plan')

  // Aggregate XP by user
  const xpByUser: Record<string, number> = {}
  for (const row of xpData ?? []) {
    xpByUser[row.user_id] = (xpByUser[row.user_id] ?? 0) + row.xp_earned
  }

  // Build leaderboard entries
  const leaderboard = (profiles ?? [])
    .map(p => ({
      id:        p.id,
      name:      `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Anonyme',
      initials:  `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || '?',
      plan:      p.plan as string,
      totalXp:   xpByUser[p.id] ?? 0,
      ...getLevel(xpByUser[p.id] ?? 0),
    }))
    .filter(u => u.totalXp > 0)
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, 50)

  const currentUserRank = leaderboard.findIndex(u => u.id === user.id) + 1
  const currentUserEntry = leaderboard.find(u => u.id === user.id)

  // Weekly leaderboard (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: weeklyXp } = await supabase
    .from('xp_log')
    .select('user_id, xp_earned')
    .gte('created_at', weekAgo.toISOString())

  const weeklyByUser: Record<string, number> = {}
  for (const row of weeklyXp ?? []) {
    weeklyByUser[row.user_id] = (weeklyByUser[row.user_id] ?? 0) + row.xp_earned
  }

  const weeklyLeaderboard = (profiles ?? [])
    .map(p => ({
      id:       p.id,
      name:     `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Anonyme',
      initials: `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || '?',
      plan:     p.plan as string,
      weekXp:   weeklyByUser[p.id] ?? 0,
      ...getLevel(xpByUser[p.id] ?? 0),
    }))
    .filter(u => u.weekXp > 0)
    .sort((a, b) => b.weekXp - a.weekXp)
    .slice(0, 20)

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-black text-gray-800">Classement</div>
          <div className="text-xs text-gray-400 mt-0.5">Communauté Spread Finance</div>
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
          {/* 2e place */}
          <div className="flex flex-col items-center flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white mb-2"
              style={{ background: '#9CA3AF' }}
            >
              {leaderboard[1].initials}
            </div>
            <div className="text-[10px] font-bold text-gray-600 text-center truncate w-full">{leaderboard[1].name.split(' ')[0]}</div>
            <div className="text-[10px] text-gray-400">{leaderboard[1].totalXp.toLocaleString()} XP</div>
            <div
              className="w-full mt-1 rounded-t-lg flex items-center justify-center text-lg"
              style={{ height: 56, background: '#F5F5F5', border: '1.5px solid #C0C0C0' }}
            >
              🥈
            </div>
          </div>

          {/* 1re place */}
          <div className="flex flex-col items-center flex-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black text-white mb-2 ring-2 ring-yellow-400"
              style={{ background: '#3183F7' }}
            >
              {leaderboard[0].initials}
            </div>
            <div className="text-[11px] font-bold text-gray-800 text-center truncate w-full">{leaderboard[0].name.split(' ')[0]}</div>
            <div className="text-[10px] text-yellow-600 font-bold">{leaderboard[0].totalXp.toLocaleString()} XP</div>
            <div
              className="w-full mt-1 rounded-t-lg flex items-center justify-center text-xl"
              style={{ height: 72, background: '#FFF8E1', border: '1.5px solid #FFC13D' }}
            >
              🥇
            </div>
          </div>

          {/* 3e place */}
          <div className="flex flex-col items-center flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white mb-2"
              style={{ background: '#CD7F32' }}
            >
              {leaderboard[2].initials}
            </div>
            <div className="text-[10px] font-bold text-gray-600 text-center truncate w-full">{leaderboard[2].name.split(' ')[0]}</div>
            <div className="text-[10px] text-gray-400">{leaderboard[2].totalXp.toLocaleString()} XP</div>
            <div
              className="w-full mt-1 rounded-t-lg flex items-center justify-center text-lg"
              style={{ height: 44, background: '#FFF0E8', border: '1.5px solid #CD7F32' }}
            >
              🥉
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3">

        {/* Classement global */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Classement global</div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">Aucun utilisateur avec du XP</div>
            ) : leaderboard.map((u, i) => {
              const isMe = u.id === user.id
              const rankStyle = i < 3 ? RANK_STYLES[i] : null
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{
                    borderTop: i > 0 ? '1px solid #F5F5F5' : 'none',
                    background: isMe ? '#EBF2FF' : rankStyle?.bg ?? '#fff',
                  }}
                >
                  {/* Rang */}
                  <div className="w-6 text-center text-xs font-black flex-shrink-0"
                    style={{ color: rankStyle?.text ?? (isMe ? '#3183F7' : '#9CA3AF') }}>
                    {rankStyle ? rankStyle.medal : `#${i + 1}`}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: isMe ? '#3183F7' : '#9CA3AF' }}
                  >
                    {u.initials}
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">
                      {u.name}{isMe && <span className="text-blue-500 ml-1">(vous)</span>}
                    </div>
                    <div className="text-[9px] text-gray-400">Niv. {u.level} · {u.title}</div>
                  </div>

                  {/* XP */}
                  <div className="text-[11px] font-bold text-gray-700 flex-shrink-0">
                    {u.totalXp.toLocaleString()}
                    <span className="text-[9px] text-gray-400 ml-0.5">XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Classement semaine */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cette semaine</div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
            {weeklyLeaderboard.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-2xl mb-2">🌱</div>
                <div className="text-xs text-gray-400">Aucune activité cette semaine.<br/>Commencez un quiz pour apparaître !</div>
              </div>
            ) : weeklyLeaderboard.map((u, i) => {
              const isMe = u.id === user.id
              const rankStyle = i < 3 ? RANK_STYLES[i] : null
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{
                    borderTop: i > 0 ? '1px solid #F5F5F5' : 'none',
                    background: isMe ? '#EBF2FF' : rankStyle?.bg ?? '#fff',
                  }}
                >
                  <div className="w-6 text-center text-xs font-black flex-shrink-0"
                    style={{ color: rankStyle?.text ?? (isMe ? '#3183F7' : '#9CA3AF') }}>
                    {rankStyle ? rankStyle.medal : `#${i + 1}`}
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: isMe ? '#3183F7' : '#9CA3AF' }}
                  >
                    {u.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 truncate">
                      {u.name}{isMe && <span className="text-blue-500 ml-1">(vous)</span>}
                    </div>
                    <div className="text-[9px] text-gray-400">Niv. {u.level} · {u.title}</div>
                  </div>
                  <div className="text-[11px] font-bold text-green-600 flex-shrink-0">
                    +{u.weekXp.toLocaleString()}
                    <span className="text-[9px] text-gray-400 ml-0.5">XP</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA si pas d'activité cette semaine */}
          {currentUserEntry && weeklyLeaderboard.every(u => u.id !== user.id) && (
            <div
              className="mt-3 p-3 rounded-xl text-center"
              style={{ background: '#1C1C2E', border: '1.5px solid rgba(255,255,255,.06)' }}
            >
              <div className="text-[11px] text-white/60 mb-2">Vous n&apos;êtes pas encore dans le top cette semaine</div>
              <div className="text-[10px] text-white/30">Faites des quiz pour gagner du XP</div>
            </div>
          )}
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
