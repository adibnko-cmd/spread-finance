'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  user_id:    string
  role:       string
  joined_at:  string | null
  first_name: string | null
  last_name:  string | null
  email:      string
}

interface EnterpriseData {
  id:            string
  company_name:  string
  seats:         number
  contact_email: string | null
  email:         string
  members:       Member[]
}

export default function EnterpriseAdminClient({ enterprises }: { enterprises: EnterpriseData[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(
    enterprises.length === 1 ? enterprises[0].id : null
  )
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({})
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [isPending, startTransition]  = useTransition()

  async function addMember(enterpriseId: string) {
    const email = emailInputs[enterpriseId]?.trim()
    if (!email) return

    setErrors(e => ({ ...e, [enterpriseId]: '' }))
    const res = await fetch('/api/admin/enterprise/members', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ enterprise_id: enterpriseId, email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErrors(e => ({ ...e, [enterpriseId]: data.error ?? 'Erreur' }))
      return
    }

    setEmailInputs(i => ({ ...i, [enterpriseId]: '' }))
    startTransition(() => router.refresh())
  }

  async function removeMember(enterpriseId: string, userId: string) {
    const res = await fetch('/api/admin/enterprise/members', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ enterprise_id: enterpriseId, user_id: userId }),
    })
    if (res.ok) startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-4">
      {enterprises.map(ent => (
        <div key={ent.id} className="bg-white rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
          {/* En-tête entreprise */}
          <button
            onClick={() => setExpandedId(expandedId === ent.id ? null : ent.id)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: '#36D399' }}
              >
                {ent.company_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{ent.company_name}</div>
                <div className="text-xs text-gray-400">{ent.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: ent.members.length >= ent.seats ? '#FEE2E2' : '#E6FAF3',
                  color:      ent.members.length >= ent.seats ? '#DC2626' : '#0d7a56',
                }}
              >
                {ent.members.length} / {ent.seats} sièges
              </span>
              <span className="text-gray-400 text-sm">{expandedId === ent.id ? '▾' : '›'}</span>
            </div>
          </button>

          {expandedId === ent.id && (
            <div className="border-t px-5 pb-5" style={{ borderColor: '#E8E8E8' }}>
              {/* Liste des membres */}
              <div className="mt-4 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Membres ({ent.members.length})
                </div>
                {ent.members.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-2">Aucun membre associé</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {ent.members.map(m => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: '#F9FAFB' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: '#3183F7' }}
                          >
                            {(m.first_name?.[0] ?? m.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-800">
                              {m.first_name || m.last_name
                                ? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim()
                                : m.email}
                            </div>
                            <div className="text-[10px] text-gray-400">{m.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: m.role === 'admin' ? '#EBF2FF' : '#F3F4F6',
                              color:      m.role === 'admin' ? '#3183F7' : '#6B7280',
                            }}
                          >
                            {m.role === 'admin' ? 'Admin' : 'Membre'}
                          </span>
                          <button
                            onClick={() => removeMember(ent.id, m.user_id)}
                            disabled={isPending}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ajouter un membre */}
              <div className="pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ajouter un membre
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="email@domaine.com"
                    value={emailInputs[ent.id] ?? ''}
                    onChange={e => setEmailInputs(i => ({ ...i, [ent.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addMember(ent.id)}
                    className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                    style={{ border: '1.5px solid #E8E8E8', background: '#F9FAFB' }}
                  />
                  <button
                    onClick={() => addMember(ent.id)}
                    disabled={isPending || !emailInputs[ent.id]?.trim()}
                    className="text-xs font-bold px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                    style={{ background: '#36D399' }}
                  >
                    Ajouter
                  </button>
                </div>
                {errors[ent.id] && (
                  <div className="text-[10px] text-red-500 mt-1.5">{errors[ent.id]}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
