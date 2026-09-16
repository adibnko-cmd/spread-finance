import { getChaptersByDomain } from '@/lib/sanity/client'

// SF-DOC-02 / SF-DOC-05 (2026-09-16) — nombres de chapitres LUS DANS SANITY.
// Avant : 5 fichiers codaient en dur 8/6/7/5/6 chapitres par domaine (32 au total, le
// « 32+ » du business plan v2) alors que Sanity en publie beaucoup moins. Conséquences :
// progression calculée sur un dénominateur fictif, et barre de la documentation qui
// comptait des lignes `chapter_progress` de chapitres qui ne sont plus publiés
// (dépassement → bloquée à 100 %).

export const DOMAIN_SLUGS = ['finance', 'maths', 'dev', 'pm', 'ml'] as const
export type DomainSlug = (typeof DOMAIN_SLUGS)[number]

// Objectif pédagogique du parcours complet (curriculum cible), PAS le nombre publié.
// Sert uniquement au seuil du certificat global : un certificat ne doit pas se débloquer
// sur les quelques chapitres publiés aujourd'hui. À recaler quand le curriculum change.
export const CURRICULUM_TARGET: Record<DomainSlug, number> = { finance: 8, maths: 6, dev: 7, pm: 5, ml: 6 }

export type PublishedChapters = Record<string, Set<string>>

/** slugs des chapitres publiés, par domaine. Tableau vide si Sanity est injoignable. */
export async function getPublishedChapters(): Promise<PublishedChapters> {
  const out: PublishedChapters = Object.fromEntries(DOMAIN_SLUGS.map(d => [d, new Set<string>()]))
  const chapters = (await getChaptersByDomain().catch(() => [])) as Array<{ slug?: string; domain?: string }>
  for (const c of chapters) {
    if (c.slug && c.domain) (out[c.domain] ??= new Set()).add(c.slug)
  }
  return out
}

/**
 * Progression d'un domaine : chapitres DISTINCTS, PUBLIÉS, au statut demandé.
 * `pct` vaut `null` quand le domaine n'a aucun chapitre publié (afficher « — », pas 0 %).
 */
export function domainProgress(
  rows: Array<{ chapter_slug?: string | null; domain_slug?: string | null; status?: string | null }>,
  published: PublishedChapters,
  domain: string,
  statuses: string[],
) {
  const slugs = published[domain] ?? new Set<string>()
  const done = new Set(
    rows
      .filter(r => r.domain_slug === domain && r.chapter_slug && slugs.has(r.chapter_slug) && statuses.includes(r.status ?? ''))
      .map(r => r.chapter_slug as string)
  ).size
  const total = slugs.size
  return { done, total, pct: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null }
}
