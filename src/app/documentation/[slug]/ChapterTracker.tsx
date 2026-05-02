'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  chapterSlug: string
  chapterTitle?: string
  domainSlug: string
  initialStatus: string
}

export default function ChapterTracker({ chapterSlug, chapterTitle, domainSlug, initialStatus }: Props) {
  const startTime   = useRef(Date.now())
  const lastSave    = useRef(Date.now())
  const scrollPct   = useRef(0)
  const [status, setStatus] = useState(initialStatus)

  const save = async (overrideStatus?: string) => {
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapter_slug:       chapterSlug,
        chapter_title:      chapterTitle,
        domain_slug:        domainSlug,
        status:             overrideStatus ?? (status === 'not_started' ? 'in_progress' : undefined),
        scroll_percent:     scrollPct.current,
        time_spent_seconds: timeSpent,
      }),
    })
  }

  // Marquer comme in_progress à l'ouverture
  useEffect(() => {
    if (initialStatus === 'not_started' || initialStatus === 'in_progress') {
      save('in_progress')
      setStatus('in_progress')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tracker le scroll + auto-save toutes les 30s
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      scrollPct.current = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100) || 0
      if (Date.now() - lastSave.current > 30_000) {
        save()
        lastSave.current = Date.now()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Sauvegarder en quittant la page
  useEffect(() => {
    return () => { save() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markCompleted = async () => {
    await save('completed')
    setStatus('completed')
  }

  if (status === 'completed' || status === 'validated') {
    return (
      <div
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
        style={{ background: '#E6FAF3', color: '#0d7a56' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="#0d7a56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Lu !
      </div>
    )
  }

  return (
    <button
      onClick={markCompleted}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
      style={{ background: '#292929', color: '#fff' }}
    >
      Marquer comme lu
    </button>
  )
}
