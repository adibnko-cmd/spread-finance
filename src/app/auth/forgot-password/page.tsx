'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Gauche — brand */}
      <div className="flex flex-col justify-between p-10" style={{ background: '#292929' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-xl text-white font-black text-xs"
            style={{ width: 36, height: 36, background: '#3183F7' }}>
            SF
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>

        <div>
          <h2 className="text-2xl font-black text-white mb-3" style={{ lineHeight: 1.2 }}>
            Mot de passe oublié ?
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Pas de panique. Entrez votre email et nous vous enverrons un lien
            de réinitialisation sécurisé.
          </p>
        </div>

        <div className="flex gap-5">
          {[{ n: '< 1min', l: 'pour recevoir le mail' }, { n: '100%', l: 'sécurisé' }].map(({ n, l }) => (
            <div key={l}>
              <div className="text-white font-black text-lg">{n}</div>
              <div className="text-white/40 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Droite — formulaire */}
      <div className="flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-sm">
          <Link href="/auth/login" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 mb-8 transition-colors">
            ← Retour à la connexion
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                style={{ background: '#E6FAF3' }}>
                ✉️
              </div>
              <h1 className="text-xl font-black text-gray-800 mb-2">Email envoyé !</h1>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Si un compte existe pour <strong>{email}</strong>, vous recevrez
                un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Vérifiez vos spams si vous ne le voyez pas.
              </p>
              <Link
                href="/auth/login"
                className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: '#292929' }}
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-black text-gray-800 mb-1">Réinitialisation</h1>
              <p className="text-xs text-gray-500 mb-6">
                Entrez l'email associé à votre compte
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-xs font-semibold"
                  style={{ background: '#FEF0EE', color: '#c0391f', border: '1px solid #F56751' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center transition-opacity"
                  style={{ background: '#292929', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien →'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-6">
                Vous vous souvenez ?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: '#3183F7' }}>
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
