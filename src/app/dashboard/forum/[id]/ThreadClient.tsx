'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DOMAIN_COLOR: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8',
  pm: '#FFC13D', ml: '#F56751', general: '#6B7280',
}
const DOMAIN_LABEL: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev',
  pm: 'PM', ml: 'ML', general: 'Général',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'maintenant'
  if (mins < 60) return `il y a ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface ThreadData {
  id: string; domain: string; title: string; content: string
  is_pinned: boolean; is_locked: boolean
  vote_count: number; post_count: number
  created_at: string; user_id: string
  authorName: string; authorPlan: string; hasVoted: boolean
}

interface PostData {
  id: string; content: string; vote_count: number
  is_solution: boolean; created_at: string; updated_at: string
  user_id: string; authorName: string; authorPlan: string; hasVoted: boolean
}

interface Props {
  thread:        ThreadData
  posts:         PostData[]
  currentUserId: string
  isAdmin:       boolean
}

function Avatar({ name, plan }: { name: string; plan: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const bg = plan === 'platinum' ? '#A855F7' : plan === 'premium' ? '#3183F7' : '#E8E8E8'
  const color = plan === 'free' ? '#999' : '#fff'
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{ background: bg, color }}>
      {initials}
    </div>
  )
}

export function ThreadClient({ thread, posts: initialPosts, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const [posts, setPosts]                   = useState<PostData[]>(initialPosts)
  const [threadVote, setThreadVote]         = useState({ count: thread.vote_count, voted: thread.hasVoted })
  const [reply, setReply]                   = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [replyError, setReplyError]         = useState('')
  const [modLoading, setModLoading]         = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  async function toggleVote(type: 'thread' | 'post', id: string) {
    const res = await fetch('/api/forum/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: type, target_id: id }),
    })
    if (!res.ok) return
    const { voted } = await res.json()
    if (type === 'thread') {
      setThreadVote(v => ({ count: v.count + (voted ? 1 : -1), voted }))
    } else {
      setPosts(ps => ps.map(p => p.id === id
        ? { ...p, vote_count: p.vote_count + (voted ? 1 : -1), hasVoted: voted }
        : p
      ))
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSubmitting(true)
    setReplyError('')
    try {
      const res  = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: thread.id, content: reply.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setPosts(ps => [...ps, { ...data, authorName: 'Vous', authorPlan: 'free', hasVoted: false }])
      setReply('')
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleSolution(postId: string) {
    const res = await fetch('/api/forum/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'post', action: 'solution', id: postId }),
    })
    if (!res.ok) return
    const { is_solution } = await res.json()
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, is_solution } : p))
  }

  async function moderate(entity: 'thread' | 'post', action: string, id: string) {
    setModLoading(true)
    const body: Record<string, string> = { entity, action, id }
    await fetch('/api/forum/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setModLoading(false)
    if (entity === 'thread' && action === 'delete') {
      router.push('/dashboard/forum')
    } else if (entity === 'post' && action === 'delete') {
      setPosts(ps => ps.filter(p => p.id !== id))
    } else {
      router.refresh()
    }
  }

  const color = DOMAIN_COLOR[thread.domain] ?? '#6B7280'
  const isThreadAuthor = thread.user_id === currentUserId

  return (
    <div className="p-5 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard/forum"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Forum
      </Link>

      {/* Thread card */}
      <div className="bg-white rounded-2xl p-5 mb-3" style={{ border: '1.5px solid #E8E8E8' }}>
        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color }}>
            {DOMAIN_LABEL[thread.domain] ?? thread.domain}
          </span>
          {thread.is_pinned && <span className="text-[10px] text-amber-500 font-semibold">📌 Épinglé</span>}
          {thread.is_locked && <span className="text-[10px] text-gray-400 font-semibold">🔒 Fermé</span>}
        </div>

        <h1 className="text-base font-black text-gray-800 mb-3 leading-snug">{thread.title}</h1>

        {/* Author row */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar name={thread.authorName} plan={thread.authorPlan} />
          <div>
            <div className="text-xs font-semibold text-gray-700">{thread.authorName}</div>
            <div className="text-[10px] text-gray-400">{timeAgo(thread.created_at)}</div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.content}</p>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid #F0F1F3' }}>
          <button
            onClick={() => toggleVote('thread', thread.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              threadVote.voted
                ? { background: '#EBF2FF', color: '#3183F7' }
                : { background: '#F5F6F8', color: '#6B7280' }
            }
          >
            ▲ {threadVote.count}
          </button>
          <span className="text-xs text-gray-400">{posts.length} réponse{posts.length !== 1 ? 's' : ''}</span>

          {/* Admin controls */}
          {isAdmin && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => moderate('thread', thread.is_pinned ? 'unpin' : 'pin', thread.id)}
                disabled={modLoading}
                className="text-[10px] px-2 py-1 rounded-lg text-amber-600 hover:bg-amber-50 font-semibold transition-colors"
              >
                {thread.is_pinned ? 'Désépingler' : 'Épingler'}
              </button>
              <button
                onClick={() => moderate('thread', 'lock', thread.id)}
                disabled={modLoading}
                className="text-[10px] px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => { if (confirm('Supprimer ce sujet ?')) moderate('thread', 'delete', thread.id) }}
                disabled={modLoading}
                className="text-[10px] px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 font-semibold transition-colors"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-4"
              style={{
                border: post.is_solution
                  ? '1.5px solid #36D399'
                  : '1.5px solid #E8E8E8',
                background: post.is_solution ? '#F0FDF8' : '#fff',
              }}
            >
              {post.is_solution && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ✓ Solution
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Avatar name={post.authorName} plan={post.authorPlan} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">{post.authorName}</span>
                    <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggleVote('post', post.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={
                        post.hasVoted
                          ? { background: '#EBF2FF', color: '#3183F7' }
                          : { background: '#F5F6F8', color: '#6B7280' }
                      }
                    >
                      ▲ {post.vote_count}
                    </button>
                    {isThreadAuthor && (
                      <button
                        onClick={() => toggleSolution(post.id)}
                        className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors"
                        style={
                          post.is_solution
                            ? { background: '#D1FAE5', color: '#059669' }
                            : { background: '#F5F6F8', color: '#6B7280' }
                        }
                      >
                        {post.is_solution ? '✓ Solution' : 'Marquer solution'}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { if (confirm('Supprimer ce post ?')) moderate('post', 'delete', post.id) }}
                        className="text-[10px] px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 font-semibold transition-colors ml-auto"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {!thread.is_locked ? (
        <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-semibold text-gray-600 mb-3">Répondre</div>
          <form onSubmit={handleReply}>
            <textarea
              ref={replyRef}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Votre réponse…"
              rows={3} minLength={1} maxLength={3000} required
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 placeholder-gray-300 outline-none resize-none"
              style={{ border: '1.5px solid #E8E8E8' }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-gray-300">{reply.length}/3000</span>
              <div className="flex items-center gap-2">
                {replyError && <span className="text-[10px] text-red-500">{replyError}</span>}
                <button
                  type="submit" disabled={submitting || !reply.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: '#3183F7' }}
                >
                  {submitting ? 'Envoi…' : 'Répondre'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-2xl" style={{ border: '1.5px solid #E8E8E8' }}>
          🔒 Ce sujet est fermé — les nouvelles réponses sont désactivées.
        </div>
      )}
    </div>
  )
}
