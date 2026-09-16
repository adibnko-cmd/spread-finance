// SF-DOC-01 (2026-09-16) — barre latérale unique de la documentation.
// Avant : /documentation affichait la liste des domaines, et un chapitre affichait une
// autre barre (chapitres du seul domaine, sans les autres domaines) : la navigation
// changeait de forme en entrant dans un chapitre. Les deux pages rendent désormais
// ce composant ; seul le chapitre actif est mis en évidence.
import Link from 'next/link'

export const DOC_DOMAINS = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
} as const

export type DocDomain = keyof typeof DOC_DOMAINS

export interface DocSidebarChapter {
  _id: string
  slug: string | { current: string }
  title: string
  domain: string
  part: number
  partTitle?: string
  order?: number
}

export function chapterSlug(c: DocSidebarChapter): string {
  return typeof c.slug === 'string' ? c.slug : c.slug?.current
}

interface Props {
  chapters:      DocSidebarChapter[]
  activeDomain:  string
  activeSlug?:   string
  /** Parties du domaine actif dont l'évaluation de niveau 1 existe (lien affiché seulement pour elles). */
  evalParts?:    Set<number>
  className?:    string
  style?:        React.CSSProperties
}

export default function DocSidebar({ chapters, activeDomain, activeSlug, evalParts, className, style }: Props) {
  const byDomain: Record<string, DocSidebarChapter[]> = {}
  for (const c of chapters) (byDomain[c.domain] ??= []).push(c)

  const activeChapters = [...(byDomain[activeDomain] ?? [])].sort(
    (a, b) => a.part - b.part || (a.order ?? 0) - (b.order ?? 0)
  )
  const byPart = new Map<number, DocSidebarChapter[]>()
  for (const c of activeChapters) byPart.set(c.part, [...(byPart.get(c.part) ?? []), c])
  const parts = Array.from(byPart.entries()).sort(([a], [b]) => a - b)

  return (
    <aside
      className={`w-56 flex-shrink-0 overflow-y-auto ${className ?? ''}`}
      style={{ background: '#F9FAFB', borderRight: '1px solid #EBEBEB', ...style }}
    >
      <div className="p-3 pb-0">
        <div className="flex items-center gap-1 mb-2">
          <Link href="/" className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 6l5-4 5 4v5a.8.8 0 01-.8.8H1.8A.8.8 0 011 11V6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            Accueil
          </Link>
          <Link href="/articles" className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Articles
          </Link>
        </div>
      </div>

      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3 pb-1">Domaines</div>

      {(Object.entries(DOC_DOMAINS) as [DocDomain, (typeof DOC_DOMAINS)[DocDomain]][]).map(([slug, meta]) => {
        const isActive = slug === activeDomain
        return (
          <div key={slug} className="mb-0.5">
            <Link
              href={`/documentation?domain=${slug}`}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer"
              style={{ background: isActive ? 'rgba(0,0,0,.04)' : 'transparent' }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-xs font-bold text-gray-800 flex-1">{meta.name}</span>
              <span className="text-[10px] text-gray-400">{(byDomain[slug] ?? []).length}</span>
              <span className="text-xs text-gray-400">{isActive ? '▾' : '›'}</span>
            </Link>

            {isActive && (
              <div className="pb-1">
                {parts.length === 0 ? (
                  <div className="px-4 py-2 text-[10px] text-gray-400 italic">Chapitres bientôt disponibles</div>
                ) : parts.map(([part, chs]) => (
                  <div key={part}>
                    <div className="px-4 py-1.5 pb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                        P{part} — {chs[0]?.partTitle ?? `Partie ${part}`}
                      </span>
                    </div>
                    {chs.map(ch => {
                      const s = chapterSlug(ch)
                      const current = s === activeSlug
                      return (
                        <Link
                          key={ch._id}
                          href={`/documentation/${s}`}
                          aria-current={current ? 'page' : undefined}
                          className="flex items-center gap-2 pl-7 pr-4 py-2 hover:bg-gray-100 relative"
                          style={{ background: current ? `${meta.color}12` : undefined }}
                        >
                          <div
                            className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                            style={{ background: current ? `${meta.color}25` : '#f0f0f0' }}
                          >
                            <div className="w-2 h-2 rounded-sm" style={{ background: current ? meta.color : '#ddd' }} />
                          </div>
                          <span
                            className="text-[11px] leading-tight flex-1"
                            style={{ color: current ? '#111' : '#4B5563', fontWeight: current ? 600 : 500 }}
                          >
                            {ch.title}
                          </span>
                        </Link>
                      )
                    })}
                    {evalParts?.has(part) && (
                      <Link
                        href={`/evaluation/${slug}/${part}/1`}
                        className="flex items-center gap-2 ml-7 mr-4 px-2.5 py-1.5 rounded-lg mt-1 mb-1 transition-colors hover:bg-gray-100"
                        style={{ border: `1.5px dashed ${meta.color}50` }}
                      >
                        <span className="text-[10px] font-semibold" style={{ color: meta.color }}>Évaluation de la partie</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
