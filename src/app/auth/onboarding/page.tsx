'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOALS = [
  { id: 'learn',      icon: '📚', title: 'Me former',                sub: 'Apprendre la finance et l\'IT' },
  { id: 'certify',    icon: '🏆', title: 'Certifier mes compétences', sub: 'Obtenir des certifications' },
  { id: 'career',     icon: '📈', title: 'Évoluer professionnellement', sub: 'Accéder à de meilleures offres' },
  { id: 'project',    icon: '💻', title: 'Préparer un projet IT',     sub: 'Finance de marché appliquée' },
  { id: 'team',       icon: '🏢', title: 'Former mes équipes',        sub: 'Offre entreprise · ESN' },
  { id: 'curiosity',  icon: '🔍', title: 'Curiosité / Découverte',   sub: 'Explorer la plateforme' },
]

const DOMAINS = [
  { id: 'finance', label: 'Finance de marché',        color: '#3183F7' },
  { id: 'maths',   label: 'Mathématiques financières', color: '#A855F7' },
  { id: 'dev',     label: 'Développement IT',          color: '#1a5fc8' },
  { id: 'pm',      label: 'Gestion de projet',         color: '#FFC13D' },
  { id: 'ml',      label: 'Machine Learning',          color: '#F56751' },
]

const LEVELS = [
  { id: 'beginner',     label: 'Débutant',       desc: 'Je commence depuis zéro' },
  { id: 'intermediate', label: 'Intermédiaire',  desc: 'J\'ai quelques bases' },
  { id: 'advanced',     label: 'Avancé',         desc: 'Je cherche à approfondir' },
]

export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step,   setStep]   = useState(1)
  const [goal,   setGoal]   = useState<string | null>(null)
  const [domain, setDomain] = useState<string | null>(null)
  const [level,  setLevel]  = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFinish = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        onboarding_goal:   goal,
        onboarding_domain: domain,
        onboarding_level:  level,
        onboarding_done:   true,
      }).eq('id', user.id)
      fetch('/api/auth/welcome', { method: 'POST' }).catch(() => {})
    }
    router.push('/dashboard')
    router.refresh()
  }

  const canNext = step === 1 ? !!goal : step === 2 ? !!domain : !!level

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#F7F8FA' }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          {step === 1 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: '#E6FAF3', color: '#0d7a56', border: '1px solid #36D399' }}>
              ✓ Compte créé avec succès !
            </div>
          )}
          <div className="text-xs font-semibold text-gray-400 mb-2">Étape {step} sur 3</div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i < step ? '#36D399' : i === step ? '#3183F7' : '#fff',
                  color:      i < step ? '#fff'    : i === step ? '#fff'    : '#888',
                  border:     i > step ? '2px solid #E8E8E8' : 'none',
                }}
              >
                {i < step ? '✓' : i}
              </div>
              {i < 3 && (
                <div className="h-0.5 w-12 rounded-full" style={{ background: i < step ? '#36D399' : '#E8E8E8' }} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ border: '1.5px solid #E8E8E8' }}>
          {/* STEP 1 — Objectif */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-black text-gray-800 mb-2">Quel est votre objectif principal ?</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Cela permet de personnaliser votre expérience. Modifiable à tout moment.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {GOALS.map(({ id, icon, title, sub }) => (
                  <button
                    key={id}
                    onClick={() => setGoal(id)}
                    className="text-left p-3.5 rounded-xl transition-all"
                    style={{
                      border:     `1.5px solid ${goal === id ? '#3183F7' : '#E8E8E8'}`,
                      background: goal === id ? '#EBF2FF' : '#fff',
                    }}
                  >
                    <div className="text-xl mb-2">{icon}</div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: goal === id ? '#1a5fc8' : '#292929' }}>{title}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">{sub}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 2 — Domaine */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-black text-gray-800 mb-2">Par quel domaine voulez-vous commencer ?</h2>
              <p className="text-sm text-gray-500 mb-6">Vous pourrez en changer ou en explorer d'autres à tout moment.</p>
              <div className="flex flex-col gap-3">
                {DOMAINS.map(({ id, label, color }) => (
                  <button
                    key={id}
                    onClick={() => setDomain(id)}
                    className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                    style={{
                      border:     `1.5px solid ${domain === id ? color : '#E8E8E8'}`,
                      background: domain === id ? `${color}12` : '#fff',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `${color}20` }}>
                      <div className="w-full h-full rounded-lg" style={{ background: `${color}30` }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: domain === id ? color : '#292929' }}>
                      {label}
                    </span>
                    {domain === id && (
                      <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 3 — Niveau */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-black text-gray-800 mb-2">Quel est votre niveau actuel ?</h2>
              <p className="text-sm text-gray-500 mb-6">Pour vous recommander les bons chapitres pour démarrer.</p>
              <div className="flex flex-col gap-3">
                {LEVELS.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setLevel(id)}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{
                      border:     `1.5px solid ${level === id ? '#3183F7' : '#E8E8E8'}`,
                      background: level === id ? '#EBF2FF' : '#fff',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: level === id ? '#3183F7' : '#f5f5f5', color: level === id ? '#fff' : '#888' }}
                    >
                      {id === 'beginner' ? '1' : id === 'intermediate' ? '2' : '3'}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: level === id ? '#1a5fc8' : '#292929' }}>{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard')}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              {step === 1 ? 'Passer cette étape' : '← Retour'}
            </button>
            <button
              onClick={() => step < 3 ? setStep(s => s + 1) : handleFinish()}
              disabled={!canNext || saving}
              className="flex items-center gap-2 px-6 h-10 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#3183F7' }}
            >
              {saving ? 'Sauvegarde...' : step < 3 ? 'Continuer →' : 'Accéder au dashboard →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
