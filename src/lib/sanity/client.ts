// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Sanity client + GROQ queries
// ═══════════════════════════════════════════════════════════════════
import { createClient as createSanityClient } from 'next-sanity'

export const sanityClient = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
  useCdn:    process.env.NODE_ENV === 'production',
  token:     process.env.SANITY_API_TOKEN,
})

// ─────────────────────────────────────────────────────────────────
// GROQ QUERIES
// ─────────────────────────────────────────────────────────────────

// Tous les chapitres groupés par domaine (pour la sidebar)
export const CHAPTERS_BY_DOMAIN_QUERY = `
  *[_type == "chapter"] | order(domain asc, part asc, order asc) {
    _id, title,
    "slug": slug.current,
    domain, part, partTitle, order,
    accessLevel, difficulty, estimatedReadingTime,
    quizAvailable
  }
`

// Un chapitre par slug (lecteur de chapitre)
export const CHAPTER_BY_SLUG_QUERY = `
  *[_type == "chapter" && slug.current == $slug][0] {
    _id, title,
    "slug": slug.current,
    domain, part, partTitle, order,
    accessLevel, difficulty, estimatedReadingTime,
    excerpt, content,
    "flashcardUrl": flashcard.asset->url,
    quizAvailable,
    "relatedArticles": relatedArticles[]-> {
      _id, title, "slug": slug.current, domain, estimatedReadingTime
    },
    "relatedChapters": relatedChapters[]-> {
      _id, title, "slug": slug.current, domain
    }
  }
`

// Chapitres précédent / suivant (navigation)
export const ADJACENT_CHAPTERS_QUERY = `
{
  "prev": *[_type == "chapter" && domain == $domain && part == $part && order < $order] | order(order desc)[0] {
    title, "slug": slug.current
  },
  "next": *[_type == "chapter" && domain == $domain && (part > $part || (part == $part && order > $order))] | order(part asc, order asc)[0] {
    title, "slug": slug.current
  }
}
`

// Quiz d'un chapitre par slug
export const QUIZ_BY_CHAPTER_QUERY = `
  *[_type == "quiz" && chapterSlug == $chapterSlug && level == $level][0] {
    _id, level, chapterSlug,
    questions[] {
      text, explanation,
      answers[] { text, isCorrect }
    }
  }
`

// Tous les articles
export const ARTICLES_QUERY = `
  *[_type == "article"] | order(publishedAt desc) {
    _id, title,
    "slug": slug.current,
    domain, accessLevel, publishedAt,
    estimatedReadingTime, excerpt,
    "coverImageUrl": coverImage.asset->url
  }
`

// Un article par slug
export const ARTICLE_BY_SLUG_QUERY = `
  *[_type == "article" && slug.current == $slug][0] {
    _id, title,
    "slug": slug.current,
    domain, accessLevel, publishedAt,
    estimatedReadingTime, content,
    "coverImageUrl": coverImage.asset->url,
    "relatedChapters": relatedChapters[]-> {
      _id, title, "slug": slug.current, domain
    }
  }
`

// ─────────────────────────────────────────────────────────────────
// FETCH HELPERS
// ─────────────────────────────────────────────────────────────────
export async function getChaptersByDomain() {
  return sanityClient.fetch(CHAPTERS_BY_DOMAIN_QUERY)
}

export async function getChapterBySlug(slug: string) {
  return sanityClient.fetch(CHAPTER_BY_SLUG_QUERY, { slug })
}

export async function getAdjacentChapters(domain: string, part: number, order: number) {
  return sanityClient.fetch(ADJACENT_CHAPTERS_QUERY, { domain, part, order })
}

export async function getQuizByChapter(chapterSlug: string, level: number) {
  return sanityClient.fetch(QUIZ_BY_CHAPTER_QUERY, { chapterSlug, level })
}

export async function getArticles() {
  return sanityClient.fetch(ARTICLES_QUERY)
}

export async function getArticleBySlug(slug: string) {
  return sanityClient.fetch(ARTICLE_BY_SLUG_QUERY, { slug })
}
