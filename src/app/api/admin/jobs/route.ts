import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, company, location, type, domain_slug, salary_min, salary_max, description, apply_url, requirements, tags } = body

  if (!title || !company) return NextResponse.json({ error: 'title and company are required' }, { status: 400 })

  const { data, error } = await admin.db.from('jobs').insert({
    title, company,
    location: location || 'Paris, France',
    type: type || 'cdi',
    domain_slug: domain_slug || null,
    salary_min: salary_min || null,
    salary_max: salary_max || null,
    description: description || null,
    apply_url: apply_url || null,
    requirements: requirements ? requirements.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
    tags: tags ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
