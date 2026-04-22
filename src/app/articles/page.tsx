import Link from 'next/link'
import { getArticles } from '@/lib/sanity/client'
import SearchTrigger from '@/components/ui/SearchTrigger'

export const revalidate = 3600

const DOMAIN_META: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

export default async function ArticlesPage() {
  let articles: Array<{
    _id: string; title: string; slug: string; domain: string
    accessLevel: string; publishedAt: string; estimatedReadingTime?: number
    excerpt?: string; coverImageUrl?: string
  }> = []

  try { articles = await getArticles() } catch { /* Sanity non configuré */ }

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
          <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12 w-full">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3183F7' }}>Blog & Analyses</p>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Articles</h1>
          <p className="text-sm text-gray-500">Analyses de marché, concepts approfondis et actualités du secteur.</p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#F9FAFB', border: '1.5px dashed #E8E8E8' }}>
            <div className="text-3xl mb-3">✍️</div>
            <div className="text-sm font-bold text-gray-700 mb-1">Aucun article publié</div>
            <p className="text-xs text-gray-400">Les articles apparaîtront ici une fois publiés dans Sanity Studio.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {articles.map(a => {
              const domain = DOMAIN_META[a.domain]
              return (
                <Link
                  key={a._id}
                  href={`/articles/${a.slug}`}
                  className="group flex gap-5 p-5 rounded-2xl bg-white hover:shadow-md transition-shadow"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  {/* Couleur domaine */}
                  <div
                    className="w-1 rounded-full flex-shrink-0 self-stretch"
                    style={{ background: domain?.color ?? '#E8E8E8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${domain?.color ?? '#888'}15`, color: domain?.color ?? '#888' }}
                      >
                        {domain?.name ?? a.domain}
                      </span>
                      {a.accessLevel === 'premium' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>Premium</span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors leading-snug">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.excerpt}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold" style={{ color: '#3183F7' }}>
                      Lire l&apos;article
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
