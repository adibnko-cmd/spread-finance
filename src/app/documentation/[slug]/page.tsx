import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { getChapterBySlug, getEvaluationsByDomain } from '@/lib/sanity/client'
import DocSidebar, { type DocSidebarChapter } from '@/components/documentation/DocSidebar'
import ExampleTabs from '@/components/ui/ExampleTabs'
import { getDocumentationStructure } from '@/lib/sanity/queries'
import { createClient } from '@/lib/supabase/server'
import { DOMAINS } from '@/types'
import ChapterTracker from './ChapterTracker'
import TableOfContents, { type Heading } from './TableOfContents'
import { FlagButton } from '@/components/ui/FlagButton'
import { LikeButton } from '@/components/ui/LikeButton'

export const dynamic = 'force-dynamic'

const FLASHCARD_SLUGS = new Set([
  'options-call-put-black-scholes',
  'options-digitales',
  'futures-forwards',
])

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ── Renderers Portable Text ───────────────────────────────────────────
function buildPtComponents(headingIds: Map<string, string>): PortableTextComponents {
  return {
  block: {
    h1: ({ children }) => (
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '36px 0 12px', lineHeight: 1.25 }}>{children}</h1>
    ),
    h2: ({ children, value }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = headingIds.get(value._key ?? '') ?? slugify(value.children?.map((c: any) => c.text ?? '').join('') ?? '')
      return <h2 id={id} style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', margin: '32px 0 10px', paddingBottom: 8, borderBottom: '2px solid #F0F0F0', lineHeight: 1.3, scrollMarginTop: 24 }}>{children}</h2>
    },
    h3: ({ children, value }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = headingIds.get(value._key ?? '') ?? slugify(value.children?.map((c: any) => c.text ?? '').join('') ?? '')
      return <h3 id={id} style={{ fontSize: 14, fontWeight: 700, color: '#333', margin: '24px 0 8px', scrollMarginTop: 24 }}>{children}</h3>
    },
    normal: ({ children }) => (
      <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.85, margin: '0 0 18px' }}>{children}</p>
    ),
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
      <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 5, fontSize: 12.5, fontFamily: 'monospace', color: '#d63384' }}>
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href ?? ''
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      return (
        <a
          href={href}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          style={{ color: '#3183F7', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          {children}
        </a>
      )
    },
  },
  types: {
    undefined: () => null,
    exampleTabs: ({ value }) => (
      <ExampleTabs tabs={value.tabs ?? []} />
    ),
    code: ({ value }) => (
      <pre style={{ background: '#1C1C2E', padding: '18px 22px', borderRadius: 14, overflow: 'auto', margin: '24px 0', lineHeight: 1.6 }}>
        {value.language && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            {value.language}
          </div>
        )}
        <code style={{ color: '#A3E8A3', fontSize: 13, fontFamily: 'monospace' }}>{value.code}</code>
      </pre>
    ),
    callout: ({ value }) => (
      <div style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF', borderRadius: 12, padding: '14px 18px', margin: '24px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1a5fc8', marginBottom: 5 }}>
          {value.emoji ?? 'ℹ️'} {value.title ?? 'Note'}
        </div>
        <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{value.body}</div>
      </div>
    ),
    image: ({ value }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value?.asset?.url ?? value?.url}
        alt={value?.alt ?? ''}
        style={{ width: '100%', borderRadius: 12, margin: '24px 0', border: '1.5px solid #E8E8E8' }}
      />
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul style={{ paddingLeft: 22, margin: '0 0 18px', color: '#374151' }}>{children}</ul>
    ),
    number: ({ children }) => (
      <ol style={{ paddingLeft: 22, margin: '0 0 18px', color: '#374151' }}>{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li style={{ fontSize: 14.5, lineHeight: 1.8, marginBottom: 5 }}>{children}</li>,
    number: ({ children }) => <li style={{ fontSize: 14.5, lineHeight: 1.8, marginBottom: 5 }}>{children}</li>,
  },
  }
}

function computeReadingTime(content: Array<{ _type: string; children?: Array<{ text?: string }> }>): number {
  const words = content.reduce((acc, block) => {
    if (block._type !== 'block') return acc
    return acc + (block.children ?? []).reduce((sum, c) => sum + (c.text ?? '').split(/\s+/).filter(Boolean).length, 0)
  }, 0)
  return Math.max(1, Math.ceil(words / 200))
}

// ── Page ─────────────────────────────────────────────────────────────
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [chapter, allChapters] = await Promise.all([
    getChapterBySlug(slug).catch(() => null),
    getDocumentationStructure().catch(() => []),
  ])

  if (!chapter) notFound()

  // Lien « Évaluation de la partie » seulement si l'évaluation de niveau 1 existe (même règle que SF-QUIZ-01)
  const evalDocs = (await getEvaluationsByDomain(chapter.domain).catch(() => [])) as Array<{ part: number; level: number; questionCount?: number }>
  const evalParts = new Set(evalDocs.filter(e => e.level === 1 && (e.questionCount ?? 0) > 0).map(e => e.part))

  // Auth + plan + progress
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userPlan: 'free' | 'premium' | 'platinum' = 'free'
  let chapterProgress: { status: string; scroll_percent: number; time_spent_seconds: number } | null = null
  let isAcquis = false

  if (user) {
    const [profileRes, progressRes, quizRes] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase
        .from('chapter_progress')
        .select('status, scroll_percent, time_spent_seconds')
        .eq('user_id', user.id)
        .eq('chapter_slug', slug)
        .maybeSingle(),
      supabase
        .from('quiz_results')
        .select('quiz_level')
        .eq('user_id', user.id)
        .eq('chapter_slug', slug)
        .eq('passed', true),
    ])
    userPlan = (profileRes.data?.plan ?? 'free') as typeof userPlan
    chapterProgress = progressRes.data
    const passedLevels = new Set((quizRes.data ?? []).map(r => r.quiz_level))
    isAcquis = passedLevels.has(1) && passedLevels.has(2) && passedLevels.has(3)
  }

  const domainColor   = DOMAIN_COLORS[chapter.domain] ?? '#3183F7'
  const domainName    = DOMAINS[chapter.domain as keyof typeof DOMAINS]?.name ?? chapter.domain
  const isPremiumLocked = chapter.accessLevel === 'premium' && userPlan === 'free'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readingTime = chapter.estimatedReadingTime ?? computeReadingTime((chapter.content ?? []) as any)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spread-finance.fr'
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${appUrl}/documentation/${slug}`)}`

  // Chapitres du domaine pour la sidebar (triés par partie/ordre)
  const domainChapters = (allChapters as Array<{ _id: string; slug: string; title: string; domain: string; part: number; order: number }>)
    .filter(c => c.domain === chapter.domain)
    .sort((a, b) => a.part - b.part || a.order - b.order)

  const currentIndex = domainChapters.findIndex(c => c.slug === slug)
  const prevChapter  = currentIndex > 0 ? domainChapters[currentIndex - 1] : null
  const nextChapter  = currentIndex < domainChapters.length - 1 ? domainChapters[currentIndex + 1] : null

  // Extraire les headings H2/H3 pour la TOC (IDs dédupliqués)
  // headingIds: _key → id dédupliqué (partagé avec les renderers)
  const seenIds = new Map<string, number>()
  const headingIds = new Map<string, string>()
  const headings: Heading[] = (chapter.content ?? [])
    .filter((b: { _type: string; style?: string }) => b._type === 'block' && (b.style === 'h2' || b.style === 'h3'))
    .map((b: { _key: string; style: string; children?: Array<{ text?: string }> }) => {
      const text = b.children?.map(c => c.text ?? '').join('') ?? ''
      const base = slugify(text)
      const count = seenIds.get(base) ?? 0
      seenIds.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`
      headingIds.set(b._key, id)
      return { id, text, level: b.style as 'h2' | 'h3' }
    })
    .filter((h: Heading) => h.text.length > 0)

  const ptComponents = buildPtComponents(headingIds)

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav
        className="h-14 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-10"
        style={{ background: '#292929', borderBottom: '1px solid rgba(255,255,255,.06)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
            style={{ background: '#3183F7' }}
          >
            SF
          </div>
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

        <div className="flex items-center gap-5">
          <Link
            href={`/documentation?domain=${chapter.domain}`}
            className="text-xs text-white/50 hover:text-white/90 transition-colors"
          >
            ← {domainName}
          </Link>
          <Link
            href="/articles"
            className="text-xs text-white/50 hover:text-white/90 transition-colors"
          >
            Articles
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold text-white px-4 py-1.5 rounded-lg"
              style={{ background: '#3183F7' }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-bold text-white px-4 py-1.5 rounded-lg"
              style={{ background: '#3183F7' }}
            >
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      {/* ── Layout ── */}
      <div className="flex flex-1">
        {/* Sidebar gauche — même barre que /documentation, domaine du chapitre ouvert (SF-DOC-01) */}
        <DocSidebar
          chapters={allChapters as DocSidebarChapter[]}
          activeDomain={chapter.domain}
          activeSlug={slug}
          evalParts={evalParts}
          className="sticky top-14"
          style={{ height: 'calc(100vh - 56px)' }}
        />

        {/* Contenu principal */}
        <main className="flex-1" id="chapter-main">
          <div className="max-w-2xl mx-auto px-8 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-6">
              <Link href="/documentation" className="hover:text-gray-600 transition-colors">Documentation</Link>
              <span className="text-gray-300">›</span>
              <Link
                href={`/documentation?domain=${chapter.domain}`}
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: domainColor }}
              >
                {domainName}
              </Link>
              <span className="text-gray-300">›</span>
              <span className="text-gray-600 font-medium truncate max-w-xs">{chapter.title}</span>
            </div>

            {/* En-tête du chapitre */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${domainColor}12`, color: domainColor }}
                  >
                    Partie {chapter.part} — {chapter.partTitle}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: chapter.accessLevel === 'free' ? '#E6FAF3' : '#EBF2FF',
                      color:      chapter.accessLevel === 'free' ? '#0d7a56' : '#1a5fc8',
                    }}
                  >
                    {chapter.accessLevel === 'free' ? 'Free' : 'Premium'}
                  </span>
                  {chapter.difficulty && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      {DIFFICULTY_LABELS[chapter.difficulty]}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">· {readingTime} min de lecture</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <LikeButton contentType="chapter" contentSlug={slug} isAuthenticated={!!user} />
                  {user && (
                    <>
                      <FlagButton contentType="chapter" contentSlug={slug} domainSlug={chapter.domain} flagType="favorite" userPlan={userPlan} />
                      <FlagButton contentType="chapter" contentSlug={slug} domainSlug={chapter.domain} flagType="to_review" userPlan={userPlan} />
                      <FlagButton contentType="chapter" contentSlug={slug} domainSlug={chapter.domain} flagType="to_read" userPlan={userPlan} />
                      {/* Acquis — lecture seule, vert si niveaux 1+2+3 réussis */}
                      <div
                        title={isAcquis ? 'Chapitre acquis — quiz niveaux 1, 2 et 3 réussis ✓' : 'Acquis quand les 3 niveaux de quiz sont réussis'}
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

              <h1 className="text-2xl font-black text-gray-900 mb-3 leading-tight">{chapter.title}</h1>

              {chapter.excerpt && (
                <p className="text-sm text-gray-500 leading-relaxed">{chapter.excerpt}</p>
              )}
            </div>

            {/* Séparateur */}
            <div style={{ height: 1, background: '#EBEBEB', margin: '0 0 32px' }} />

            {/* ── Contenu ── */}
            {isPremiumLocked ? (
              /* Paywall */
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: 'linear-gradient(135deg, #EBF2FF 0%, #F5F0FF 100%)', border: '1.5px solid #C7DCFF' }}
              >
                <div className="text-3xl mb-4">🔒</div>
                <div className="text-lg font-black text-gray-800 mb-2">Contenu Premium</div>
                <p className="text-sm text-gray-500 mb-2">Ce chapitre est réservé aux membres Premium.</p>
                <p className="text-xs text-gray-400 mb-6">
                  Accédez à tous les chapitres, quiz avancés et flashcards.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#3183F7' }}
                >
                  Passer Premium →
                </Link>
              </div>
            ) : chapter.content ? (
              /* Portable Text */
              <div>
                <PortableText value={chapter.content} components={ptComponents} />
              </div>
            ) : (
              /* Pas de contenu encore */
              <div className="py-16 text-center rounded-2xl" style={{ background: '#F9FAFB', border: '1.5px dashed #E8E8E8' }}>
                <div className="text-gray-400 text-sm mb-2">Contenu à venir</div>
                <div className="text-xs text-gray-300">
                  Ajoutez du contenu dans{' '}
                  <a href="/studio" className="underline" style={{ color: '#3183F7' }}>Sanity Studio</a>
                </div>
              </div>
            )}

            {/* ── Barre de navigation prev/next ── */}
            <div
              className="flex items-center justify-between mt-12 pt-6"
              style={{ borderTop: '1.5px solid #EBEBEB' }}
            >
              {prevChapter ? (
                <Link
                  href={`/documentation/${prevChapter.slug}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors max-w-[45%]"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="truncate">{prevChapter.title}</span>
                </Link>
              ) : <div />}

              {nextChapter ? (
                <Link
                  href={`/documentation/${nextChapter.slug}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors max-w-[45%]"
                >
                  <span className="truncate">{nextChapter.title}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 6h4M8 6L5 3M8 6L5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ) : <div />}
            </div>

            {/* ── Bouton Lu ── */}
            {user && !isPremiumLocked && (
              <div className="mt-10 flex justify-center">
                <ChapterTracker
                  chapterSlug={slug}
                  chapterTitle={chapter.title}
                  domainSlug={chapter.domain}
                  initialStatus={chapterProgress?.status ?? 'not_started'}
                />
              </div>
            )}

            {/* ── CTA Quiz ── */}
            {chapter.quizAvailable && !isPremiumLocked && (
              <div
                className="mt-8 p-5 rounded-2xl flex items-center justify-between"
                style={{ background: '#1C1C2E' }}
              >
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">Quiz disponible</div>
                  <div className="text-xs text-white/40">Testez vos connaissances sur ce chapitre</div>
                </div>
                <Link
                  href={`/quiz/${slug}?level=1`}
                  className="text-xs font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: '#3183F7', color: '#fff' }}
                >
                  Commencer le quiz →
                </Link>
              </div>
            )}

            {/* ── CTA Flashcards ── */}
            {FLASHCARD_SLUGS.has(slug) && !isPremiumLocked && (
              <div
                className="mt-3 p-5 rounded-2xl flex items-center justify-between"
                style={{ background: '#1C1C2E' }}
              >
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">Flashcards disponibles</div>
                  <div className="text-xs text-white/40">Révisez les notions clés en cartes</div>
                </div>
                <Link
                  href={`/flashcards/${slug}`}
                  className="text-xs font-bold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: '#A855F7', color: '#fff' }}
                >
                  Réviser en flashcards →
                </Link>
              </div>
            )}

            {/* ── Flashcard PDF ── */}
            {chapter.flashcard?.asset?.url && !isPremiumLocked && (
              <a
                href={chapter.flashcard.asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FEF0EE' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2h6l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#F56751" strokeWidth="1.3"/>
                    <path d="M10 2v4h4" stroke="#F56751" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M6 9h4M6 11.5h2.5" stroke="#F56751" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">Flashcard PDF</div>
                  <div className="text-[10px] text-gray-400">Télécharger la fiche de révision</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto">
                  <path d="M6 2v6M3 6l3 3 3-3" stroke="#bbb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )}

            {/* ── Chapitres liés ── */}
            {chapter.relatedChapters && chapter.relatedChapters.length > 0 && (
              <div className="mt-8">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Chapitres liés
                </div>
                <div className="flex flex-col gap-2">
                  {chapter.relatedChapters.map((r: { _id: string; slug: string; title: string; domain: string }) => (
                    <Link
                      key={r._id}
                      href={`/documentation/${r.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:shadow-sm transition-shadow"
                      style={{ border: '1.5px solid #E8E8E8', background: '#fff' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: DOMAIN_COLORS[r.domain] ?? '#888' }}
                      />
                      <span className="text-xs font-medium text-gray-700 flex-1">{r.title}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 5h4M5 3l2 2-2 2" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* ── Lien Glossaire ── */}
            <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
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
                Partager ce chapitre sur LinkedIn
              </a>
            </div>

            <SiteFooter variant="reading" />
          </div>
        </main>

        {/* TOC droite — colonne fixe */}
        <TableOfContents
          headings={headings.filter(h => h.level === 'h2')}
          quizSlug={chapter.quizAvailable && !isPremiumLocked ? slug : undefined}
          flashcardsSlug={FLASHCARD_SLUGS.has(slug) && !isPremiumLocked ? slug : undefined}
          relatedArticles={chapter.relatedArticles}
        />
      </div>
    </div>
  )
}
