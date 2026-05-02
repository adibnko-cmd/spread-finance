'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewsItem {
  id:           string
  title:        string
  content:      string
  type:         string
  emoji:        string | null
  link:         string | null
  is_published: boolean
  published_at: string | null
  created_at:   string
}

const TYPE_OPTIONS = [
  { value: 'feature',     label: 'Nouvelle fonctionnalité' },
  { value: 'content',     label: 'Nouveau contenu'         },
  { value: 'event',       label: 'Événement'               },
  { value: 'maintenance', label: 'Maintenance'             },
  { value: 'general',     label: 'Annonce générale'        },
]

const TYPE_COLOR: Record<string, string> = {
  feature: '#3183F7', content: '#A855F7', event: '#FFC13D',
  maintenance: '#F56751', general: '#6B7280',
}

const EMPTY_FORM = { title: '', content: '', type: 'general', emoji: '📢', link: '', is_published: false }

export function NewsManager({ items: initial }: { items: NewsItem[] }) {
  const router = useRouter()
  const [items, setItems]           = useState<NewsItem[]>(initial)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          link:         form.link || null,
          published_at: form.is_published ? new Date().toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setItems(prev => [data, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(id: string, current: boolean) {
    const res = await fetch('/api/admin/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        is_published: !current,
        published_at: !current ? new Date().toISOString() : null,
      }),
    })
    if (!res.ok) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_published: !current } : i))
  }

  async function deleteItem(id: string) {
    if (!confirm('Supprimer cette actualité ?')) return
    const res = await fetch('/api/admin/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: '#3183F7' }}
        >
          + Nouvelle actualité
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.4)' }}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-black text-gray-800">Nouvelle actualité</div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs text-gray-800 bg-gray-50 outline-none" style={{ border: '1.5px solid #E8E8E8' }}>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Emoji</label>
                  <input type="text" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    maxLength={4} placeholder="📢"
                    className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none" style={{ border: '1.5px solid #E8E8E8' }}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Titre</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required placeholder="Titre de l'actualité"
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none" style={{ border: '1.5px solid #E8E8E8' }}/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contenu</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required rows={3} placeholder="Description de la nouveauté…"
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none resize-none" style={{ border: '1.5px solid #E8E8E8' }}/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Lien (optionnel)</label>
                <input type="url" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none" style={{ border: '1.5px solid #E8E8E8' }}/>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 rounded"/>
                Publier immédiatement
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: '#3183F7' }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-sm text-gray-400">Aucune actualité créée.</div>
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{item.emoji ?? '📢'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-800">{item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: `${TYPE_COLOR[item.type] ?? '#6B7280'}18`, color: TYPE_COLOR[item.type] ?? '#6B7280' }}>
                    {TYPE_OPTIONS.find(o => o.value === item.type)?.label ?? item.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublish(item.id, item.is_published)}
                  className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors"
                  style={item.is_published
                    ? { background: '#DCFCE7', color: '#16A34A' }
                    : { background: '#F5F6F8', color: '#6B7280' }}>
                  {item.is_published ? '● Publié' : '○ Brouillon'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="text-[10px] px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 font-semibold transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
