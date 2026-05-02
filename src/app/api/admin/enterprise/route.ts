import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, first_name, last_name, company_name, sector, seats, contact_email } = await req.json()

  if (!email || !password || !company_name) {
    return NextResponse.json({ error: 'email, password et company_name sont requis' }, { status: 400 })
  }

  // 1. Créer l'utilisateur dans auth.users (email confirmé d'office)
  const { data: authData, error: authError } = await admin.db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: first_name ?? '', last_name: last_name ?? '' },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erreur création utilisateur' }, { status: 500 })
  }

  const userId = authData.user.id

  // 2. Upsert le profil (le trigger handle_new_user peut avoir déjà créé la ligne)
  await admin.db.from('profiles').upsert({
    id:              userId,
    first_name:      first_name ?? null,
    last_name:       last_name ?? null,
    account_type:    'enterprise',
    plan:            'enterprise',
    onboarding_done: true,
  }, { onConflict: 'id' })

  // 3. Créer le profil entreprise
  await admin.db.from('enterprise_profiles').insert({
    id:            userId,
    company_name:  company_name,
    sector:        sector ?? null,
    contact_email: contact_email ?? null,
    seats:         seats ?? 5,
  })

  return NextResponse.json({
    id:         userId,
    email,
    first_name: first_name ?? null,
    last_name:  last_name ?? null,
    plan:       'enterprise' as const,
    account_type: 'enterprise' as const,
    is_admin:   false,
    created_at: new Date().toISOString(),
  }, { status: 201 })
}
