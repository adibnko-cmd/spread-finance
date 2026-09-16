import Link from 'next/link'
import { domainProgress, type PublishedChapters } from '@/lib/content-stats'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { getChaptersByDomain } from '@/lib/sanity/client'
import { createClient } from '@/lib/supabase/server'
import type { SanityChapter } from '@/types'
import SearchTrigger from '@/components/ui/SearchTrigger'
import DocSidebar, { type DocSidebarChapter } from '@/components/documentation/DocSidebar'

export const dynamic = 'force-dynamic'

const DOMAIN_META = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

type DomainSlug = keyof typeof DOMAIN_META

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const { domain } = await searchParams
  const activeDomain = (domain ?? 'finance') as DomainSlug

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let chapters: SanityChapter[] = []
  try {
    chapters = await getChaptersByDomain()
  } catch {
    // CMS non configuré — afficher une page squelette
    chapters = []
  }

  // Progression par domaine
  // SF-DOC-02 (2026-09-16) : on ne compte que des chapitres distincts ET publiés (voir lib/content-stats).
  let progressRows: Array<{ chapter_slug: string; domain_slug: string; status: string }> = []
  if (user) {
    const { data: progressData } = await supabase
      .from('chapter_progress')
      .select('chapter_slug, domain_slug, status')
      .eq('user_id', user.id)
      .in('status', ['completed', 'validated'])
    progressRows = progressData ?? []
  }
  const published: PublishedChapters = Object.fromEntries(
    Object.keys(DOMAIN_META).map(d => [d, new Set(chapters.filter(c => c.domain === d).map(c => {
      const s = c.slug as unknown as string | { current: string }
      return typeof s === 'string' ? s : s?.current
    }).filter(Boolean) as string[])])
  )

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
        <SearchTrigger />
        <div className="flex items-center gap-5">
          <Link href="/articles" className="text-xs text-white/50 hover:text-white/90 transition-colors">
            Articles
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
              Mon dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg transition-colors" style={{ border: '1.5px solid rgba(255,255,255,.3)' }}>
                Connexion
              </Link>
              <Link href="/auth/register" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
                Commencer gratuitement
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Layout 3 colonnes */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* SIDEBAR GAUCHE — composant partagé avec les chapitres (SF-DOC-01) */}
        <DocSidebar chapters={chapters as unknown as DocSidebarChapter[]} activeDomain={activeDomain} />

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
                      href={`/documentation/${ch.slug}`}
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
          <SiteFooter variant="reading" />
        </main>

        {/* SIDEBAR DROITE — progression */}
        <aside className="w-44 flex-shrink-0 p-4 overflow-y-auto" style={{ borderLeft: '1px solid #EBEBEB', background: '#FAFAFA' }}>
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Progression</div>
          {(Object.entries(DOMAIN_META) as [DomainSlug, typeof DOMAIN_META.finance][]).map(([slug, meta]) => {
            const { pct } = domainProgress(progressRows, published, slug, ['completed', 'validated'])
            return (
              <div key={slug} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-semibold text-gray-600">{meta.name.split(' de')[0].split(' fi')[0]}</span>
                  <span className="text-[10px] font-bold" style={{ color: pct ? meta.color : '#9CA3AF' }}>{pct === null ? '—' : `${pct}%`}</span>
                </div>
                <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct ?? 0}%`, background: meta.color }} />
                </div>
              </div>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
