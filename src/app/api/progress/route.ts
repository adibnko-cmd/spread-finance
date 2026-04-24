// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — API Route : Progression chapitre
// POST /api/progress — met à jour la progression d'un chapitre
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const progressSchema = z.object({
  chapter_slug:       z.string().min(1),
  chapter_title:      z.string().optional(),
  domain_slug:        z.enum(['finance', 'maths', 'dev', 'pm', 'ml']),
  status:             z.enum(['in_progress', 'completed', 'validated']).optional(),
  scroll_percent:     z.number().min(0).max(100).optional(),
  time_spent_seconds: z.number().min(0).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = progressSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { chapter_slug, chapter_title, domain_slug, status, scroll_percent, time_spent_seconds } = parsed.data

  // Upsert la progression
  const updateData: Record<string, unknown> = {
    user_id:      user.id,
    chapter_slug,
    domain_slug,
    updated_at:   new Date().toISOString(),
  }

  if (status) {
    updateData.status = status
    if (status === 'completed') updateData.completed_at = new Date().toISOString()
    if (status === 'validated') updateData.validated_at = new Date().toISOString()
    if (status === 'in_progress' ) updateData.read_at = new Date().toISOString()
  }
  if (scroll_percent !== undefined) updateData.scroll_percent = scroll_percent
  if (time_spent_seconds !== undefined) updateData.time_spent_seconds = time_spent_seconds

  const { data, error } = await supabase
    .from('chapter_progress')
    .upsert(updateData, { onConflict: 'user_id,chapter_slug' })
    .select()
    .single()

  if (error) {
    console.error('Progress update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Ajouter XP si chapitre validé
  if (status === 'validated') {
    await supabase.from('xp_log').insert({
      user_id:     user.id,
      source_type: 'chapter_validated',
      source_id:   chapter_slug,
      xp_earned:   30,
    })
  } else if (status === 'in_progress') {
    // XP pour première lecture
    const { count } = await supabase
      .from('xp_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source_type', 'chapter_read')
      .eq('source_id', chapter_slug)

    if (count === 0) {
      await supabase.from('xp_log').insert({
        user_id:     user.id,
        source_type: 'chapter_read',
        source_id:   chapter_slug,
        xp_earned:   10,
      })
    }
  }

  // Logger l'activité
  await supabase.from('activity_log').insert({
    user_id:      user.id,
    action_type:  status === 'validated' ? 'chapter_completed' : 'chapter_opened',
    target_type:  'chapter',
    target_slug:  chapter_slug,
    target_title: chapter_title ?? null,
  })

  return NextResponse.json({ data })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  let query = supabase
    .from('chapter_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (domain) {
    query = query.eq('domain_slug', domain)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
