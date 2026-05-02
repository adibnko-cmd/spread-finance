import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ['plan', 'is_admin', 'account_type']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { error } = await admin.db.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If switching to enterprise, ensure enterprise_profiles row exists
  if (updates.account_type === 'enterprise') {
    await admin.db.from('enterprise_profiles').upsert({ id, company_name: 'À renseigner', seats: 5 }, { onConflict: 'id', ignoreDuplicates: true })
  }

  return NextResponse.json({ ok: true })
}
