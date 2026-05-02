'use client'

import { useState, useEffect, useRef } from 'react'
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
  forum_reply:    '💬',
  forum_vote:     '▲',
  badge_unlocked: '🏆',
  new_content:    '📚',
  streak_reminder:'🔥',
  competition:    '🏅',
  other:          '🔔',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'maintenant'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}j`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen]                   = useState(false)
  const [loaded, setLoaded]               = useState(false)
  const containerRef                      = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read_at).length

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setNotifications(data); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleOpen() {
    setOpen(o => !o)
    if (!open && unread > 0) {
      // Mark all as read optimistically
      setNotifications(ns => ns.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/10"
        title="Notifications"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2a4.5 4.5 0 0 0-4.5 4.5c0 3-1.5 4-1.5 4h12s-1.5-1-1.5-4A4.5 4.5 0 0 0 8 2z"
            stroke={unread > 0 ? '#3183F7' : 'rgba(255,255,255,.45)'}
            strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          />
          <path d="M9.5 13a1.5 1.5 0 0 1-3 0" stroke={unread > 0 ? '#3183F7' : 'rgba(255,255,255,.45)'} strokeWidth="1.3"/>
        </svg>
        {loaded && unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-black text-white px-0.5"
            style={{ background: '#F56751' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 w-72 rounded-2xl shadow-xl overflow-hidden z-50"
          style={{ background: '#fff', border: '1.5px solid #E8E8E8' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F0F1F3' }}>
            <span className="text-xs font-black text-gray-800">Notifications</span>
            <span className="text-[10px] text-gray-400">{notifications.length} au total</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-2xl mb-1">🔔</div>
                <div className="text-xs text-gray-400">Aucune notification</div>
              </div>
            ) : (
              notifications.map(notif => {
                const inner = (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{
                      background: !notif.read_at ? '#F7F9FF' : '#fff',
                      borderBottom: '1px solid #F0F1F3',
                    }}
                  >
                    <span className="text-base flex-shrink-0">{TYPE_ICON[notif.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 line-clamp-2">{notif.title}</div>
                      {notif.body && (
                        <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{notif.body}</div>
                      )}
                      <div className="text-[9px] text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</div>
                    </div>
                    {!notif.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: '#3183F7' }} />
                    )}
                  </div>
                )
                return notif.link ? (
                  <Link key={notif.id} href={notif.link} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={notif.id}>{inner}</div>
                )
              })
            )}
          </div>

          <div className="px-4 py-2" style={{ borderTop: '1px solid #F0F1F3' }}>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition-colors"
            >
              Voir toutes →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
