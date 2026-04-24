// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — API Route : Flags de contenu
// POST /api/flags — toggle un flag (favorite, to_review, etc.)
// DELETE /api/flags — supprime un flag
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const flagSchema = z.object({
  content_type:  z.enum(['chapter', 'article', 'quiz', 'flashcard']),
  content_slug:  z.string().min(1),
  domain_slug:   z.enum(['finance', 'maths', 'dev', 'pm', 'ml']).optional(),
  flag_type:     z.enum(['favorite', 'to_review', 'validated', 'to_read']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = flagSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Favoris gratuits pour tous — à_réviser et à_lire réservés Premium
  const premiumOnlyFlags = ['to_review', 'to_read']
  if (premiumOnlyFlags.includes(parsed.data.flag_type)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'free') {
      return NextResponse.json(
        { error: 'Fonctionnalité réservée aux membres Premium' },
        { status: 403 }
      )
    }
  }

  // Toggle : si le flag existe déjà, on le supprime
  const { data: existing } = await supabase
    .from('content_flags')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_slug', parsed.data.content_slug)
    .eq('flag_type', parsed.data.flag_type)
    .single()

  if (existing) {
    await supabase.from('content_flags').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed', flag: parsed.data })
  }

  const { data, error } = await supabase
    .from('content_flags')
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ action: 'added', flag: data })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const contentSlug = searchParams.get('slug')
  const flagType    = searchParams.get('type')

  let query = supabase
    .from('content_flags')
    .select('*')
    .eq('user_id', user.id)

  if (contentSlug) query = query.eq('content_slug', contentSlug)
  if (flagType)    query = query.eq('flag_type', flagType)

  const { data, error } = await query.order('flagged_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
