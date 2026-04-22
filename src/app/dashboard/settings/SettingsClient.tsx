'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  email:       string
  firstName:   string
  lastName:    string
  plan:        string
  memberSince: string
}

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: 'Free',     color: '#888',    bg: '#F5F5F5' },
  premium:  { label: 'Premium',  color: '#1a5fc8', bg: '#EBF2FF' },
  platinum: { label: 'Platinum', color: '#7c3aed', bg: '#F3EEFF' },
}

export default function SettingsClient({ email, firstName, lastName, plan, memberSince }: Props) {
  const supabase = createClient()

  const [first,    setFirst]    = useState(firstName)
  const [last,     setLast]     = useState(lastName)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [pwMode,   setPwMode]   = useState(false)
  const [pw,       setPw]       = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved,  setPwSaved]  = useState(false)
  const [pwError,  setPwError]  = useState<string | null>(null)

  const planMeta = PLAN_META[plan] ?? PLAN_META.free
  const since = memberSince
    ? new Date(memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—'

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: err } = await supabase.auth.updateUser({
      data: { first_name: first, last_name: last },
    })
    if (!err) {
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ first_name: first, last_name: last })
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      if (dbErr) setError(dbErr.message)
      else setSaved(true)
    } else {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwSaving(true)
    setPwError(null)
    setPwSaved(false)

    const { error: err } = await supabase.auth.updateUser({ password: pw })
    if (err) setPwError(err.message)
    else { setPwSaved(true); setPw(''); setPwMode(false) }
    setPwSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Profil */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Informations personnelles</div>

        {/* Avatar + plan */}
        <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid #F0F0F0' }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
            style={{ background: '#3183F7' }}
          >
            {(first[0] ?? '?').toUpperCase()}{(last[0] ?? '').toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">{first || '—'} {last || ''}</div>
            <div className="text-xs text-gray-400 mt-0.5">{email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: planMeta.bg, color: planMeta.color }}
              >
                {planMeta.label}
              </span>
              <span className="text-[10px] text-gray-400">Membre depuis {since}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input
                value={first}
                onChange={e => setFirst(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 outline-none"
                style={{ border: '1.5px solid #E0E0E0' }}
                onFocus={e => e.target.style.borderColor = '#3183F7'}
                onBlur={e => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom</label>
              <input
                value={last}
                onChange={e => setLast(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 outline-none"
                style={{ border: '1.5px solid #E0E0E0' }}
                onFocus={e => e.target.style.borderColor = '#3183F7'}
                onBlur={e => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              value={email}
              disabled
              className="w-full h-10 px-3 rounded-xl text-sm text-gray-400 cursor-not-allowed"
              style={{ border: '1.5px solid #E0E0E0', background: '#FAFAFA' }}
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 px-3 py-2 rounded-lg" style={{ background: '#FEF0EE' }}>{error}</div>
          )}
          {saved && (
            <div className="text-xs text-green-700 px-3 py-2 rounded-lg" style={{ background: '#E6FAF3' }}>✓ Profil mis à jour</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#3183F7', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sécurité</div>

        {!pwMode ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">Mot de passe</div>
              <div className="text-xs text-gray-400 mt-0.5">••••••••••••</div>
            </div>
            <button
              onClick={() => setPwMode(true)}
              className="text-xs font-bold px-4 py-2 rounded-xl transition-colors hover:bg-gray-50"
              style={{ border: '1.5px solid #E8E8E8', color: '#374151' }}
            >
              Modifier
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="8 caractères minimum"
                minLength={8}
                required
                className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 outline-none"
                style={{ border: '1.5px solid #E0E0E0' }}
                onFocus={e => e.target.style.borderColor = '#3183F7'}
                onBlur={e => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>
            {pwError && (
              <div className="text-xs text-red-600 px-3 py-2 rounded-lg" style={{ background: '#FEF0EE' }}>{pwError}</div>
            )}
            {pwSaved && (
              <div className="text-xs text-green-700 px-3 py-2 rounded-lg" style={{ background: '#E6FAF3' }}>✓ Mot de passe mis à jour</div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setPwMode(false); setPw('') }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pwSaving || pw.length < 8}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#3183F7', opacity: (pwSaving || pw.length < 8) ? 0.6 : 1 }}
              >
                {pwSaving ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Plan */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Abonnement</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-sm font-bold"
                style={{ color: planMeta.color }}
              >
                {planMeta.label}
              </span>
              {plan === 'free' && (
                <span className="text-[10px] text-gray-400">Plan gratuit</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {plan === 'free'
                ? 'Accès aux contenus gratuits, quiz niveaux 1 & 2'
                : plan === 'premium'
                ? 'Accès complet — quiz avancés, flashcards, priorité support'
                : 'Accès total — LMS, certifications, coaching'}
            </div>
          </div>
          {plan === 'free' && (
            <a
              href="/#pricing"
              className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex-shrink-0 ml-4"
              style={{ background: '#3183F7' }}
            >
              Passer Premium →
            </a>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #FECACA' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c0392b' }}>Zone de danger</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800">Se déconnecter</div>
            <div className="text-xs text-gray-400 mt-0.5">Terminer la session sur cet appareil</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs font-bold px-4 py-2 rounded-xl transition-colors hover:bg-red-50"
              style={{ border: '1.5px solid #FECACA', color: '#c0392b' }}
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
