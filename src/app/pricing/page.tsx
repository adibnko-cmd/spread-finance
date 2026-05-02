import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'Tarifs — Spread Finance',
  description: 'Découvrez les offres Spread Finance : Free, Premium et Platinum. Commencez gratuitement, montez en compétences à votre rythme.',
}

const PLANS = [
  {
    name: 'Free',
    price: '0€',
    priceLabel: 'Pour toujours',
    badge: '',
    featured: false,
    dark: false,
    desc: 'Pour découvrir et apprendre les fondamentaux de la Finance & IT.',
    cta: 'Commencer gratuitement',
    href: '/auth/register',
    disabled: false,
    features: [
      { label: 'Documentation complète (32+ chapitres)', included: true },
      { label: 'Quiz niveaux 1 & 2', included: true },
      { label: 'Dashboard personnel', included: true },
      { label: 'Gamification & badges', included: true },
      { label: 'Flashcards', included: false },
      { label: 'Quiz avancés (niveaux 3 & 4)', included: false },
      { label: 'Section Jobs', included: false },
      { label: 'E-Learning LMS', included: false },
      { label: 'Certifications', included: false },
    ],
  },
  {
    name: 'Premium',
    price: '12€',
    priceLabel: 'par mois',
    badge: 'Le plus populaire',
    featured: true,
    dark: false,
    desc: 'Pour progresser sérieusement et accéder à tous les outils.',
    cta: 'Choisir Premium',
    href: '/auth/register?plan=premium',
    disabled: false,
    features: [
      { label: 'Documentation complète (32+ chapitres)', included: true },
      { label: 'Quiz niveaux 1 & 2', included: true },
      { label: 'Dashboard personnel', included: true },
      { label: 'Gamification & badges', included: true },
      { label: 'Flashcards', included: true },
      { label: 'Quiz avancés (niveaux 3 & 4)', included: true },
      { label: 'Section Jobs', included: true },
      { label: 'E-Learning LMS', included: false },
      { label: 'Certifications', included: false },
    ],
  },
  {
    name: 'Platinum',
    price: '29€',
    priceLabel: 'par mois',
    badge: 'Prochainement',
    featured: false,
    dark: true,
    desc: 'Formation structurée avec suivi certifié et accès LMS complet.',
    cta: 'Prochainement',
    href: '#',
    disabled: true,
    features: [
      { label: 'Documentation complète (32+ chapitres)', included: true },
      { label: 'Quiz niveaux 1 & 2', included: true },
      { label: 'Dashboard personnel', included: true },
      { label: 'Gamification & badges', included: true },
      { label: 'Flashcards', included: true },
      { label: 'Quiz avancés (niveaux 3 & 4)', included: true },
      { label: 'Section Jobs', included: true },
      { label: 'E-Learning LMS', included: true },
      { label: 'Certifications', included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'Le plan Free est-il vraiment gratuit ?',
    a: 'Oui, sans limite de temps. Vous accédez à l\'intégralité de la documentation, aux quiz de niveaux 1 & 2, à votre dashboard et à la gamification — sans carte bancaire.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui. L\'abonnement Premium est mensuel et sans engagement. Vous pouvez annuler depuis votre dashboard, votre accès reste actif jusqu\'à la fin de la période en cours.',
  },
  {
    q: 'Quand le plan Platinum sera-t-il disponible ?',
    a: 'Nous travaillons activement sur le module E-Learning LMS et les certifications. Le lancement est prévu pour le T3 2026. Créez un compte gratuit pour être notifié en priorité.',
  },
  {
    q: 'Existe-t-il une offre entreprise ou groupe ?',
    a: 'Oui, nous proposons des licences multi-utilisateurs pour les ESN, banques et cabinets de conseil. Consultez notre page Entreprise ou écrivez-nous directement.',
  },
  {
    q: 'Les prix sont-ils TTC ?',
    a: 'Oui, tous les prix affichés sont TTC. Pour les entreprises assujetties à la TVA, une facture avec TVA déductible est disponible sur demande.',
  },
]

export default async function PricingPage() {
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
      <section style={{ background: '#292929' }} className="px-8 pt-16 pb-14 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Simple, transparent, sans surprise
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Une offre pour{' '}
            <span style={{ color: '#3183F7' }}>chaque profil</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-lg mx-auto">
            Commencez gratuitement, sans carte bancaire. Passez en Premium quand vous êtes prêt à aller plus loin.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className="px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-5">
            {PLANS.map(({ name, price, priceLabel, badge, featured, dark, desc, cta, href, disabled, features }) => (
              <div
                key={name}
                className="rounded-2xl p-6 relative flex flex-col"
                style={{
                  background: dark ? '#1C1C2E' : '#fff',
                  border: featured ? '2px solid #3183F7' : `1.5px solid ${dark ? 'rgba(255,255,255,.1)' : '#E8E8E8'}`,
                  opacity: disabled ? 0.8 : 1,
                }}
              >
                {badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{
                      background: name === 'Platinum' ? '#FFF8E6' : '#3183F7',
                      color: name === 'Platinum' ? '#b37700' : '#fff',
                    }}
                  >
                    {badge}
                  </div>
                )}

                <div className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: dark ? 'rgba(255,255,255,.4)' : '#aaa' }}>
                  {name}
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black" style={{ color: dark ? '#fff' : name === 'Premium' ? '#3183F7' : '#1a1a1a' }}>
                    {price}
                  </span>
                  {price !== '0€' && (
                    <span className="text-xs" style={{ color: dark ? 'rgba(255,255,255,.4)' : '#aaa' }}>/mois</span>
                  )}
                </div>

                <div className="text-[10px] font-medium mb-3" style={{ color: dark ? 'rgba(255,255,255,.35)' : '#bbb' }}>
                  {priceLabel}
                </div>

                <p className="text-xs leading-relaxed mb-5" style={{ color: dark ? 'rgba(255,255,255,.5)' : '#777' }}>
                  {desc}
                </p>

                <div className="flex flex-col gap-2 mb-6 flex-1">
                  {features.map(({ label, included }) => (
                    <div key={label} className="flex items-start gap-2 text-[11px]"
                      style={{ color: included ? (dark ? 'rgba(255,255,255,.8)' : '#333') : (dark ? 'rgba(255,255,255,.2)' : '#ccc') }}>
                      <span className="mt-0.5 flex-shrink-0 font-bold">{included ? '✓' : '–'}</span>
                      {label}
                    </div>
                  ))}
                </div>

                <Link
                  href={href}
                  className="block w-full text-center py-2.5 rounded-xl text-xs font-bold transition-opacity"
                  style={{
                    background: name === 'Free' ? '#F5F5F5'
                      : name === 'Premium' ? '#3183F7'
                      : 'rgba(255,255,255,.1)',
                    color: name === 'Free' ? '#292929'
                      : name === 'Premium' ? '#fff'
                      : 'rgba(255,255,255,.4)',
                    border: name === 'Platinum' ? '1.5px solid rgba(255,255,255,.15)' : 'none',
                    pointerEvents: disabled ? 'none' : 'auto',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Tous les prix sont TTC · Résiliation possible à tout moment · Pas de frais cachés
          </p>
        </div>
      </section>

      {/* ENTREPRISE BANNER */}
      <section className="px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl px-8 py-6 flex items-center justify-between"
            style={{ background: '#F7F8FA', border: '1.5px solid #E8E8E8' }}
          >
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Entreprise</div>
              <div className="text-sm font-bold text-gray-800 mb-1">Vous formez une équipe ?</div>
              <div className="text-xs text-gray-500">Licences multi-utilisateurs, tableau de bord RH, certifications groupe.</div>
            </div>
            <Link
              href="/entreprise"
              className="flex-shrink-0 px-5 py-2 rounded-lg text-xs font-bold text-white ml-8"
              style={{ background: '#292929' }}
            >
              Voir l&apos;offre entreprise →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Questions fréquentes</h2>
          <div className="flex flex-col gap-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="text-sm font-bold text-gray-800 mb-2">{q}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-14" style={{ background: '#292929' }}>
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Prêt à commencer ?</h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Créez votre compte gratuit en 30 secondes. Aucune carte bancaire requise.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Link href="/auth/register" className="px-6 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#3183F7' }}>
              Commencer gratuitement →
            </Link>
            <Link href="/documentation" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white/70" style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)' }}>
              Voir la documentation
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#292929', borderTop: '1px solid rgba(255,255,255,.06)' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs leading-relaxed">
            © 2026 Spread Finance.<br />Tous droits réservés.
          </div>
          <div className="flex flex-nowrap gap-3">
            {([
              ['/documentation', 'Documentation'],
              ['/articles', 'Articles'],
              ['/elearning', 'E-Learning'],
              ['/entreprise', 'Entreprise'],
              ['/books', 'Livres'],
              ['/glossaire', 'Glossaire'],
              ['/about', 'À propos'],
            ] as [string, string][]).map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-[11px] whitespace-nowrap transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
