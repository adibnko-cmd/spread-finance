import Link from 'next/link'
import { getChaptersByDomain } from '@/lib/sanity/client'
import type { SanityChapter } from '@/types'

export const revalidate = 3600 // Revalidation ISR toutes les heures

const DOMAIN_META = {
  finance: { name: 'Finance de marché',        color: '#3183F7', chapters: 8 },
  maths:   { name: 'Mathématiques financières', color: '#A855F7', chapters: 6 },
  dev:     { name: 'Développement IT',          color: '#1a5fc8', chapters: 7 },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D', chapters: 5 },
  ml:      { name: 'Machine Learning',          color: '#F56751', chapters: 6 },
}

type DomainSlug = keyof typeof DOMAIN_META

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: { domain?: string }
}) {
  const activeDomain = (searchParams.domain ?? 'finance') as DomainSlug

  let chapters: SanityChapter[] = []
  try {
    chapters = await getChaptersByDomain()
  } catch {
    // CMS non configuré — afficher une page squelette
    chapters = []
  }

  // Grouper par domaine → partie → chapitres
  const byDomain = Object.fromEntries(
    Object.keys(DOMAIN_META).map(d => [
      d,
      chapters.filter(c => c.domain === d)
    ])
  )

  const activeDomainChapters = byDomain[activeDomain] ?? []

  // Grouper par partie
  const byPart: Record<number, SanityChapter[]> = {}
  for (const c of activeDomainChapters) {
    if (!byPart[c.part]) byPart[c.part] = []
    byPart[c.part].push(c)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar publique */}
      <nav className="h-14 flex items-center justify-between px-8" style={{ background: '#292929' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ background: '#3183F7' }}>SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker, cursive', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>
        {/* Recherche */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1 max-w-xs mx-8" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.3"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span className="text-xs text-white/30 flex-1">Rechercher dans la documentation...</span>
          <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,.08)' }}>⌘K</span>
        </div>
        <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
          Mon dashboard
        </Link>
      </nav>

      {/* Layout 3 colonnes */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* SIDEBAR GAUCHE */}
        <aside className="w-56 flex-shrink-0 overflow-y-auto" style={{ background: '#F9FAFB', borderRight: '1px solid #EBEBEB' }}>
          {/* Recherche filtrer */}
          <div className="p-3 pb-0">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: '#fff', border: '1.5px solid #E8E8E8' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#bbb" strokeWidth="1.2"/>
                <path d="M8 8l2 2" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-[10px] text-gray-300">Filtrer...</span>
            </div>
          </div>

          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3 pb-1">Domaines</div>

          {/* Domaines */}
          {(Object.entries(DOMAIN_META) as [DomainSlug, typeof DOMAIN_META.finance][]).map(([slug, meta]) => {
            const isActive = slug === activeDomain
            const domChapters = byDomain[slug] ?? []
            const validatedCount = 0 // Sera récupéré côté client avec l'état utilisateur

            return (
              <div key={slug} className="mb-0.5">
                <Link
                  href={`/documentation?domain=${slug}`}
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                  style={{ background: isActive ? 'rgba(0,0,0,.04)' : 'transparent' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                  <span className="text-xs font-bold text-gray-800 flex-1">{meta.name}</span>
                  <span className="text-[10px] text-gray-400">{meta.chapters}</span>
                  <span className="text-xs text-gray-400">{isActive ? '▾' : '›'}</span>
                </Link>

                {/* Chapitres si domaine actif */}
                {isActive && (
                  <div className="pb-1">
                    {Object.entries(byPart).length > 0
                      ? Object.entries(byPart).sort(([a], [b]) => Number(a) - Number(b)).map(([part, chs]) => (
                          <div key={part}>
                            <div className="px-4 py-1.5 pb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                                P{part} — {chs[0]?.partTitle ?? `Partie ${part}`}
                              </span>
                            </div>
                            {chs.map(ch => (
                              <Link
                                key={ch._id}
                                href={`/documentation/${ch.slug.current}`}
                                className="flex items-center gap-2 pl-7 pr-4 py-2 hover:bg-gray-100 relative"
                              >
                                <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ background: '#f0f0f0' }}>
                                  <div className="w-2 h-2 rounded-sm" style={{ background: '#ddd' }} />
                                </div>
                                <span className="text-[11px] font-medium text-gray-600 leading-tight flex-1">{ch.title}</span>
                              </Link>
                            ))}
                          </div>
                        ))
                      : (
                          // Squelette si Sanity pas configuré
                          <div className="px-4 py-2">
                            <div className="text-[10px] text-gray-400 italic">Contenu Sanity requis</div>
                            {['Organisation et acteurs des marchés', 'Fonctionnement d\'une salle des marchés'].map(title => (
                              <div key={title} className="flex items-center gap-2 pl-3 py-2 opacity-40">
                                <div className="w-3.5 h-3.5 rounded bg-gray-200 flex-shrink-0" />
                                <span className="text-[11px] text-gray-500">{title}</span>
                              </div>
                            ))}
                          </div>
                        )
                    }
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              <span>Documentation</span>
              <span className="text-gray-300">›</span>
              <span className="font-semibold" style={{ color: DOMAIN_META[activeDomain].color }}>
                {DOMAIN_META[activeDomain].name}
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-800 mb-2">
              {DOMAIN_META[activeDomain].name}
            </h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              {activeDomainChapters.length > 0
                ? `${activeDomainChapters.length} chapitres disponibles — de la théorie à la pratique.`
                : 'Choisissez un chapitre dans la barre latérale pour commencer à lire.'}
            </p>

            {/* Liste des chapitres si vide dans Sanity */}
            {activeDomainChapters.length === 0 && (
              <div className="rounded-xl p-6 text-center" style={{ background: '#F9FAFB', border: '1.5px dashed #E8E8E8' }}>
                <div className="text-xs text-gray-400 mb-3">
                  Aucun chapitre trouvé dans Sanity CMS pour ce domaine.
                </div>
                <div className="text-xs text-gray-400">
                  Configurez Sanity et créez vos premiers chapitres pour les voir apparaître ici.
                </div>
                <a
                  href="https://sanity.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-xs font-bold px-4 py-2 rounded-lg text-white"
                  style={{ background: '#3183F7' }}
                >
                  Ouvrir Sanity Studio →
                </a>
              </div>
            )}

            {/* Chapitres par partie */}
            {Object.entries(byPart).sort(([a], [b]) => Number(a) - Number(b)).map(([part, chs]) => (
              <div key={part} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: DOMAIN_META[activeDomain].color }}>
                    Partie {part} — {chs[0]?.partTitle ?? `Partie ${part}`}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {chs.map((ch, i) => (
                    <Link
                      key={ch._id}
                      href={`/documentation/${ch.slug.current}`}
                      className="flex items-center gap-3 p-4 rounded-xl hover:shadow-sm transition-shadow"
                      style={{ background: '#fff', border: '1.5px solid #E8E8E8' }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${DOMAIN_META[activeDomain].color}15`, color: DOMAIN_META[activeDomain].color }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 mb-0.5">{ch.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{ch.estimatedReadingTime ?? '?'} min</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: ch.accessLevel === 'free' ? '#E6FAF3' : '#EBF2FF',
                              color:      ch.accessLevel === 'free' ? '#0d7a56' : '#1a5fc8',
                            }}
                          >
                            {ch.accessLevel === 'free' ? 'Free' : 'Premium'}
                          </span>
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="#bbb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* SIDEBAR DROITE — progression */}
        <aside className="w-44 flex-shrink-0 p-4 overflow-y-auto" style={{ borderLeft: '1px solid #EBEBEB', background: '#FAFAFA' }}>
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Progression</div>
          {(Object.entries(DOMAIN_META) as [DomainSlug, typeof DOMAIN_META.finance][]).map(([slug, meta]) => (
            <div key={slug} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">{meta.name.split(' ')[0]}</span>
                <span className="text-[10px] font-bold" style={{ color: meta.color }}>0%</span>
              </div>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '0%', background: meta.color }} />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
