'use client'

import { useState } from 'react'

interface AdminUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  plan: 'free' | 'premium' | 'platinum' | 'enterprise'
  account_type: 'individual' | 'enterprise'
  is_admin: boolean
  created_at: string
}

const PLAN_COLORS = { free: '#9CA3AF', premium: '#3183F7', platinum: '#A855F7', enterprise: '#36D399' }

const EMPTY_ENT_FORM = {
  email: '', password: '', first_name: '', last_name: '',
  company_name: '', sector: '', seats: '5', contact_email: '',
}

async function patchUser(id: string, updates: Record<string, unknown>) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(await res.text())
}

export function UsersTable({ users: initial }: { users: AdminUser[] }) {
  const [users, setUsers]       = useState(initial)
  const [search, setSearch]     = useState('')
  const [planFilter, setPlan]   = useState('all')
  const [typeFilter, setType]   = useState('all')
  const [loading, setLoading]   = useState<Set<string>>(new Set())
  const [error, setError]       = useState<string | null>(null)

  // Enterprise creation form
  const [showEntForm, setShowEntForm] = useState(false)
  const [entForm, setEntForm]         = useState(EMPTY_ENT_FORM)
  const [entSaving, setEntSaving]     = useState(false)
  const [entError, setEntError]       = useState<string | null>(null)
  const [entSuccess, setEntSuccess]   = useState<string | null>(null)

  const filtered = users.filter(u => {
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''} ${u.email}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (planFilter !== 'all' && u.plan !== planFilter) return false
    if (typeFilter !== 'all' && u.account_type !== typeFilter) return false
    return true
  })

  async function update(id: string, updates: Partial<AdminUser>) {
    setLoading(s => new Set(s).add(id))
    setError(null)
    try {
      await patchUser(id, updates)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
    } catch {
      setError('Erreur lors de la mise à jour. Réessayez.')
    } finally {
      setLoading(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  async function handleCreateEnterprise(e: React.FormEvent) {
    e.preventDefault()
    setEntSaving(true)
    setEntError(null)
    setEntSuccess(null)

    try {
      const res = await fetch('/api/admin/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entForm, seats: parseInt(entForm.seats) || 5 }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur serveur')
      }
      const newUser: AdminUser = await res.json()
      setUsers(prev => [newUser, ...prev])
      setEntSuccess(`Compte entreprise créé pour ${entForm.email}`)
      setEntForm(EMPTY_ENT_FORM)
      setShowEntForm(false)
    } catch (err) {
      setEntError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setEntSaving(false)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="px-3 py-2 rounded-lg text-xs border outline-none"
          style={{ borderColor: '#E8E8E8', width: 240 }}
        />
        <div className="flex gap-1.5">
          {['all', 'free', 'premium', 'platinum', 'enterprise'].map(p => (
            <button key={p} onClick={() => setPlan(p)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
              style={{ background: planFilter === p ? '#1C1C2E' : '#F5F5F5', color: planFilter === p ? '#fff' : '#666' }}>
              {p === 'all' ? 'Tous' : p}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[['all', 'Tous types'], ['individual', 'Individuel'], ['enterprise', 'Entreprise']].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: typeFilter === v ? '#1C1C2E' : '#F5F5F5', color: typeFilter === v ? '#fff' : '#666' }}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-400">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</span>

        {/* Create enterprise button */}
        <button onClick={() => { setShowEntForm(v => !v); setEntError(null); setEntSuccess(null) }}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: showEntForm ? '#EBF2FF' : '#1C1C2E', color: showEntForm ? '#3183F7' : '#fff' }}>
          🏢 {showEntForm ? 'Fermer' : 'Créer compte entreprise'}
        </button>
      </div>

      {/* Enterprise creation form */}
      {showEntForm && (
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: '1.5px solid #3183F740' }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">🏢</span>
            <div className="text-sm font-black text-gray-900">Nouveau compte entreprise</div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
              style={{ background: '#E6FAF3', color: '#0d7a56' }}>Plan Entreprise</span>
          </div>

          {entError && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: '#FEF0EE', color: '#c0392b' }}>
              {entError}
            </div>
          )}

          <form onSubmit={handleCreateEnterprise}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Colonne 1 : accès */}
              <div className="flex flex-col gap-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accès</div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Email *</label>
                  <input required type="email" value={entForm.email}
                    onChange={e => setEntForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="contact@entreprise.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Mot de passe *</label>
                  <input required type="password" value={entForm.password}
                    onChange={e => setEntForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="Min. 8 caractères" minLength={8} />
                </div>
              </div>

              {/* Colonne 2 : contact */}
              <div className="flex flex-col gap-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Prénom</label>
                  <input value={entForm.first_name}
                    onChange={e => setEntForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nom</label>
                  <input value={entForm.last_name}
                    onChange={e => setEntForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="Dupont" />
                </div>
              </div>

              {/* Colonne 3 : entreprise */}
              <div className="flex flex-col gap-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entreprise</div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nom entreprise *</label>
                  <input required value={entForm.company_name}
                    onChange={e => setEntForm(f => ({ ...f, company_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="Goldman Sachs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Secteur</label>
                    <input value={entForm.sector}
                      onChange={e => setEntForm(f => ({ ...f, sector: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                      style={{ borderColor: '#E8E8E8' }} placeholder="Finance" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Sièges</label>
                    <input type="number" min="1" value={entForm.seats}
                      onChange={e => setEntForm(f => ({ ...f, seats: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                      style={{ borderColor: '#E8E8E8' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Email contact dédié</label>
                  <input type="email" value={entForm.contact_email}
                    onChange={e => setEntForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                    style={{ borderColor: '#E8E8E8' }} placeholder="account@spread-finance.com" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
              <p className="text-[10px] text-gray-400">
                Le compte sera créé avec le plan <strong>Entreprise</strong>, email confirmé, onboarding ignoré.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEntForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500"
                  style={{ background: '#F5F5F5' }}>
                  Annuler
                </button>
                <button type="submit" disabled={entSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: entSaving ? '#999' : '#3183F7' }}>
                  {entSaving ? 'Création…' : 'Créer le compte →'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Success banner */}
      {entSuccess && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: '#E6FAF3', color: '#0d7a56' }}>
          ✅ {entSuccess}
          <button onClick={() => setEntSuccess(null)} className="ml-auto text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: '#FEF0EE', color: '#c0392b' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              {['Utilisateur', 'Email', 'Plan', 'Type', 'Admin', 'Inscrit le', ''].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const isLoading = loading.has(u.id)
              const planColor = PLAN_COLORS[u.plan]
              return (
                <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none', opacity: isLoading ? 0.5 : 1 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                        style={{ background: u.account_type === 'enterprise' ? '#3183F7' : '#1C1C2E' }}>
                        {(u.first_name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-gray-800">
                        {u.first_name} {u.last_name}
                        {u.account_type === 'enterprise' && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: '#EBF2FF', color: '#3183F7' }}>ENT</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[11px] text-gray-400 max-w-[180px] truncate">{u.email}</td>

                  <td className="px-4 py-3">
                    <select value={u.plan} disabled={isLoading}
                      onChange={e => update(u.id, { plan: e.target.value as AdminUser['plan'] })}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer outline-none"
                      style={{ background: `${planColor}18`, color: planColor, border: `1.5px solid ${planColor}40` }}>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="platinum">Platinum</option>
                      <option value="enterprise">Entreprise</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <button disabled={isLoading}
                      onClick={() => update(u.id, { account_type: u.account_type === 'individual' ? 'enterprise' : 'individual' })}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: u.account_type === 'enterprise' ? '#EBF2FF' : '#F5F5F5',
                        color: u.account_type === 'enterprise' ? '#3183F7' : '#888',
                      }}>
                      {u.account_type === 'enterprise' ? '🏢 Entreprise' : 'Individuel'}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <button disabled={isLoading}
                      onClick={() => update(u.id, { is_admin: !u.is_admin })}
                      className="w-10 h-5 rounded-full transition-all relative"
                      style={{ background: u.is_admin ? '#F56751' : '#E5E7EB' }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                        style={{ left: u.is_admin ? '1.25rem' : '0.125rem' }} />
                    </button>
                  </td>

                  <td className="px-4 py-3 text-[11px] text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>

                  <td className="px-4 py-3">
                    {isLoading && <span className="text-[10px] text-gray-400">Enregistrement…</span>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
