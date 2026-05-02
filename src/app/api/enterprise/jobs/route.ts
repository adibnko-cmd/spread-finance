import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Vérifier que le compte est bien enterprise
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (profile?.account_type !== 'enterprise') {
    return NextResponse.json({ error: 'Réservé aux comptes entreprise' }, { status: 403 })
  }

  const { data: ep } = await supabase
    .from('enterprise_profiles')
    .select('company_name')
    .eq('id', user.id)
    .single()

  const body = await req.json()
  const { title, location, type, domain_slug, salary_min, salary_max, description, apply_url } = body

  if (!title) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })

  const { data, error } = await supabase.from('jobs').insert({
    title,
    company:    ep?.company_name ?? 'Entreprise',
    location:   location || 'Paris, France',
    type:       type || 'cdi',
    domain_slug: domain_slug || null,
    salary_min:  salary_min || null,
    salary_max:  salary_max || null,
    description: description || null,
    apply_url:   apply_url || null,
    is_active:   false,   // En attente de validation admin
    posted_by:   user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
