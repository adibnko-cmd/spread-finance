// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Page Home
// Squelette Sprint 1 — à enrichir avec les vrais composants
// ═══════════════════════════════════════════════════════════════════
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Spread Finance — IT & Finance de marché',
  description: 'La référence francophone pour les professionnels IT & Finance de marché.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ── NAVBAR ── */}
      <nav
        style={{ background: '#292929' }}
        className="h-14 flex items-center justify-between px-8"
      >
        <div className="flex items-center gap-3">
          {/* Logo — remplacer par <Logo /> */}
          <div
            style={{ background: '#3183F7', borderRadius: 8, width: 34, height: 34 }}
            className="flex items-center justify-center text-white text-xs font-black"
          >
            SF
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker', color: '#3183F7', fontSize: 9 }}>
              Finance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/documentation"
            className="text-white/50 hover:text-white text-xs font-semibold px-3 py-1"
          >
            Documentation
          </Link>
          <Link
            href="/auth/login"
            className="text-white/60 border border-white/20 rounded-md text-xs font-semibold px-3 py-1.5 hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/auth/register"
            className="text-white text-xs font-bold px-4 py-1.5 rounded-md"
            style={{ background: '#3183F7' }}
          >
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{ background: '#292929' }}
        className="px-8 pt-16 pb-14"
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Plateforme francophone IT & Finance
          </div>
          <h1
            className="text-4xl font-black text-white leading-tight mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Le savoir IT & Finance de marché,{' '}
            <span style={{ color: '#3183F7' }}>accessible à tous</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-7 max-w-lg">
            Documentation structurée, e-learning et outils pratiques pour maîtriser
            la finance de marché et l'IT. Gratuit pour commencer.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background: '#3183F7' }}
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/documentation"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white/75"
              style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)' }}
            >
              Voir la documentation
            </Link>
          </div>
          <div
            className="flex items-center gap-6 mt-8 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}
          >
            {[
              { n: '32', l: 'chapitres' },
              { n: '5',  l: 'domaines' },
              { n: '100%', l: 'en français' },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="text-white text-xl font-black">{n}</div>
                <div className="text-white/40 text-xs font-medium mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALEUR ── */}
      <section className="px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
            Ce que propose Spread Finance
          </p>
          <h2 className="text-2xl font-black text-gray-800 mb-8">
            Tout ce dont vous avez besoin pour progresser
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                color: '#3183F7', bg: '#EBF2FF',
                title: 'Apprendre',
                desc: 'Documentation complète et articles gratuits et accessibles sans inscription.',
              },
              {
                color: '#A855F7', bg: '#F3EFFF',
                title: 'Se former',
                desc: 'Parcours e-learning structurés avec suivi et certifications. Prochainement.',
              },
              {
                color: '#36D399', bg: '#E6FAF3',
                title: 'Progresser',
                desc: 'Dashboard personnel, gamification, badges et suivi de vos performances.',
              },
            ].map(({ color, bg, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5"
                style={{ background: '#fff', border: '1.5px solid #E8E8E8' }}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ background: color, opacity: 0.8 }}
                  />
                </div>
                <div className="text-sm font-bold text-gray-800 mb-2">{title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOMAINES ── */}
      <section className="px-8 py-10" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Parcours</p>
          <h2 className="text-2xl font-black text-gray-800 mb-6">Choisissez votre domaine</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              { slug: 'finance', name: 'Finance de marché', color: '#3183F7', chapters: 8 },
              { slug: 'maths',   name: 'Maths financières', color: '#A855F7', chapters: 6 },
              { slug: 'dev',     name: 'Développement IT',  color: '#1a5fc8', chapters: 7 },
              { slug: 'pm',      name: 'Gestion de projet', color: '#FFC13D', chapters: 5 },
              { slug: 'ml',      name: 'Machine Learning',  color: '#F56751', chapters: 6 },
            ].map(({ slug, name, color, chapters }) => (
              <Link
                key={slug}
                href={`/documentation?domain=${slug}`}
                className="rounded-xl p-3 text-center hover:shadow-sm transition-shadow"
                style={{ background: '#fff', border: '1.5px solid #E8E8E8' }}
              >
                <div
                  className="w-9 h-9 rounded-xl mx-auto mb-2"
                  style={{ background: `${color}20` }}
                />
                <div className="text-xs font-bold text-gray-800 leading-tight mb-1">{name}</div>
                <div className="text-xs text-gray-400">{chapters} ch.</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Tarifs</p>
          <h2 className="text-2xl font-black text-gray-800 mb-8">Une offre pour chaque profil</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                name: 'Free', price: '0€', badge: '', featured: false,
                color: '#292929', bg: '#fff',
                desc: 'Pour découvrir et apprendre les fondamentaux.',
                features: ['Documentation complète', 'Quiz niveaux 1 & 2', 'Gamification'],
                cta: 'Commencer gratuitement', href: '/auth/register',
              },
              {
                name: 'Premium', price: '12€', badge: 'Le plus populaire', featured: true,
                color: '#3183F7', bg: '#fff',
                desc: 'Pour progresser sérieusement.',
                features: ['Tout Free +', 'Quiz avancés', 'Flashcards', 'Jobs'],
                cta: 'Choisir Premium', href: '/auth/register?plan=premium',
              },
              {
                name: 'Platinum', price: '29€', badge: 'Prochainement', featured: false,
                color: '#fff', bg: '#292929',
                desc: 'Formation structurée + certifications.',
                features: ['Tout Premium +', 'E-Learning LMS', 'Certifications'],
                cta: 'Prochainement', href: '#',
              },
            ].map(({ name, price, badge, featured, color, bg, desc, features, cta, href }) => (
              <div
                key={name}
                className="rounded-xl p-5 relative"
                style={{
                  background: bg,
                  border: featured ? '2px solid #3183F7' : '1.5px solid #E8E8E8',
                  opacity: name === 'Platinum' ? 0.75 : 1,
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
                <div className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: name === 'Platinum' ? 'rgba(255,255,255,.5)' : '#888' }}>
                  {name}
                </div>
                <div className="text-3xl font-black mb-1" style={{ color }}>
                  {price}{price !== '0€' && <span className="text-xs font-normal opacity-60">/mois</span>}
                </div>
                <p className="text-xs mb-4" style={{ color: name === 'Platinum' ? 'rgba(255,255,255,.5)' : '#888' }}>
                  {desc}
                </p>
                <div className="flex flex-col gap-1.5 mb-5">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs"
                      style={{ color: name === 'Platinum' ? 'rgba(255,255,255,.7)' : '#444' }}>
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: name === 'Platinum' ? '#3183F7' : '#36D399' }} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href={href}
                  className="block w-full text-center py-2 rounded-lg text-xs font-bold"
                  style={{
                    background: name === 'Free' ? '#f5f5f5'
                      : name === 'Premium' ? '#3183F7'
                      : 'rgba(255,255,255,.1)',
                    color: name === 'Free' ? '#292929'
                      : name === 'Premium' ? '#fff'
                      : 'rgba(255,255,255,.6)',
                    border: name === 'Platinum' ? '1.5px solid rgba(255,255,255,.2)' : 'none',
                    cursor: name === 'Platinum' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#292929' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs">
            © 2026 Spread Finance. Tous droits réservés.
          </div>
          <div className="flex gap-4">
            {['Documentation', 'À propos', 'Contact', 'CGU'].map(l => (
              <a key={l} href="#" className="text-white/30 hover:text-white/60 text-xs">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
