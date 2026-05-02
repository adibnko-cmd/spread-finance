import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/likes?slug=xxx&type=chapter  → { count, liked }
export async function GET(request: NextRequest) {
  const slug        = request.nextUrl.searchParams.get('slug')
  const contentType = request.nextUrl.searchParams.get('type') ?? 'chapter'
  if (!slug) return NextResponse.json({ count: 0, liked: false })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count } = await supabase
    .from('content_likes')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', contentType)
    .eq('content_slug', slug)

  let liked = false
  if (user) {
    const { data } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_slug', slug)
      .eq('user_id', user.id)
      .maybeSingle()
    liked = !!data
  }

  return NextResponse.json({ count: count ?? 0, liked })
}

// POST /api/likes  → toggle like
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content_type, content_slug } = await request.json()
  if (!content_type || !content_slug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Vérifier si déjà liké
  const { data: existing } = await supabase
    .from('content_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_slug', content_slug)
    .maybeSingle()

  if (existing) {
    await supabase.from('content_likes').delete().eq('id', existing.id)
    return NextResponse.json({ liked: false })
  } else {
    await supabase.from('content_likes').insert({
      user_id: user.id,
      content_type,
      content_slug,
    })
    return NextResponse.json({ liked: true })
  }
}
