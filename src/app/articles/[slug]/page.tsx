import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { getArticleBySlug } from '@/lib/sanity/client'
import ExampleTabs from '@/components/ui/ExampleTabs'
import TableOfContents, { type Heading, type RelatedArticle } from '@/app/documentation/[slug]/TableOfContents'

export const dynamic = 'force-dynamic'

const FLASHCARD_SLUGS = new Set([
  'options-call-put-black-scholes',
  'options-digitales',
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
  const article  = await getArticleBySlug(slug).catch(() => null)
  if (!article) notFound()

  const domain = DOMAIN_META[article.domain]

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
        <div className="flex items-center gap-4">
          <Link href="/articles" className="text-xs text-white/50 hover:text-white/90 transition-colors">← Articles</Link>
          <Link href="/documentation" className="text-xs text-white/50 hover:text-white/90 transition-colors">Documentation</Link>
          <Link href="/dashboard" className="text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#3183F7' }}>Dashboard</Link>
        </div>
      </nav>

      <div className="flex justify-center">
      <article className="max-w-2xl w-full px-8 py-12 flex-1 min-w-0">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-5">
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
          {article.estimatedReadingTime && (
            <span className="text-[10px] text-gray-400">· {article.estimatedReadingTime} min de lecture</span>
          )}
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{article.title}</h1>

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

        {/* Quiz CTA */}
        <div
          className="mt-10 p-5 rounded-2xl flex items-center justify-between"
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
