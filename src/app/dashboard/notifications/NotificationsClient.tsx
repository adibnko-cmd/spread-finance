'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Notification {
  id:         string
  type:       string
  title:      string
  body:       string | null
  link:       string | null
  read_at:    string | null
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  forum_reply:     '💬',
  forum_vote:      '▲',
  badge_unlocked:  '🏆',
  new_content:     '📚',
  streak_reminder: '🔥',
  competition:     '🏅',
  other:           '🔔',
}

const TYPE_LABEL: Record<string, string> = {
  forum_reply:     'Réponse forum',
  forum_vote:      'Vote',
  badge_unlocked:  'Badge',
  new_content:     'Nouveau contenu',
  streak_reminder: 'Série',
  competition:     'Compétition',
  other:           'Notification',
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo   = new Date(today.getTime() - 7 * 86400000)

  const groups: Record<string, Notification[]> = {
    "Aujourd'hui": [],
    'Hier':        [],
    'Cette semaine':[],
    'Plus ancien': [],
  }

  for (const n of notifications) {
    const d = new Date(n.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day >= today)       groups["Aujourd'hui"].push(n)
    else if (day >= yesterday) groups['Hier'].push(n)
    else if (day >= weekAgo)   groups['Cette semaine'].push(n)
    else                       groups['Plus ancien'].push(n)
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

function timeLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function dateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [markingAll, setMarkingAll]       = useState(false)

  const unread = notifications.filter(n => !n.read_at).length

  async function markAllRead() {
    if (unread === 0) return
    setMarkingAll(true)
    setNotifications(ns => ns.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    await fetch('/api/notifications/read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    })
    setMarkingAll(false)
  }

  const groups = groupByDate(notifications)

  return (
    <div className="p-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-black text-gray-800 mb-1">Notifications</div>
          <div className="text-xs text-gray-400">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu'}
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-colors hover:bg-gray-100 disabled:opacity-50"
            style={{ border: '1.5px solid #E8E8E8', color: '#374151', background: '#fff' }}
          >
            {markingAll ? '…' : 'Tout marquer comme lu'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucune notification</div>
          <div className="text-xs text-gray-400">Participez au forum et progressez pour recevoir des notifications.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{label}</div>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
                {items.map((n, idx) => {
                  const isUnread = !n.read_at
                  const content = (
                    <div
                      className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                      style={{
                        background:   isUnread ? '#F7F9FF' : '#fff',
                        borderBottom: idx < items.length - 1 ? '1px solid #F0F1F3' : 'none',
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: isUnread ? '#EBF2FF' : '#F5F6F8' }}
                      >
                        {TYPE_ICON[n.type] ?? '🔔'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</div>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#3183F7' }} />
                          )}
                        </div>
                        {n.body && (
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#F5F6F8', color: '#9CA3AF' }}
                          >
                            {TYPE_LABEL[n.type] ?? 'Notification'}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {label === "Aujourd'hui" || label === 'Hier'
                              ? timeLabel(n.created_at)
                              : dateLabel(n.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )

                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read_at: x.read_at ?? new Date().toISOString() } : x))}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
