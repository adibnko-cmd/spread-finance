// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Page Connexion
// Alignée sur la maquette HF Auth validée Phase 2
// ═══════════════════════════════════════════════════════════════════
'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase     = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : error.message)
      setLoading(false)
      return
    }

    window.location.href = redirectTo
  }

  const handleOAuth = async (provider: 'google' | 'linkedin_oidc') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${redirectTo}`,
      },
    })
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* ── GAUCHE — Brand panel ─── */}
      <div
        className="flex flex-col justify-between p-10"
        style={{ background: '#292929' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-xl text-white font-black text-xs"
            style={{ width: 36, height: 36, background: '#3183F7' }}
          >
            SF
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker', color: '#3183F7', fontSize: 9 }}>
              Finance
            </div>
          </div>
        </Link>

        <div>
          <h2 className="text-2xl font-black text-white mb-3" style={{ lineHeight: 1.2 }}>
            Bon retour parmi nous.
          </h2>
          <p className="text-sm text-white/50 leading-relaxed mb-8">
            Reprenez votre apprentissage là où vous l'avez laissé.
            Votre progression vous attend.
          </p>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}
          >
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
              Votre dernière session
            </div>
            {[
              { color: '#3183F7', title: 'Fondamentaux des marchés financiers',  time: 'hier' },
              { color: '#A855F7', title: 'Python appliqué — NumPy & Pandas',      time: 'lundi' },
            ].map(({ color, title, time }) => (
              <div
                key={title}
                className="flex items-center gap-2 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-white/60 flex-1">{title}</span>
                <span className="text-xs text-white/30">{time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-5">
          {[{ n: '32', l: 'chapitres' }, { n: '5', l: 'domaines' }, { n: '100%', l: 'gratuit' }].map(({ n, l }) => (
            <div key={l}>
              <div className="text-white font-black text-lg">{n}</div>
              <div className="text-white/40 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE — Formulaire ─── */}
      <div className="flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-sm">
          {/* Tabs */}
          <div
            className="flex gap-0 mb-8"
            style={{ borderBottom: '2px solid #292929' }}
          >
            <Link
              href="/auth/register"
              className="text-sm font-semibold pb-2 px-4 text-gray-400"
            >
              Inscription
            </Link>
            <div
              className="text-sm font-bold pb-2 px-4"
              style={{ color: '#292929', borderBottom: '2px solid #3183F7', marginBottom: -2 }}
            >
              Connexion
            </div>
          </div>

          <h1 className="text-xl font-black text-gray-800 mb-1">Bon retour</h1>
          <p className="text-xs text-gray-500 mb-6">
            Connectez-vous à votre espace Spread Finance
          </p>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-xs font-semibold"
              style={{ background: '#FEF0EE', color: '#c0391f', border: '1px solid #F56751' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                required
                className="w-full h-11 px-3 rounded-xl text-sm text-gray-800 outline-none transition-all"
                style={{ border: '1.5px solid #D0D0D0' }}
                onFocus={e => e.target.style.border = '1.5px solid #3183F7'}
                onBlur={e => e.target.style.border = '1.5px solid #D0D0D0'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-800">Mot de passe</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold"
                  style={{ color: '#3183F7' }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 px-3 rounded-xl text-sm text-gray-800 outline-none transition-all"
                style={{ border: '1.5px solid #D0D0D0' }}
                onFocus={e => e.target.style.border = '1.5px solid #3183F7'}
                onBlur={e => e.target.style.border = '1.5px solid #D0D0D0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
              style={{ background: '#292929', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
            <span className="text-xs font-semibold text-gray-400">ou continuer avec</span>
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { id: 'google' as const,          label: 'Google' },
              { id: 'linkedin_oidc' as const,   label: 'LinkedIn' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleOAuth(id)}
                className="h-10 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center col-span-1 transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                {label}
              </button>
            ))}
            <button
              className="h-10 rounded-xl text-xs font-semibold text-gray-400 flex items-center justify-center transition-colors hover:bg-gray-50"
              style={{ border: '1.5px solid #E8E8E8' }}
              disabled
            >
              Facebook
            </button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="font-semibold" style={{ color: '#3183F7' }}>
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
