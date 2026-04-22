import { NextResponse, type NextRequest } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'

const SEARCH_QUERY = `
  *[_type in ["chapter", "article"] && (
    title match $query + "*" ||
    pt::text(content) match $query + "*"
  )] | score(boost(title match $query, 3)) | order(_score desc) [0...15] {
    _type,
    title,
    "slug": slug.current,
    domain,
    accessLevel,
    excerpt
  }
`

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (sanityClient.fetch as any)(SEARCH_QUERY, { query: q })
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
