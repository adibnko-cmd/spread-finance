// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Client Sanity + Requêtes GROQ
// ═══════════════════════════════════════════════════════════════════
import { createClient } from 'next-sanity'
import { createImageUrlBuilder } from '@sanity/image-url'

// ── Client ────────────────────────────────────────────────────────
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-01-01',
  useCdn:    process.env.NODE_ENV === 'production',
  token:     process.env.SANITY_API_TOKEN,
})

// ── Image builder ─────────────────────────────────────────────────
const builder = createImageUrlBuilder(sanityClient)
export const urlFor = (source: any) => builder.image(source)

// ── Requêtes GROQ ─────────────────────────────────────────────────

// Tous les chapitres d'un domaine (ordonnés)
export const CHAPTERS_BY_DOMAIN_QUERY = /* groq */`
  *[_type == "chapter" && domain == $domain] | order(part asc, order asc) {
    _id,
    title,
    "slug": slug.current,
    domain,
    part,
    partTitle,
    order,
    accessLevel,
    difficulty,
    estimatedReadingTime,
    excerpt,
    quizAvailable,
    flashcard { asset->{ url } }
  }
`

// Un chapitre complet par slug
export const CHAPTER_BY_SLUG_QUERY = /* groq */`
  *[_type == "chapter" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    domain,
    part,
    partTitle,
    order,
    accessLevel,
    difficulty,
    estimatedReadingTime,
    excerpt,
    content,
    quizAvailable,
    flashcard { asset->{ url } },
    "relatedArticles": relatedArticles[]-> {
      _id, title, "slug": slug.current, domain, estimatedReadingTime
    },
    "relatedChapters": relatedChapters[]-> {
      _id, title, "slug": slug.current, domain, part
    }
  }
`

// Structure complète de la documentation (sidebar)
export const DOCUMENTATION_STRUCTURE_QUERY = /* groq */`
  *[_type == "chapter"] | order(domain asc, part asc, order asc) {
    _id,
    title,
    "slug": slug.current,
    domain,
    part,
    partTitle,
    order,
    accessLevel,
    difficulty,
    estimatedReadingTime
  }
`

// Articles par domaine
export const ARTICLES_BY_DOMAIN_QUERY = /* groq */`
  *[_type == "article" && domain == $domain] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    domain,
    accessLevel,
    publishedAt,
    estimatedReadingTime,
    excerpt,
    "coverImage": coverImage.asset->url
  }
`

// Quiz d'un chapitre par niveau
export const QUIZ_BY_CHAPTER_QUERY = /* groq */`
  *[_type == "quiz" && chapterSlug == $chapterSlug && level == $level][0] {
    _id,
    chapterSlug,
    level,
    questions[] {
      text,
      explanation,
      answers[] { text, isCorrect }
    }
  }
`

// Recherche full-text
export const SEARCH_QUERY = /* groq */`
  *[_type in ["chapter", "article"] && (
    title match $query + "*" ||
    pt::text(content) match $query + "*"
  )] | score(boost(title match $query, 3)) | order(_score desc) [0...20] {
    _type,
    title,
    "slug": slug.current,
    domain,
    accessLevel,
    excerpt,
    _score
  }
`

// ── Helpers ───────────────────────────────────────────────────────
export async function getChaptersByDomain(domain: string) {
  return sanityClient.fetch(CHAPTERS_BY_DOMAIN_QUERY, { domain })
}

export async function getChapterBySlug(slug: string) {
  return sanityClient.fetch(CHAPTER_BY_SLUG_QUERY, { slug })
}

export async function getDocumentationStructure() {
  return sanityClient.fetch(DOCUMENTATION_STRUCTURE_QUERY)
}

export async function searchContent(query: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sanityClient.fetch as any)(SEARCH_QUERY, { query })
}
