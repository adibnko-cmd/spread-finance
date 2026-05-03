'use client'

import { useState } from 'react'

interface Member {
  user_id:    string
  role:       'admin' | 'member'
  joined_at:  string
  first_name: string | null
  last_name:  string | null
  email:      string
  plan:       string
}

interface Props {
  members:   Member[]
  seats:     number
  usedSeats: number
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(m: Member): string {
  return [(m.first_name?.[0] ?? ''), (m.last_name?.[0] ?? '')].join('').toUpperCase() || '?'
}

function fullName(m: Member): string {
  return [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Utilisateur'
}

export function CollaborateursClient({ members: initial, seats, usedSeats }: Props) {
  const [members, setMembers]   = useState<Member[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res  = await fetch('/api/enterprise/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: 'member' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setMembers(prev => [data, ...prev])
      setEmail('')
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Retirer ce collaborateur ?')) return
    setRemoving(userId)
    const res = await fetch('/api/enterprise/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) setMembers(prev => prev.filter(m => m.user_id !== userId))
    setRemoving(null)
  }

  const remaining = seats - members.length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-black text-gray-900">Collaborateurs</div>
          <div className="text-sm text-gray-400 mt-0.5">
            Gérez les accès de votre équipe à la plateforme.
          </div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          disabled={remaining <= 0}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: '#1C1C2E' }}
          title={remaining <= 0 ? 'Limite de sièges atteinte' : ''}
        >
          + Inviter un collaborateur
        </button>
      </div>

      {/* Sièges */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 mb-1">Sièges utilisés</div>
            <div className="text-2xl font-black text-gray-900">
              {members.length} <span className="text-base font-normal text-gray-400">/ {seats}</span>
            </div>
          </div>
          <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min((members.length / Math.max(seats, 1)) * 100, 100)}%`, background: remaining <= 1 ? '#F56751' : '#3183F7' }}
            />
          </div>
          <div className="text-xs font-semibold" style={{ color: remaining <= 1 ? '#F56751' : '#36D399' }}>
            {remaining} disponible{remaining !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Form invitation */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1.5px solid #3183F740' }}>
          <div className="text-sm font-bold text-gray-800 mb-3">Inviter par email</div>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@collaborateur.com"
              required
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none"
              style={{ border: '1.5px solid #E8E8E8', background: '#FAFAFA' }}
            />
            <button
              type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
              style={{ background: '#3183F7' }}
            >
              {saving ? 'Ajout…' : 'Inviter'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError('') }}
              className="px-3 py-2.5 rounded-xl text-xs text-gray-400 hover:bg-gray-100">
              Annuler
            </button>
          </form>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <p className="text-[10px] text-gray-400 mt-2">
            L&apos;utilisateur doit déjà avoir un compte Spread Finance. Son plan sera automatiquement mis à jour.
          </p>
        </div>
      )}

      {/* Liste membres */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">👥</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucun collaborateur</div>
          <div className="text-xs text-gray-400 mb-4">Invitez des membres de votre équipe pour leur donner accès à la plateforme.</div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#1C1C2E' }}>
            Inviter un collaborateur
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F1F3' }}>
                {['Collaborateur', 'Email', 'Rôle', 'Depuis', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.user_id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F5F6F8' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                        style={{ background: '#1C1C2E' }}>
                        {initials(m)}
                      </div>
                      <div className="text-xs font-semibold text-gray-800">{fullName(m)}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs text-gray-500">{m.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: m.role === 'admin' ? '#EBF2FF' : '#F5F6F8', color: m.role === 'admin' ? '#3183F7' : '#6B7280' }}>
                      {m.role === 'admin' ? 'Admin' : 'Membre'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs text-gray-400">{formatDate(m.joined_at)}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={removing === m.user_id}
                      className="text-[10px] font-semibold text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                    >
                      {removing === m.user_id ? 'Retrait…' : 'Retirer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
