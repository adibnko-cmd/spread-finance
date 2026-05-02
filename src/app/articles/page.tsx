import Link from 'next/link'
import { getArticles } from '@/lib/sanity/client'
import SearchTrigger from '@/components/ui/SearchTrigger'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DOMAIN_META: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
  news:    { name: 'Actualité financière',      color: '#36D399' },
}

const DOMAIN_FILTERS = [
  { key: 'all',     label: 'Tous' },
  { key: 'finance', label: 'Finance' },
  { key: 'maths',   label: 'Maths' },
  { key: 'dev',     label: 'Dev' },
  { key: 'pm',      label: 'PM' },
  { key: 'ml',      label: 'ML' },
  { key: 'news',    label: 'Actualité' },
]

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; sort?: string }>
}) {
  const { domain, sort } = await searchParams
  const activeDomain = domain ?? 'all'
  const activeSort   = sort === 'likes' ? 'likes' : 'date'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let articles: Array<{
    _id: string; title: string; slug: string; domain: string
    accessLevel: string; publishedAt: string; estimatedReadingTime?: number
    excerpt?: string; coverImageUrl?: string; author?: { name: string } | null
  }> = []

  try { articles = await getArticles() } catch { /* Sanity non configuré */ }

  // Likes par article
  const { data: likesData } = await supabase
    .from('content_likes')
    .select('content_slug')
    .eq('content_type', 'article')

  const likesMap: Record<string, number> = {}
  for (const row of likesData ?? []) {
    likesMap[row.content_slug] = (likesMap[row.content_slug] ?? 0) + 1
  }

  // Filtre par domaine
  let filtered = activeDomain === 'all'
    ? articles
    : articles.filter(a => a.domain === activeDomain)

  // Tri
  if (activeSort === 'likes') {
    filtered = [...filtered].sort((a, b) => (likesMap[b.slug] ?? 0) - (likesMap[a.slug] ?? 0))
  }

  function buildUrl(params: { domain?: string; sort?: string }) {
    const p = new URLSearchParams()
    const d = params.domain ?? activeDomain
    const s = params.sort  ?? activeSort
    if (d !== 'all')    p.set('domain', d)
    if (s !== 'date')   p.set('sort', s)
    const qs = p.toString()
    return `/articles${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-14 flex items-center justify-between px-8 sticky top-0 z-10" style={{ background: '#292929' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ background: '#3183F7' }}>SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker, cursive', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>
        <SearchTrigger />
        <div className="flex items-center gap-3">
          <Link href="/documentation" className="text-xs text-white/50 hover:text-white/90 transition-colors">Documentation</Link>
          {user ? (
            <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
              Dashboard
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

      <div className="max-w-3xl mx-auto px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3183F7' }}>Blog & Analyses</p>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Articles</h1>
          <p className="text-sm text-gray-500">Analyses de marché, concepts approfondis et actualités du secteur.</p>
        </div>

        {/* Filtres + Tri */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          {/* Catégories */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 flex-wrap">
            {DOMAIN_FILTERS.map(f => {
              const isActive = f.key === activeDomain
              const color = DOMAIN_META[f.key]?.color ?? '#1C1C2E'
              return (
                <Link
                  key={f.key}
                  href={buildUrl({ domain: f.key })}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? color : '#F3F4F6',
                    color:      isActive ? '#fff' : '#6B7280',
                  }}
                >
                  {f.label}
                </Link>
              )
            })}
          </div>

          {/* Tri */}
          <div className="flex gap-1.5 flex-shrink-0">
            {(['date', 'likes'] as const).map(s => (
              <Link
                key={s}
                href={buildUrl({ sort: s })}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: activeSort === s ? '#1C1C2E' : '#F3F4F6',
                  color:      activeSort === s ? '#fff' : '#6B7280',
                }}
              >
                {s === 'date' ? '↓ Date' : '♥ Likes'}
              </Link>
            ))}
          </div>
        </div>

        {/* Articles */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#F9FAFB', border: '1.5px dashed #E8E8E8' }}>
            <div className="text-3xl mb-3">✍️</div>
            <div className="text-sm font-bold text-gray-700 mb-1">
              {articles.length === 0 ? 'Aucun article publié' : 'Aucun article dans cette catégorie'}
            </div>
            <p className="text-xs text-gray-400">
              {articles.length === 0
                ? 'Les articles apparaîtront ici une fois publiés dans Sanity Studio.'
                : 'Essayez une autre catégorie ou consultez tous les articles.'}
            </p>
            {articles.length > 0 && (
              <Link href="/articles" className="inline-block mt-4 text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ background: '#3183F7' }}>
                Voir tous les articles
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map(a => {
              const domainMeta = DOMAIN_META[a.domain]
              const likeCount  = likesMap[a.slug] ?? 0
              return (
                <Link
                  key={a._id}
                  href={`/articles/${a.slug}`}
                  className="group flex gap-5 p-5 rounded-2xl bg-white hover:shadow-md transition-shadow"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  {/* Couleur domaine */}
                  <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: domainMeta?.color ?? '#E8E8E8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${domainMeta?.color ?? '#888'}15`, color: domainMeta?.color ?? '#888' }}
                      >
                        {domainMeta?.name ?? a.domain}
                      </span>
                      {a.accessLevel === 'premium' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>Premium</span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {a.author?.name && (
                        <span className="text-[10px] text-gray-400">· {a.author.name}</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors leading-snug">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#3183F7' }}>
                        Lire l&apos;article
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {likeCount > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          ♥ {likeCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.estimatedReadingTime && (
                    <div className="text-[10px] text-gray-400 flex-shrink-0 mt-1">{a.estimatedReadingTime} min</div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
