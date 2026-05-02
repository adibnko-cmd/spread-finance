import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'E-Learning — Spread Finance',
  description: 'Formations vidéo structurées avec accompagnement personnalisé en Finance de marché et IT.',
}

const COURSES = [
  { title: 'Finance de Marché — Niveau 1', duration: '28h', modules: 12, color: '#3183F7', badge: 'Bestseller' },
  { title: 'Python pour la Finance', duration: '22h', modules: 9, color: '#A855F7', badge: '' },
  { title: 'Machine Learning Appliqué', duration: '20h', modules: 10, color: '#F56751', badge: '' },
  { title: 'Gestion de Projet Agile & IT', duration: '14h', modules: 7, color: '#FFC13D', badge: '' },
  { title: 'Maths Financières — Quantitatif', duration: '18h', modules: 8, color: '#36D399', badge: '' },
  { title: 'Dérivés & Produits Structurés', duration: '25h', modules: 11, color: '#1a5fc8', badge: 'Avancé' },
]

const FEATURES = [
  {
    icon: '🎬',
    title: 'Vidéos HD structurées',
    desc: 'Chaque module est découpé en séquences courtes (5–15 min) pour un apprentissage progressif et efficace.',
  },
  {
    icon: '🧑‍💼',
    title: 'Accompagnement personnalisé',
    desc: 'Un expert dédié suit votre progression, répond à vos questions et vous guide selon vos objectifs.',
  },
  {
    icon: '🧪',
    title: 'Exercices pratiques',
    desc: 'Cas réels, exercices Python, QCM évaluatifs et projets appliqués pour ancrer chaque notion.',
  },
  {
    icon: '📜',
    title: 'Certification à la clé',
    desc: 'Obtenez un certificat Spread Finance reconnu à la fin de chaque parcours validé.',
  },
]

const STEPS = [
  { n: '01', title: 'Choisissez votre parcours', desc: 'Sélectionnez un domaine adapté à vos objectifs professionnels.' },
  { n: '02', title: 'Apprenez à votre rythme', desc: 'Vidéos, lectures et exercices accessibles 24h/24 depuis tous vos appareils.' },
  { n: '03', title: 'Échangez avec votre coach', desc: 'Sessions de suivi régulières avec un expert pour débloquer vos points durs.' },
  { n: '04', title: 'Obtenez votre certification', desc: 'Validation finale et certificat numérique partageable sur LinkedIn.' },
]

export default async function ElearningPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: 'rgba(168,85,247,.18)', border: '1px solid rgba(168,85,247,.3)', color: '#A855F7' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Prochainement — Rejoignez la liste d&apos;attente
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Formez-vous avec <span style={{ color: '#3183F7' }}>un expert à vos côtés</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Vidéos HD, exercices pratiques, accompagnement personnalisé et certifications.
            La formation Finance & IT la plus complète du marché francophone.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Link href="/auth/register" className="px-6 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#3183F7' }}>
              Rejoindre la liste d&apos;attente →
            </Link>
            <Link href="/documentation" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white/75" style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)' }}>
              Explorer la doc gratuite
            </Link>
          </div>
          <div className="flex items-center gap-8 justify-center mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
            {[['6', 'parcours'], ['150+', 'vidéos'], ['1:1', 'coaching'], ['100%', 'en français']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-white text-xl font-black">{n}</div>
                <div className="text-white/40 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Pourquoi Spread E-Learning</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Une formation, pas juste des vidéos</h2>
          <div className="grid grid-cols-2 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl" style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="px-8 py-16" style={{ background: '#F7F8FA' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Processus</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Comment ça marche</h2>
          <div className="flex flex-col gap-0">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="flex gap-5 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: '#3183F7' }}>{n}</div>
                  {i < STEPS.length - 1 && <div className="w-0.5 h-10 mt-1" style={{ background: '#E8E8E8' }} />}
                </div>
                <div className="pb-8 pt-2">
                  <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section className="px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Catalogue</p>
          <h2 className="text-2xl font-black text-gray-800 mb-10">Nos parcours de formation</h2>
          <div className="grid grid-cols-2 gap-4">
            {COURSES.map(({ title, duration, modules, color, badge }) => (
              <div key={title} className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
                <div className="h-24 flex items-center justify-center relative" style={{ background: `${color}18` }}>
                  <div className="w-12 h-12 rounded-2xl" style={{ background: color, opacity: 0.35 }} />
                  {badge && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{badge}</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-gray-800 mb-2">{title}</div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>⏱ {duration}</span>
                    <span>📚 {modules} modules</span>
                  </div>
                  <div className="mt-3 py-1.5 px-3 rounded-lg text-center text-[10px] font-bold" style={{ background: '#F5F5F5', color: '#888' }}>
                    Prochainement
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-16" style={{ background: '#1C1C2E' }}>
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Soyez parmi les premiers</h2>
          <p className="text-white/50 text-sm mb-8">Accès anticipé, tarif préférentiel, et un coach dédié dès le lancement.</p>
          <Link href="/auth/register" className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#3183F7' }}>
            Rejoindre la liste d&apos;attente →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#292929' }} className="px-8 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs">© 2026 Spread Finance.</div>
          <div className="flex gap-4">
            {([['/documentation', 'Documentation'], ['/about', 'À propos'], ['/glossaire', 'Glossaire'], ['/entreprise', 'Entreprise'], ['/books', 'Livres']] as [string,string][]).map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-[11px] whitespace-nowrap">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
