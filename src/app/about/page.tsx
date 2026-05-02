import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'À propos — Spread Finance',
  description: 'Spread Finance : la référence francophone pour les professionnels Finance de marché et IT. Notre mission, notre vision, notre équipe.',
}

const VALUES = [
  {
    icon: '🌍',
    color: '#3183F7',
    bg: '#EBF2FF',
    title: 'Accessibilité',
    desc: 'Un savoir de qualité ne devrait pas être réservé aux grandes écoles ou aux formations à 10 000€. Spread Finance propose une base solide, gratuite, en français.',
  },
  {
    icon: '🎯',
    color: '#36D399',
    bg: '#E6FAF3',
    title: 'Excellence',
    desc: 'Chaque contenu est rédigé et relu par des praticiens. Pas de remplissage, pas de théorie déconnectée : des ressources directement applicables sur le terrain.',
  },
  {
    icon: '🤝',
    color: '#A855F7',
    bg: '#F3EFFF',
    title: 'Communauté',
    desc: 'Spread Finance est une plateforme vivante. Les retours des apprenants, des consultants et des recruteurs alimentent l\'évolution du contenu.',
  },
]

const TIMELINE = [
  { year: '2025', event: 'Naissance du projet — première version de la documentation Finance de marché.' },
  { year: 'T1 2026', event: 'Lancement public — documentation, quiz, gamification et dashboard personnel.' },
  { year: 'T3 2026', event: 'E-books et E-Learning — premier catalogue de formations vidéo avec accompagnement.' },
  { year: '2027', event: 'Offre entreprise B2B — formation groupe, évaluation candidats et recrutement qualifié.' },
]

export default async function AboutPage() {
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
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}>
            Notre histoire
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
            Démocratiser le savoir{' '}
            <span style={{ color: '#3183F7' }}>Finance & IT</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xl">
            Spread Finance est née d&apos;un constat simple : les ressources de qualité en Finance de marché et en IT
            sont soit en anglais, soit trop théoriques, soit inaccessibles financièrement.
            Nous avons décidé de changer ça.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Notre mission</p>
              <h2 className="text-2xl font-black text-gray-800 mb-5">Former la prochaine génération de professionnels</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Nous construisons la référence francophone pour les profils qui évoluent à l&apos;intersection de
                la Finance de marché et de l&apos;IT : analystes quantitatifs, développeurs finance, chefs de projets
                bancaires, data scientists.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Notre approche : du contenu structuré, gratuit pour commencer, avec une gamification
                pensée pour maintenir la motivation sur le long terme.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: '#F7F8FA' }}>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">En chiffres</div>
              <div className="flex flex-col gap-5">
                {[
                  { n: '5', l: 'domaines couverts', sub: 'Finance, Maths, Dev, PM, ML' },
                  { n: '32+', l: 'chapitres de documentation', sub: 'Gratuits et accessibles' },
                  { n: '100%', l: 'en français', sub: 'Conçu pour le marché francophone' },
                ].map(({ n, l, sub }) => (
                  <div key={l} className="flex items-start gap-4">
                    <div className="text-2xl font-black text-blue-600 w-14 flex-shrink-0">{n}</div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{l}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="px-8 py-14" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Ce qui nous guide</p>
          <h2 className="text-2xl font-black text-gray-800 mb-8">Nos valeurs</h2>
          <div className="grid grid-cols-3 gap-5">
            {VALUES.map(({ icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-xl p-5 bg-white" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: bg }}>{icon}</div>
                <div className="text-sm font-bold text-gray-800 mb-2" style={{ color }}>{title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-8 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Roadmap</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Notre trajectoire</h2>
          <div className="flex flex-col gap-0">
            {TIMELINE.map(({ year, event }, i) => (
              <div key={year} className="flex gap-5 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: i < 2 ? '#3183F7' : '#CBD5E1' }} />
                  {i < TIMELINE.length - 1 && <div className="w-0.5 h-10" style={{ background: '#E8E8E8' }} />}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-black" style={{ color: i < 2 ? '#3183F7' : '#9CA3AF' }}>{year}</span>
                  <p className="text-sm text-gray-600 mt-0.5">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="px-8 py-14" style={{ background: '#1C1C2E' }}>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-black text-white mb-3">Nous contacter</h2>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                Une question, un partenariat, une idée de contenu ?
                On répond à chaque message.
              </p>
              <div className="flex flex-col gap-3">
                <a href="mailto:contact@spread-finance.fr" className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.3"/></svg>
                  </div>
                  contact@spread-finance.fr
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/><path d="M4 7v5M4 5v0M8 12V9c0-1.1.9-2 2-2s2 .9 2 2v3M8 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                  LinkedIn Spread Finance
                </a>
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)' }}>
              <div className="text-sm font-bold text-white mb-4">Rejoindre la communauté</div>
              <p className="text-white/50 text-xs leading-relaxed mb-5">
                Créez un compte gratuit pour accéder à l&apos;intégralité de la documentation,
                au quiz, aux flashcards et à votre dashboard personnel.
              </p>
              <Link href="/auth/register" className="block w-full text-center py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#3183F7' }}>
                Commencer gratuitement →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#292929' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs">© 2026 Spread Finance. Tous droits réservés.</div>
          <div className="flex gap-4">
            {([['/documentation', 'Documentation'], ['/articles', 'Articles'], ['/elearning', 'E-Learning'], ['/entreprise', 'Entreprise'], ['/books', 'Livres'], ['/glossaire', 'Glossaire']] as [string,string][]).map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-[11px] whitespace-nowrap">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
