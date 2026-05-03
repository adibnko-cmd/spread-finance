'use client'

import { useState } from 'react'

const DOMAINS = ['finance', 'maths', 'dev', 'pm', 'ml'] as const
type Domain = typeof DOMAINS[number]

const DOMAIN_META: Record<Domain, { label: string; color: string; bg: string }> = {
  finance: { label: 'Finance',  color: '#3183F7', bg: '#EBF2FF' },
  maths:   { label: 'Maths',    color: '#A855F7', bg: '#F5F0FF' },
  dev:     { label: 'Dev',      color: '#1a5fc8', bg: '#E8EEFB' },
  pm:      { label: 'PM',       color: '#b37700', bg: '#FFF8E6' },
  ml:      { label: 'ML / IA',  color: '#F56751', bg: '#FEF2F0' },
}

interface Progress {
  chapters_completed: number
  quizzes_passed:     number
  total_xp:           number
  by_domain:          Record<string, { chapters_completed: number; quizzes_passed: number }>
}

interface Member {
  user_id:    string
  first_name: string | null
  last_name:  string | null
  email:      string
  assignment: { domains: string[]; deadline: string | null; notes: string | null } | null
  progress:   Progress
}

interface Props { members: Member[] }

function initials(m: Member) {
  return [(m.first_name?.[0] ?? ''), (m.last_name?.[0] ?? '')].join('').toUpperCase() || '?'
}
function fullName(m: Member) {
  return [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Utilisateur'
}
function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function deadlineStatus(deadline: string | null): { label: string; color: string; bg: string } | null {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0)  return { label: `Dépassé de ${Math.abs(days)}j`, color: '#dc2626', bg: '#FEF2F0' }
  if (days === 0) return { label: "Échéance aujourd'hui", color: '#F56751', bg: '#FEF2F0' }
  if (days <= 7)  return { label: `${days}j restant${days > 1 ? 's' : ''}`, color: '#b37700', bg: '#FFF8E6' }
  return { label: `${days}j restant${days > 1 ? 's' : ''}`, color: '#0d7a56', bg: '#E6FAF3' }
}

export function FormationClient({ members: initial }: Props) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [editing, setEditing]   = useState<Member | null>(null)

  // Modal state
  const [selDomains, setSelDomains] = useState<Domain[]>([])
  const [deadline,   setDeadline]   = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [removing,   setRemoving]   = useState<string | null>(null)
  const [error,      setError]      = useState('')

  function openModal(m: Member) {
    setEditing(m)
    setSelDomains((m.assignment?.domains ?? []) as Domain[])
    setDeadline(m.assignment?.deadline ?? '')
    setNotes(m.assignment?.notes ?? '')
    setError('')
  }

  function closeModal() {
    setEditing(null)
    setError('')
  }

  function toggleDomain(d: Domain) {
    setSelDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleSave() {
    if (!editing) return
    if (selDomains.length === 0) { setError('Sélectionnez au moins un domaine.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/enterprise/formation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:  editing.user_id,
          domains:  selDomains,
          deadline: deadline || null,
          notes:    notes || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setMembers(prev => prev.map(m => m.user_id === editing.user_id
        ? { ...m, assignment: { domains: selDomains, deadline: deadline || null, notes: notes || null } }
        : m
      ))
      closeModal()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Retirer le parcours assigné à ce collaborateur ?')) return
    setRemoving(userId)
    const res = await fetch('/api/enterprise/formation', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, assignment: null } : m))
    }
    setRemoving(null)
  }

  function exportCSV() {
    const rows = [
      ['Nom', 'Email', 'Domaines assignés', 'Échéance', 'Chapitres complétés', 'Quiz réussis', 'XP total'],
      ...members.map(m => [
        fullName(m),
        m.email,
        (m.assignment?.domains ?? []).join(', '),
        m.assignment?.deadline ?? '',
        m.progress.chapters_completed,
        m.progress.quizzes_passed,
        m.progress.total_xp,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'formation_groupe.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Compute deadline alerts
  const overdueMembers  = members.filter(m => m.assignment?.deadline && deadlineStatus(m.assignment.deadline)?.color === '#dc2626')
  const urgentMembers   = members.filter(m => m.assignment?.deadline && deadlineStatus(m.assignment.deadline)?.color === '#b37700')

  return (
    <div className="p-8">
      {/* Deadline alerts */}
      {overdueMembers.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-4" style={{ background: '#FEF2F0', border: '1.5px solid #F5675120' }}>
          <span className="text-base">⚠️</span>
          <div className="text-xs text-red-700">
            <strong>{overdueMembers.length} collaborateur{overdueMembers.length > 1 ? 's' : ''}</strong> {overdueMembers.length > 1 ? 'ont' : 'a'} dépassé leur échéance de formation :&nbsp;
            {overdueMembers.map(m => fullName(m)).join(', ')}
          </div>
        </div>
      )}
      {urgentMembers.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-4" style={{ background: '#FFF8E6', border: '1.5px solid #FFC13D40' }}>
          <span className="text-base">⏰</span>
          <div className="text-xs text-yellow-800">
            <strong>{urgentMembers.length} collaborateur{urgentMembers.length > 1 ? 's' : ''}</strong> {urgentMembers.length > 1 ? 'ont' : 'a'} une échéance dans moins de 7 jours.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-black text-gray-900">Formation groupe</div>
          <div className="text-sm text-gray-400 mt-0.5">
            Assignez des parcours de formation à vos collaborateurs et suivez leur progression.
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100"
          style={{ border: '1.5px solid #E8E8E8', background: '#fff' }}
        >
          ↓ Exporter CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #F0F1F3' }}>
              {['Collaborateur', 'Parcours assigné', 'Progression', 'XP', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const assigned = m.assignment?.domains ?? []
              const deadline = m.assignment?.deadline ?? null
              const prg      = m.progress

              return (
                <tr key={m.user_id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F5F6F8' }}>
                  {/* Member */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                        style={{ background: '#1C1C2E' }}>
                        {initials(m)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{fullName(m)}</div>
                        <div className="text-[10px] text-gray-400">{m.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Domains */}
                  <td className="px-5 py-4">
                    {assigned.length === 0 ? (
                      <span className="text-[10px] text-gray-400 italic">Non assigné</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          {assigned.map(d => {
                            const meta = DOMAIN_META[d as Domain]
                            return (
                              <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: meta?.bg ?? '#F5F6F8', color: meta?.color ?? '#6B7280' }}>
                                {meta?.label ?? d}
                              </span>
                            )
                          })}
                        </div>
                        {deadline && (() => {
                          const ds = deadlineStatus(deadline)
                          return ds ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full self-start"
                              style={{ background: ds.bg, color: ds.color }}>
                              {ds.label}
                            </span>
                          ) : null
                        })()}
                      </div>
                    )}
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-4">
                    {assigned.length === 0 ? (
                      <span className="text-[10px] text-gray-300">—</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {assigned.map(d => {
                          const meta = DOMAIN_META[d as Domain]
                          const dp   = prg.by_domain[d] ?? { chapters_completed: 0, quizzes_passed: 0 }
                          return (
                            <div key={d} className="flex items-center gap-2">
                              <span className="text-[9px] font-bold w-12 shrink-0" style={{ color: meta?.color ?? '#6B7280' }}>
                                {meta?.label ?? d}
                              </span>
                              <div className="flex gap-2 text-[10px] text-gray-500">
                                <span>{dp.chapters_completed} ch.</span>
                                <span className="text-gray-300">·</span>
                                <span>{dp.quizzes_passed} quiz</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>

                  {/* XP */}
                  <td className="px-5 py-4">
                    <div className="text-sm font-black" style={{ color: prg.total_xp > 0 ? '#FFC13D' : '#D1D5DB' }}>
                      {prg.total_xp > 0 ? `${prg.total_xp} XP` : '—'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openModal(m)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ border: '1.5px solid #E8E8E8', color: '#374151' }}
                      >
                        {assigned.length === 0 ? 'Assigner' : 'Modifier'}
                      </button>
                      {assigned.length > 0 && (
                        <button
                          onClick={() => handleRemove(m.user_id)}
                          disabled={removing === m.user_id}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-600 disabled:opacity-40"
                        >
                          {removing === m.user_id ? '…' : 'Retirer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ border: '1.5px solid #E8E8E8' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F0F1F3' }}>
              <div>
                <div className="text-sm font-black text-gray-900">Parcours de formation</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{fullName(editing)}</div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Domain selection */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Domaines à assigner *</div>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map(d => {
                    const meta    = DOMAIN_META[d]
                    const checked = selDomains.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: checked ? meta.bg    : '#F5F6F8',
                          color:      checked ? meta.color : '#9CA3AF',
                          border:     `1.5px solid ${checked ? meta.color : 'transparent'}`,
                        }}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Échéance (optionnelle)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none"
                  style={{ border: '1.5px solid #E8E8E8', background: '#FAFAFA' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Notes (optionnelles)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Objectifs, contexte..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 outline-none resize-none"
                  style={{ border: '1.5px solid #E8E8E8', background: '#FAFAFA' }}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selDomains.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: '#1C1C2E' }}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
