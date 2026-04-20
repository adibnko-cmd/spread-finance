'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'loading' | 'verify'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step,      setStep]      = useState<Step>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [agree,     setAgree]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Force du mot de passe
  const pwdStrength = !password ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[^a-zA-Z0-9]/.test(password) && password.length >= 10 ? 4
    : 3

  const strengthLabels = ['', 'Trop court', 'Faible', 'Moyen', 'Fort']
  const strengthColors = ['', '#F56751', '#FFC13D', '#FFC13D', '#36D399']

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) { setError('Veuillez accepter les conditions d\'utilisation.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }

    setStep('loading')
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirectTo=/auth/onboarding`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : error.message)
      setStep('form')
      return
    }

    setStep('verify')
  }

  const handleOAuth = async (provider: 'google' | 'linkedin_oidc') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=/auth/onboarding` },
    })
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F8FA' }}>
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#E6FAF3' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l6 6 12-12" stroke="#36D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Vérifiez votre email</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Un lien de confirmation a été envoyé à <strong className="text-gray-800">{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <p className="text-xs text-gray-400">
            Pas reçu ?{' '}
            <button
              onClick={() => supabase.auth.resend({ type: 'signup', email })}
              className="font-semibold"
              style={{ color: '#3183F7' }}
            >
              Renvoyer l'email
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* ── GAUCHE — Brand panel ─── */}
      <div className="flex flex-col justify-between p-10" style={{ background: '#292929' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white" style={{ background: '#3183F7' }}>SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker, cursive', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Accès gratuit · Sans carte bancaire
          </div>
          <h2 className="text-2xl font-black text-white mb-3 leading-tight">
            Rejoignez la communauté{' '}
            <span style={{ color: '#3183F7' }}>Spread Finance</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed mb-7">
            Documentation complète, suivi de progression et certifications IT & Finance de marché.
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              '32 chapitres · 5 domaines · 100% en français',
              'Quiz, flashcards et suivi de progression',
              'Gamification, badges et certifications',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(49,131,247,.2)', border: '1px solid rgba(49,131,247,.3)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l3 3 4-4" stroke="#3183F7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xs text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
          {[['32', 'chapitres'], ['5', 'domaines'], ['0€', 'pour commencer']].map(([n, l]) => (
            <div key={l}>
              <div className="text-white font-black text-lg">{n}</div>
              <div className="text-white/40 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE — Formulaire ─── */}
      <div className="flex items-center justify-center p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Tabs */}
          <div className="flex gap-0 mb-7" style={{ borderBottom: '2px solid #292929' }}>
            <div className="text-sm font-bold pb-2 px-4" style={{ color: '#292929', borderBottom: '2px solid #3183F7', marginBottom: -2 }}>
              Inscription
            </div>
            <Link href="/auth/login" className="text-sm font-semibold pb-2 px-4 text-gray-400">
              Connexion
            </Link>
          </div>

          <h1 className="text-xl font-black text-gray-800 mb-1">Créer votre compte</h1>
          <p className="text-xs text-gray-500 mb-6">Gratuit · Sans engagement · Accès immédiat</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-xs font-semibold" style={{ background: '#FEF0EE', color: '#c0391f', border: '1px solid #F56751' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Prénom', val: firstName, set: setFirstName, ph: 'Jean' },
                { label: 'Nom',    val: lastName,  set: setLastName,  ph: 'Dupont' },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-800 mb-1.5">{label} <span style={{ color: '#F56751' }}>*</span></label>
                  <input
                    type="text"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={ph}
                    required
                    className="w-full h-11 px-3 rounded-xl text-sm text-gray-800 outline-none"
                    style={{ border: '1.5px solid #D0D0D0' }}
                    onFocus={e => e.target.style.border = '1.5px solid #3183F7'}
                    onBlur={e => e.target.style.border = '1.5px solid #D0D0D0'}
                  />
                </div>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">Adresse email <span style={{ color: '#F56751' }}>*</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                required
                className="w-full h-11 px-3 rounded-xl text-sm text-gray-800 outline-none"
                style={{ border: '1.5px solid #D0D0D0' }}
                onFocus={e => e.target.style.border = '1.5px solid #3183F7'}
                onBlur={e => e.target.style.border = '1.5px solid #D0D0D0'}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">Mot de passe <span style={{ color: '#F56751' }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 caractères"
                required
                className="w-full h-11 px-3 rounded-xl text-sm text-gray-800 outline-none"
                style={{ border: '1.5px solid #D0D0D0' }}
                onFocus={e => e.target.style.border = '1.5px solid #3183F7'}
                onBlur={e => e.target.style.border = '1.5px solid #D0D0D0'}
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-1 rounded-full" style={{ background: i <= pwdStrength ? strengthColors[pwdStrength] : '#f0f0f0' }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: strengthColors[pwdStrength] }}>
                    {strengthLabels[pwdStrength]}
                  </p>
                </div>
              )}
            </div>

            {/* CGU */}
            <div className="flex items-start gap-2.5">
              <div
                onClick={() => setAgree(!agree)}
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer"
                style={{ background: agree ? '#EBF2FF' : '#fff', border: `1.5px solid ${agree ? '#3183F7' : '#D0D0D0'}` }}
              >
                {agree && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2.5 2.5 4-4" stroke="#3183F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                J'accepte les{' '}
                <Link href="/cgu" className="font-semibold" style={{ color: '#3183F7' }}>Conditions Générales</Link>
                {' '}et la{' '}
                <Link href="/confidentialite" className="font-semibold" style={{ color: '#3183F7' }}>Politique de confidentialité</Link>.
              </p>
            </div>

            <button
              type="submit"
              disabled={step === 'loading'}
              className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
              style={{ background: '#3183F7', opacity: step === 'loading' ? 0.7 : 1 }}
            >
              {step === 'loading' ? 'Création...' : 'Créer mon compte →'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
            <span className="text-xs font-semibold text-gray-400">ou continuer avec</span>
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { id: 'google' as const,        label: 'Google' },
              { id: 'linkedin_oidc' as const, label: 'LinkedIn' },
              { id: null,                      label: 'Facebook' },
            ].map(({ id, label }) => (
              <button
                key={label}
                onClick={() => id && handleOAuth(id)}
                disabled={!id}
                className="h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors hover:bg-gray-50 disabled:opacity-40"
                style={{ border: '1.5px solid #E8E8E8', color: '#444' }}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#3183F7' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
