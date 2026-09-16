import Link from 'next/link'

// SF-DOC-03 (2026-09-16, WF-10 débat Spread Finance) — footer unique du site.
// Avant : 7 pages publiques portaient chacune un footer copié-collé (3 listes de liens
// différentes), et la documentation n'en avait aucun. Un seul composant : la refonte UI
// (FEAT-SF-005) n'aura plus qu'un endroit à restyler.
//
// Deux variantes :
//   - `site`    : bandeau sombre pleine largeur, pages vitrines (home, pricing, about…)
//   - `reading` : ligne claire et discrète, en bas de la colonne de contenu de la
//                 documentation — décision d'Adib : la doc est une zone de lecture type app,
//                 le site « marketing » s'y efface.

const SITE_LINKS: [string, string][] = [
  ['/documentation', 'Documentation'],
  ['/articles', 'Articles'],
  ['/elearning', 'E-Learning'],
  ['/entreprise', 'Entreprise'],
  ['/books', 'Livres'],
  ['/pricing', 'Pricing'],
  ['/glossaire', 'Glossaire'],
  ['/about', 'À propos'],
]

// Pages légales — item P0 du backlog (décision du débat du 2026-09-16) : Mentions légales,
// CGU/CGV, Politique de confidentialité. Décommenter chaque ligne QUAND la page existe,
// jamais avant (un lien de footer vers une 404 est pire qu'une absence).
const LEGAL_LINKS: [string, string][] = [
  // ['/mentions-legales', 'Mentions légales'],
  // ['/cgv', 'CGU / CGV'],
  // ['/confidentialite', 'Confidentialité'],
]

export function SiteFooter({
  variant = 'site',
  className = '',
}: {
  variant?: 'site' | 'reading'
  className?: string
}) {
  const year = new Date().getFullYear()

  if (variant === 'reading') {
    return (
      <footer className={`mt-12 pt-6 flex flex-wrap items-center justify-between gap-3 ${className}`} style={{ borderTop: '1px solid #EBEBEB' }}>
        <span className="text-[11px] text-gray-400">© {year} Spread Finance</span>
        <nav className="flex flex-wrap gap-x-3 gap-y-1">
          {[...SITE_LINKS.filter(([h]) => h !== '/documentation'), ...LEGAL_LINKS].map(([href, label]) => (
            <Link key={href} href={href} className="text-[11px] text-gray-400 hover:text-gray-600 whitespace-nowrap transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    )
  }

  return (
    <footer style={{ background: '#292929' }} className={`px-8 py-8 ${className}`}>
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="text-white/30 text-xs leading-relaxed">
          © {year} Spread Finance.<br />Tous droits réservés.
        </div>
        <nav className="flex flex-wrap gap-3">
          {[...SITE_LINKS, ...LEGAL_LINKS].map(([href, label]) => (
            <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-[11px] whitespace-nowrap transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
