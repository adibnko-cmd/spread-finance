'use client'

import { useState, useEffect, useCallback } from 'react'

interface LikeButtonProps {
  contentType: 'chapter' | 'article'
  contentSlug: string
  isAuthenticated: boolean
}

export function LikeButton({ contentType, contentSlug, isAuthenticated }: LikeButtonProps) {
  const [count,   setCount]   = useState(0)
  const [liked,   setLiked]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/likes?slug=${contentSlug}&type=${contentType}`)
      .then(r => r.json())
      .then(d => { setCount(d.count ?? 0); setLiked(d.liked ?? false) })
      .catch(() => {})
  }, [contentSlug, contentType])

  const toggle = useCallback(async () => {
    if (!isAuthenticated || loading) return
    setLoading(true)
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(c => prevLiked ? c - 1 : c + 1)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_slug: contentSlug }),
      })
      if (!res.ok) { setLiked(prevLiked); setCount(prevCount) }
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }, [contentType, contentSlug, isAuthenticated, liked, count, loading])

  return (
    <button
      onClick={isAuthenticated ? toggle : undefined}
      disabled={loading}
      title={!isAuthenticated ? 'Connectez-vous pour liker' : liked ? 'Retirer mon like' : 'Liker ce contenu'}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
      style={{
        border: `1.5px solid ${liked ? '#3183F7' : '#E8E8E8'}`,
        background: liked ? '#EBF2FF' : '#fff',
        color: liked ? '#3183F7' : '#9CA3AF',
        cursor: isAuthenticated ? 'pointer' : 'default',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill={liked ? '#3183F7' : 'none'} stroke={liked ? '#3183F7' : 'currentColor'} strokeWidth="1.4">
        <path d="M7.5 13C4.5 10.5 1.5 8.3 1.5 5.5a3 3 0 0 1 6-0 3 3 0 0 1 6 0c0 2.8-3 5-6 7.5z" strokeLinejoin="round"/>
      </svg>
      <span className="text-[10px] font-semibold hidden sm:inline">
        {count > 0 ? count : 'Like'}
      </span>
    </button>
  )
}
