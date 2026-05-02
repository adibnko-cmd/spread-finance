'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type DomainKey = 'all' | 'finance' | 'maths' | 'dev' | 'pm' | 'ml' | 'general'

const DOMAINS = [
  { key: 'all',     label: 'Tous',    color: '#1C1C2E' },
  { key: 'finance', label: 'Finance', color: '#3183F7' },
  { key: 'maths',   label: 'Maths',   color: '#A855F7' },
  { key: 'dev',     label: 'Dev',     color: '#1a5fc8' },
  { key: 'pm',      label: 'PM',      color: '#FFC13D' },
  { key: 'ml',      label: 'ML',      color: '#F56751' },
  { key: 'general', label: 'Général', color: '#6B7280' },
] as const

interface Thread {
  id: string; domain: string; title: string; content: string
  is_pinned: boolean; is_locked: boolean
  vote_count: number; post_count: number
  last_activity_at: string; created_at: string
  authorName: string
}

interface Props { threads: Thread[]; currentUserId: string }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'maintenant'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}j`
  return `${Math.floor(days / 7)} sem`
}

function domainColor(d: string) {
  return DOMAINS.find(x => x.key === d)?.color ?? '#6B7280'
}
function domainLabel(d: string) {
  return DOMAINS.find(x => x.key === d)?.label ?? d
}

export function ForumClient({ threads, currentUserId }: Props) {
  const router = useRouter()
  const [activeDomain, setActiveDomain] = useState<DomainKey>('all')
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ domain: 'general', title: '', content: '' })
  const [submitting, setSubmitting]     = useState(false)
  const [formError, setFormError]       = useState('')

  const filtered = activeDomain === 'all'
    ? threads
    : threads.filter(t => t.domain === activeDomain)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const res  = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      router.push(`/dashboard/forum/${data.id}`)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  const closeForm = () => { setShowForm(false); setFormError('') }

  return (
    <div className="p-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-black text-gray-800">Forum communauté</div>
          <div className="text-xs text-gray-400 mt-0.5">Posez vos questions, partagez vos insights.</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#3183F7' }}
        >
          + Nouveau sujet
        </button>
      </div>

      {/* Domain filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {DOMAINS.map(d => (
          <button
            key={d.key}
            onClick={() => setActiveDomain(d.key as DomainKey)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              activeDomain === d.key
                ? { background: d.color, color: '#fff' }
                : { background: '#F0F1F3', color: '#6B7280' }
            }
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-2xl mb-2">💬</div>
            <div className="text-sm font-bold text-gray-700 mb-1">Aucun sujet</div>
            <div className="text-xs text-gray-400 mb-4">Soyez le premier à lancer la discussion.</div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#3183F7' }}
            >
              Créer un sujet
            </button>
          </div>
        )}

        {filtered.map(thread => (
          <Link
            key={thread.id}
            href={`/dashboard/forum/${thread.id}`}
            className="block bg-white rounded-2xl p-4 transition-shadow hover:shadow-sm"
            style={{ border: '1.5px solid #E8E8E8' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-1 h-full self-stretch">
                <div className="w-1 h-8 rounded-full mt-0.5" style={{ background: domainColor(thread.domain) }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${domainColor(thread.domain)}18`, color: domainColor(thread.domain) }}
                  >
                    {domainLabel(thread.domain)}
                  </span>
                  {thread.is_pinned && <span className="text-[10px] text-amber-500 font-semibold">📌 Épinglé</span>}
                  {thread.is_locked && <span className="text-[10px] text-gray-400">🔒 Fermé</span>}
                </div>
                <div className="text-sm font-semibold text-gray-800 line-clamp-1">{thread.title}</div>
                <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                  {thread.content.slice(0, 120)}{thread.content.length > 120 ? '…' : ''}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span>{thread.authorName}</span>
                  <span>·</span>
                  <span>{timeAgo(thread.last_activity_at)}</span>
                  <span>·</span>
                  <span>{thread.post_count} réponse{thread.post_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>▲ {thread.vote_count}</span>
                </div>
              </div>
              <svg className="flex-shrink-0 text-gray-300 mt-1" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 10l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* New thread modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,28,46,.6)' }}
          onClick={e => e.target === e.currentTarget && closeForm()}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-black text-gray-800">Nouveau sujet</div>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Domaine</label>
                <select
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  {DOMAINS.filter(d => d.key !== 'all').map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Comment calculer la VaR d'un portefeuille ?"
                  minLength={5} maxLength={200} required
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 placeholder-gray-300 outline-none"
                  style={{ border: '1.5px solid #E8E8E8' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Contenu
                  <span className="text-gray-300 font-normal ml-1">({form.content.length}/5000)</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Décrivez votre question ou sujet en détail…"
                  minLength={10} maxLength={5000} required rows={5}
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 placeholder-gray-300 outline-none resize-none"
                  style={{ border: '1.5px solid #E8E8E8' }}
                />
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button" onClick={closeForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: '#3183F7' }}
                >
                  {submitting ? 'Publication…' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
