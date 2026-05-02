import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'E-Books — Spread Finance',
  description: 'Les e-books de référence en Finance de marché, Mathématiques financières, Python et Machine Learning.',
}

const BOOKS = [
  {
    title: 'Fondamentaux de la Finance de Marché',
    subtitle: 'Actions, obligations, taux et change — du concept à la pratique',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF',
    price: 29, pages: 280, level: 'Intermédiaire',
    topics: ['Classes d\'actifs', 'Lecture de marché', 'Gestion du risque', 'Pricing des dérivés'],
    soon: true,
  },
  {
    title: 'Python pour la Finance',
    subtitle: 'Automatisation, analyse de données et modélisation financière avec Python',
    domain: 'Dev & Quant', color: '#1a5fc8', bg: '#E8F0FE',
    price: 24, pages: 240, level: 'Intermédiaire',
    topics: ['Pandas & NumPy', 'Backtesting', 'APIs marchés', 'Visualisation'],
    soon: true,
  },
  {
    title: 'Mathématiques Financières',
    subtitle: 'Du calcul stochastique aux modèles de Black-Scholes et au-delà',
    domain: 'Maths', color: '#A855F7', bg: '#F3EFFF',
    price: 22, pages: 210, level: 'Avancé',
    topics: ['Probabilités', 'Processus stochastiques', 'Black-Scholes', 'Monte-Carlo'],
    soon: true,
  },
  {
    title: 'Machine Learning Appliqué à la Finance',
    subtitle: 'Prédiction, NLP financier et détection d\'anomalies sur données de marché',
    domain: 'ML & IA', color: '#F56751', bg: '#FEF0EE',
    price: 27, pages: 255, level: 'Avancé',
    topics: ['Régression & Classification', 'Séries temporelles', 'NLP financier', 'Deep Learning'],
    soon: true,
  },
  {
    title: 'Guide du Chef de Projet IT',
    subtitle: 'Méthodes Agile, Scrum et gestion de projet en environnement bancaire',
    domain: 'Gestion de projet', color: '#FFC13D', bg: '#FFF8E6',
    price: 19, pages: 180, level: 'Débutant',
    topics: ['Agile & Scrum', 'Roadmap produit', 'Gestion des risques', 'Stakeholders'],
    soon: true,
  },
  {
    title: 'Dérivés & Produits Structurés',
    subtitle: 'Maîtriser les options, swaps et produits structurés — théorie et marché',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF',
    price: 32, pages: 310, level: 'Expert',
    topics: ['Options & Greeks', 'Swaps de taux', 'Produits structurés', 'Stratégies de trading'],
    soon: true,
  },
]

const LEVEL_COLORS: Record<string, string> = {
  'Débutant': '#36D399', 'Intermédiaire': '#FFC13D', 'Avancé': '#F56751', 'Expert': '#A855F7',
}

export default async function BooksPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}>
            📚 E-Books Spread Finance
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Les livres qui font{' '}
            <span style={{ color: '#3183F7' }}>la différence</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Des e-books de référence, co-écrits par des praticiens de la Finance de marché et de l&apos;IT.
            Concis, actuels, opérationnels.
          </p>
          <div className="flex items-center gap-8 justify-center">
            {[['6', 'e-books'], ['1 200+', 'pages'], ['5', 'domaines'], ['100%', 'pratique']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-white text-xl font-black">{n}</div>
                <div className="text-white/40 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Catalogue</p>
              <h2 className="text-2xl font-black text-gray-800">Tous nos e-books</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#FFF8E6', color: '#b37700' }}>Bientôt disponibles</span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {BOOKS.map(({ title, subtitle, domain, color, bg, price, pages, level, topics, soon }) => (
              <div key={title} className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
                {/* Couverture */}
                <div className="h-36 flex items-end p-4 relative" style={{ background: bg }}>
                  <div className="absolute top-4 right-4">
                    {soon && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFF8E6', color: '#b37700' }}>Bientôt</span>}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{domain}</span>
                    <div className="text-sm font-black text-gray-900 leading-tight mt-0.5">{title}</div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{subtitle}</p>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${LEVEL_COLORS[level]}20`, color: LEVEL_COLORS[level] }}>{level}</span>
                    <span className="text-[10px] text-gray-400">{pages} pages</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {topics.map(t => (
                      <span key={t} className="text-[9px] font-medium px-2 py-0.5 rounded-md" style={{ background: '#F5F5F5', color: '#666' }}>{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-gray-800">{price}€</span>
                    <button
                      disabled
                      className="text-xs font-bold px-4 py-1.5 rounded-lg cursor-not-allowed"
                      style={{ background: '#F5F5F5', color: '#aaa' }}
                    >
                      Bientôt disponible
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUNDLE */}
      <section className="px-8 py-12" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1C1C2E' }}>
            <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Offre Bundle</div>
            <h3 className="text-2xl font-black text-white mb-3">La collection complète</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
              Les 6 e-books en une seule fois. Accès immédiat et mises à jour incluses.
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-3xl font-black text-white">99€</span>
              <span className="text-white/30 text-sm line-through">153€</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#36D39920', color: '#36D399' }}>−35%</span>
            </div>
            <button disabled className="px-8 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)' }}>
              Bientôt disponible
            </button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="px-8 py-14">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-800 mb-3">Soyez notifié à la sortie</h2>
          <p className="text-gray-500 text-sm mb-6">Inscrivez-vous pour recevoir une notification dès que les e-books sont disponibles, avec un tarif de lancement.</p>
          <Link href="/auth/register" className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#3183F7' }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#292929' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs">© 2026 Spread Finance.</div>
          <div className="flex gap-4">
            {[['/documentation', 'Documentation'], ['/about', 'À propos'], ['/elearning', 'E-Learning'], ['/entreprise', 'Entreprise'], ['/glossaire', 'Glossaire']].map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-xs">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
