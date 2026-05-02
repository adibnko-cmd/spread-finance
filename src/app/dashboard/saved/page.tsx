import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getChaptersByDomain, getArticles } from '@/lib/sanity/client'

export const dynamic = 'force-dynamic'

const FLAG_LABELS: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  favorite:  { label: 'Favoris',   emoji: '❤️',  color: '#F56751', bg: '#FFF5F3' },
  to_review: { label: 'À réviser', emoji: '🔖',  color: '#FFC13D', bg: '#FFFBEB' },
  to_read:   { label: 'À lire',    emoji: '📄',  color: '#3183F7', bg: '#EBF2FF' },
  validated: { label: 'Acquis',    emoji: '✅',  color: '#36D399', bg: '#E6FAF3' },
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev', pm: 'PM', ml: 'ML',
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/saved')

  const [{ data: profile }, { data: flags }, sanityChapters, sanityArticles] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.from('content_flags').select('*').eq('user_id', user.id).order('flagged_at', { ascending: false }),
    getChaptersByDomain().catch(() => []),
    getArticles().catch(() => []),
  ])

  const contentTitleMap = new Map<string, string>([
    ...((sanityChapters ?? []) as Array<{ slug: string; title: string }>).map(c => [c.slug, c.title] as [string, string]),
    ...((sanityArticles  ?? []) as Array<{ slug: string; title: string }>).map(a => [a.slug, a.title] as [string, string]),
  ])

  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  const grouped: Record<string, typeof flags> = {}
  for (const flag of flags ?? []) {
    if (!grouped[flag.flag_type]) grouped[flag.flag_type] = []
    grouped[flag.flag_type]!.push(flag)
  }

  const totalFlags = flags?.length ?? 0

  return (
    <div className="p-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-black text-gray-800">Contenus sauvegardés</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {totalFlags > 0 ? `${totalFlags} élément${totalFlags > 1 ? 's' : ''} sauvegardé${totalFlags > 1 ? 's' : ''}` : 'Aucun contenu sauvegardé'}
          </div>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
            <span className="text-[10px] font-bold text-blue-700">Favoris gratuits · À réviser &amp; À lire = Premium</span>
          </div>
        )}
      </div>

      {totalFlags === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔖</div>
          <div className="text-sm font-bold text-gray-700 mb-2">Rien de sauvegardé pour l&apos;instant</div>
          <div className="text-xs text-gray-400 mb-6 max-w-xs">
            Utilisez les boutons ❤️ sur les chapitres et articles pour les retrouver facilement ici.
          </div>
          <Link href="/documentation" className="text-xs font-bold text-white px-5 py-2.5 rounded-xl" style={{ background: '#3183F7' }}>
            Explorer la documentation →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(['validated', 'favorite', 'to_review', 'to_read'] as const).map(flagType => {
            const items = grouped[flagType] ?? []
            if (items.length === 0) return null
            const cfg = FLAG_LABELS[flagType]
            return (
              <section key={flagType}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{cfg.emoji}</span>
                  <span className="text-xs font-bold text-gray-800">{cfg.label}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map(flag => (
                    <Link
                      key={flag.id}
                      href={flag.content_type === 'chapter' ? `/documentation/${flag.content_slug}` : `/articles/${flag.content_slug}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl transition-all hover:shadow-sm"
                      style={{ border: '1.5px solid #E8E8E8' }}
                    >
                      {/* Content type badge */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {flag.content_type === 'chapter' ? '📖' : flag.content_type === 'article' ? '📰' : '🧩'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">
                          {contentTitleMap.get(flag.content_slug) ?? flag.content_slug}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {flag.domain_slug && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${DOMAIN_COLORS[flag.domain_slug]}15`, color: DOMAIN_COLORS[flag.domain_slug] }}
                            >
                              {DOMAIN_NAMES[flag.domain_slug]}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {new Date(flag.flagged_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-300 flex-shrink-0">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
