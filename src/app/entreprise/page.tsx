import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'Espace Entreprise — Spread Finance',
  description: 'Formez vos équipes, évaluez vos candidats, publiez vos offres. La solution B2B Finance & IT.',
}

const PILLARS = [
  {
    icon: '🏢',
    color: '#3183F7',
    bg: '#EBF2FF',
    title: 'Formation groupe',
    desc: 'Inscrivez vos consultants et collaborateurs sur nos parcours certifiants. Suivez leur progression en temps réel depuis votre tableau de bord entreprise.',
    items: ['Licences multi-utilisateurs', 'Tableau de bord RH', 'Rapports de progression', 'Certification équipe'],
  },
  {
    icon: '🤝',
    color: '#36D399',
    bg: '#E6FAF3',
    title: 'Connecter candidats & ESN',
    desc: 'Accédez à un vivier de candidats qualifiés, pré-évalués sur nos contenus Finance & IT. Intégrez les évaluations Spread dans votre process de recrutement.',
    items: ['Accès au profil candidat', 'Résultats d\'évaluation certifiés', 'Matching par compétences', 'Intégration ATS'],
  },
  {
    icon: '📋',
    color: '#FFC13D',
    bg: '#FFF8E6',
    title: 'Déposer des offres',
    desc: 'Publiez vos offres d\'emploi directement sur la plateforme Jobs Spread Finance, visible par des milliers de professionnels IT & Finance.',
    items: ['Publication illimitée', 'Ciblage par domaine', 'Mise en avant premium', 'Analytics candidatures'],
  },
]

const TARGETS = [
  { label: 'ESN & SSII', desc: 'Évaluez vos consultants, publiez vos missions, recrutez des profils qualifiés.' },
  { label: 'Banques & Asset Managers', desc: 'Formez vos équipes front/back office aux dernières évolutions des marchés.' },
  { label: 'Fintech & Scale-up', desc: 'Onboardez rapidement vos nouvelles recrues avec des parcours adaptés.' },
  { label: 'Cabinets de conseil', desc: 'Valorisez les compétences de vos équipes avec des certifications reconnues.' },
]

const ROADMAP_ITEMS = [
  {
    status: 'planned',
    title: 'Compte entreprise (B2B) distinct',
    desc: 'Inscription dédiée avec SIRET, raison sociale, secteur d\'activité. Séparation stricte des données B2C / B2B via RLS Supabase (org_id).',
  },
  {
    status: 'planned',
    title: 'Dashboard entreprise & gestion des licences',
    desc: 'Backoffice dédié : gestion des collaborateurs, attribution des licences, suivi de progression par équipe, exports RH.',
  },
  {
    status: 'planned',
    title: 'Invitation et groupes de formation',
    desc: 'Envoi d\'invitations en masse par email, création de groupes de formation thématiques, suivi collectif.',
  },
  {
    status: 'planned',
    title: 'Connexion candidat ↔ ESN',
    desc: 'Matching entre profils candidats et ESN partenaires basé sur les résultats d\'évaluation. Visibilité du profil candidat contrôlée par le candidat.',
  },
  {
    status: 'planned',
    title: 'Dissociation des comptes B2C et B2B',
    desc: 'Isolation complète des données : row-level security par org_id, journaux d\'audit, RGPD. Un consultant peut avoir un compte B2C ET être lié à une ESN.',
  },
  {
    status: 'planned',
    title: 'Dépôt et gestion des offres d\'emploi',
    desc: 'Backoffice entreprise pour créer, publier et gérer les offres dans la section Jobs. Analytics : vues, candidatures, taux de conversion.',
  },
  {
    status: 'planned',
    title: 'Intégrations SIRH & API webhooks',
    desc: 'Connexion avec Workday, BambooHR, SAP SuccessFactors. Webhooks pour synchroniser les progressions et certifications.',
  },
]

export default async function EntreprisePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav style={{ background: '#292929' }} className="h-14 flex items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3">
          <div style={{ background: '#3183F7', borderRadius: 8, width: 34, height: 34 }} className="flex items-center justify-center text-white text-xs font-black">SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>
        <PublicNav />
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-white text-xs font-bold px-4 py-1.5 rounded-md" style={{ background: '#3183F7' }}>Mon dashboard →</Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-white/60 border border-white/20 rounded-md text-xs font-semibold px-3 py-1.5 hover:text-white">Connexion</Link>
              <Link href="/auth/register" className="text-white text-xs font-bold px-4 py-1.5 rounded-md" style={{ background: '#3183F7' }}>Commencer gratuitement</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#292929' }} className="px-8 pt-16 pb-14">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(54,211,153,.15)', border: '1px solid rgba(54,211,153,.3)', color: '#36D399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Offre B2B — ESN, Banques, Fintech
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Formez vos équipes,{' '}
            <span style={{ color: '#3183F7' }}>évaluez vos candidats</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            La plateforme Finance & IT qui connecte entreprises, consultants et candidats.
            Formation groupe, évaluation certifiante et recrutement qualifié en un seul endroit.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <a href="mailto:contact@spread-finance.fr" className="px-6 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#3183F7' }}>
              Demander une démo →
            </a>
            <Link href="/about" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white/75" style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)' }}>
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* CIBLES */}
      <section className="px-8 py-12" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Pour qui</p>
          <h2 className="text-2xl font-black text-gray-800 mb-8">Conçu pour les acteurs Finance & IT</h2>
          <div className="grid grid-cols-2 gap-4">
            {TARGETS.map(({ label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-white" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#3183F7' }} />
                <div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{label}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 PILLIERS */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Notre offre</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Trois services, une plateforme</h2>
          <div className="flex flex-col gap-6">
            {PILLARS.map(({ icon, color, bg, title, desc, items }) => (
              <div key={title} className="rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-gray-800 mb-2">{title}</div>
                    <div className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP TECHNIQUE */}
      <section className="px-8 py-16" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Roadmap technique B2B</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFF8E6', color: '#b37700' }}>En développement</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">Ce que nous construisons</h2>
          <p className="text-sm text-gray-500 mb-8">Transparence totale sur notre feuille de route produit. Ces fonctionnalités sont planifiées pour l&apos;espace entreprise.</p>

          <div className="flex flex-col gap-3">
            {ROADMAP_ITEMS.map(({ title, desc }, i) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl bg-white" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: '#CBD5E1' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {i < ROADMAP_ITEMS.length - 1 && <div className="w-0.5 flex-1 min-h-4" style={{ background: '#E8E8E8' }} />}
                </div>
                <div className="pb-1">
                  <div className="text-xs font-bold text-gray-800 mb-1">{title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-16" style={{ background: '#1C1C2E' }}>
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Intéressé par l&apos;offre entreprise ?</h2>
          <p className="text-white/50 text-sm mb-8">Contactez-nous pour une démonstration personnalisée et un devis adapté à votre organisation.</p>
          <a href="mailto:contact@spread-finance.fr" className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#3183F7' }}>
            Demander une démo →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#292929' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs">© 2026 Spread Finance.</div>
          <div className="flex gap-4">
            {[['/documentation', 'Documentation'], ['/about', 'À propos'], ['/elearning', 'E-Learning'], ['/books', 'Livres'], ['/glossaire', 'Glossaire']].map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-xs">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
