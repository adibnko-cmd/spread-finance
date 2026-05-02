import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { getArticleBySlug } from '@/lib/sanity/client'
import ExampleTabs from '@/components/ui/ExampleTabs'
import TableOfContents, { type Heading, type RelatedArticle } from '@/app/documentation/[slug]/TableOfContents'
import { createClient } from '@/lib/supabase/server'
import { FlagButton } from '@/components/ui/FlagButton'
import { LikeButton } from '@/components/ui/LikeButton'
import ChapterTracker from '@/app/documentation/[slug]/ChapterTracker'

export const dynamic = 'force-dynamic'

const FLASHCARD_SLUGS = new Set([
  'options-call-put-black-scholes',
  'options-digitales',
  'futures-forwards',
])

const DOMAIN_META: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

function computeReadingTime(content: Array<{ _type: string; children?: Array<{ text?: string }> }>): number {
  const words = content.reduce((acc, block) => {
    if (block._type !== 'block') return acc
    return acc + (block.children ?? []).reduce((sum, c) => sum + (c.text ?? '').split(/\s+/).filter(Boolean).length, 0)
  }, 0)
  return Math.max(1, Math.ceil(words / 200))
}

const ptComponents: PortableTextComponents = {
  block: {
    h2: ({ children, value }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = slugify(value.children?.map((c: any) => c.text ?? '').join('') ?? '')
      return <h2 id={id} style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '32px 0 10px', paddingBottom: 8, borderBottom: '2px solid #F0F0F0', scrollMarginTop: 24 }}>{children}</h2>
    },
    h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', margin: '24px 0 8px' }}>{children}</h3>,
    normal: ({ children }) => <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, margin: '0 0 18px' }}>{children}</p>,
    blockquote: ({ children }) => (
      <blockquote style={{ borderLeft: '3px solid #3183F7', paddingLeft: 16, margin: '24px 0', color: '#6B7280', fontStyle: 'italic', fontSize: 14 }}>
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#111' }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#555' }}>{children}</em>,
    code: ({ children }) => (
      <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 5, fontSize: 13, fontFamily: 'monospace', color: '#d63384' }}>
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" style={{ color: '#3183F7', textDecoration: 'underline', textUnderlineOffset: 3 }}>
        {children}
      </a>
    ),
  },
  types: {
    undefined: () => null,
    exampleTabs: ({ value }) => (
      <ExampleTabs tabs={value.tabs ?? []} />
    ),
    image: ({ value }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value?.asset?.url ?? value?.url} alt={value?.alt ?? ''} style={{ width: '100%', borderRadius: 12, margin: '24px 0', border: '1.5px solid #E8E8E8' }} />
    ),
    code: ({ value }) => (
      <pre style={{ background: '#1C1C2E', padding: '18px 22px', borderRadius: 14, overflow: 'auto', margin: '24px 0' }}>
        <code style={{ color: '#A3E8A3', fontSize: 13, fontFamily: 'monospace' }}>{value.code}</code>
      </pre>
    ),
  },
  list: {
    bullet: ({ children }) => <ul style={{ paddingLeft: 22, margin: '0 0 18px', color: '#374151' }}>{children}</ul>,
    number: ({ children }) => <ol style={{ paddingLeft: 22, margin: '0 0 18px', color: '#374151' }}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 5 }}>{children}</li>,
    number: ({ children }) => <li style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 5 }}>{children}</li>,
  },
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  let userPlan = 'free'
  let articleProgress: { status: string } | null = null
  let isAcquis = false

  if (user) {
    const [profileRes, progressRes, quizRes] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase.from('chapter_progress').select('status').eq('user_id', user.id).eq('chapter_slug', slug).maybeSingle(),
      supabase.from('quiz_results').select('quiz_level').eq('user_id', user.id).eq('chapter_slug', slug).eq('passed', true),
    ])
    userPlan = profileRes.data?.plan ?? 'free'
    articleProgress = progressRes.data
    const passedLevels = new Set((quizRes.data ?? []).map(r => r.quiz_level))
    isAcquis = passedLevels.has(1) && passedLevels.has(2) && passedLevels.has(3)
  }

  const article = await getArticleBySlug(slug).catch(() => null)
  if (!article) notFound()

  const domain = DOMAIN_META[article.domain]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readingTime = article.estimatedReadingTime ?? computeReadingTime((article.content ?? []) as any)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spread-finance.fr'
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${appUrl}/articles/${slug}`)}`

  const seenIds = new Map<string, number>()
  const headings: Heading[] = (article.content ?? [])
    .filter((b: { _type: string; style?: string }) => b._type === 'block' && b.style === 'h2')
    .map((b: { children?: Array<{ text?: string }> }) => {
      const text = b.children?.map(c => c.text ?? '').join('') ?? ''
      const base = slugify(text)
      const count = seenIds.get(base) ?? 0
      seenIds.set(base, count + 1)
      return { id: count === 0 ? base : `${base}-${count}`, text, level: 'h2' as const }
    })
    .filter((h: Heading) => h.text.length > 0)

  return (
    <div className="min-h-screen" style={{ background: '#fff' }}>
      {/* Navbar */}
      <nav className="h-14 flex items-center justify-between px-8 sticky top-0 z-10" style={{ background: '#292929' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ background: '#3183F7' }}>SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker, cursive', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>
        {/* Barre de recherche */}
        <form action="/documentation" method="GET" className="flex-1 max-w-xs mx-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <circle cx="5" cy="5" r="3.5" stroke="rgba(255,255,255,.4)" strokeWidth="1.3"/>
              <path d="M8 8l2 2" stroke="rgba(255,255,255,.4)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Rechercher dans la doc..."
              className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-white/30 min-w-0"
            />
          </div>
        </form>
        <div className="flex items-center gap-4">
          <Link href="/articles" className="text-xs text-white/50 hover:text-white/90 transition-colors">← Articles</Link>
          <Link href="/documentation" className="text-xs text-white/50 hover:text-white/90 transition-colors">Documentation</Link>
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/login" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>
              Connexion
            </Link>
          )}
        </div>
      </nav>

      <div className="flex justify-center">
      <article className="max-w-2xl w-full px-8 py-12 flex-1 min-w-0">
        {/* Meta + flags */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {domain && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${domain.color}15`, color: domain.color }}>
                {domain.name}
              </span>
            )}
            {article.accessLevel === 'premium' && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#EBF2FF', color: '#1a5fc8' }}>Premium</span>
            )}
            {article.publishedAt && (
              <span className="text-[10px] text-gray-400">
                {new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="text-[10px] text-gray-400">· {readingTime} min de lecture</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LikeButton contentType="article" contentSlug={article.slug} isAuthenticated={isAuthenticated} />
            {isAuthenticated && (
              <>
                <FlagButton contentType="article" contentSlug={article.slug} domainSlug={article.domain} flagType="favorite" userPlan={userPlan} />
                <FlagButton contentType="article" contentSlug={article.slug} domainSlug={article.domain} flagType="to_review" userPlan={userPlan} />
                <FlagButton contentType="article" contentSlug={article.slug} domainSlug={article.domain} flagType="to_read" userPlan={userPlan} />
                <div
                  title={isAcquis ? 'Article acquis — quiz niveaux 1, 2 et 3 réussis ✓' : 'Acquis quand les 3 niveaux de quiz sont réussis'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    border: `1.5px solid ${isAcquis ? '#36D399' : '#E8E8E8'}`,
                    background: isAcquis ? '#E6FAF3' : '#fff',
                    color: isAcquis ? '#0d7a56' : '#9CA3AF',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] font-semibold hidden sm:inline">Acquis</span>
                </div>
              </>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{article.title}</h1>

        {/* Auteur */}
        {article.author?.name && (
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
              style={{ background: domain?.color ?? '#3183F7' }}
            >
              {article.author.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-600">{article.author.name}</span>
            {article.publishedAt && (
              <span className="text-xs text-gray-400">
                · {new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            <span className="text-xs text-gray-400">· {readingTime} min</span>
          </div>
        )}

        {article.excerpt && (
          <p className="text-base text-gray-500 leading-relaxed mb-8 pb-8" style={{ borderBottom: '1.5px solid #EBEBEB' }}>
            {article.excerpt}
          </p>
        )}

        {/* Contenu */}
        {article.content ? (
          <PortableText value={article.content} components={ptComponents} />
        ) : (
          <p className="text-gray-400 text-sm">Contenu à venir.</p>
        )}

        {/* Bouton Lu */}
        {isAuthenticated && (
          <div className="mt-10 flex justify-center">
            <ChapterTracker
              chapterSlug={slug}
              chapterTitle={article.title}
              domainSlug={article.domain}
              initialStatus={articleProgress?.status ?? 'not_started'}
            />
          </div>
        )}

        {/* Quiz CTA */}
        <div
          className="mt-8 p-5 rounded-2xl flex items-center justify-between"
          style={{ background: '#1C1C2E' }}
        >
          <div>
            <div className="text-sm font-bold text-white mb-0.5">Testez vos connaissances</div>
            <div className="text-xs text-white/40">Quiz sur cet article</div>
          </div>
          <Link
            href={`/quiz/${article.slug}?level=1`}
            className="text-xs font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: '#3183F7', color: '#fff' }}
          >
            Commencer le quiz →
          </Link>
        </div>

        {/* Flashcards CTA */}
        {FLASHCARD_SLUGS.has(article.slug) && (
          <div
            className="mt-3 p-5 rounded-2xl flex items-center justify-between"
            style={{ background: '#1C1C2E' }}
          >
            <div>
              <div className="text-sm font-bold text-white mb-0.5">Flashcards disponibles</div>
              <div className="text-xs text-white/40">Révisez les notions clés en cartes</div>
            </div>
            <Link
              href={`/flashcards/${article.slug}`}
              className="text-xs font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: '#A855F7', color: '#fff' }}
            >
              Réviser en flashcards →
            </Link>
          </div>
        )}

        {/* Chapitres liés */}
        {article.relatedChapters && article.relatedChapters.length > 0 && (
          <div className="mt-12 pt-8" style={{ borderTop: '1.5px solid #EBEBEB' }}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chapitres liés</div>
            <div className="flex flex-col gap-2">
              {article.relatedChapters.map((c: { _id: string; slug: string; title: string; domain: string }) => (
                <Link
                  key={c._id}
                  href={`/documentation/${c.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:shadow-sm transition-shadow"
                  style={{ border: '1.5px solid #E8E8E8' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOMAIN_META[c.domain]?.color ?? '#888' }} />
                  <span className="text-xs font-medium text-gray-700 flex-1">{c.title}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3 5h4M5 3l2 2-2 2" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* ── Lien Glossaire ── */}
        <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 4.5h5M4 6.5h5M4 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>Un terme vous échappe ?</span>
          <Link href="/glossaire" className="font-semibold hover:underline" style={{ color: '#3183F7' }}>
            Consulter le glossaire →
          </Link>
        </div>

        {/* ── Partager sur LinkedIn ── */}
        <div className="mt-6 pt-6" style={{ borderTop: '1.5px solid #EBEBEB' }}>
          <a
            href={linkedInShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ border: '1.5px solid #C7DCF5', color: '#0A66C2', background: '#EEF5FF' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect width="16" height="16" rx="3" fill="#0A66C2"/>
              <circle cx="4.5" cy="4.5" r="1" fill="white"/>
              <path d="M4 7v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 12V9.5C8 8.1 9.1 7 10.5 7S13 8.1 13 9.5V12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 7v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Partager cet article sur LinkedIn
          </a>
        </div>
      </article>
      <TableOfContents
        headings={headings}
        quizSlug={article.slug}
        flashcardsSlug={FLASHCARD_SLUGS.has(article.slug) ? article.slug : undefined}
        relatedArticles={article.relatedChapters?.map((c: { _id: string; title: string; slug: string; domain: string }) => ({
          _id: c._id, title: c.title, slug: c.slug, domain: c.domain,
        }))}
        relatedBasePath="/documentation"
        relatedLabel="Chapitres liés"
      />
      </div>
    </div>
  )
}
