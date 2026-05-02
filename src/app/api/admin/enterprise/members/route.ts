import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { enterprise_id, email, role = 'member' } = await req.json()
  if (!enterprise_id || !email) {
    return NextResponse.json({ error: 'enterprise_id et email sont requis' }, { status: 400 })
  }

  // Trouver l'utilisateur par email
  const { data: { users }, error: listError } = await admin.db.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!targetUser) {
    return NextResponse.json({ error: 'Aucun utilisateur trouvé avec cet email' }, { status: 404 })
  }

  // Vérifier les sièges disponibles
  const { data: enterprise } = await admin.db
    .from('enterprise_profiles').select('seats, company_name').eq('id', enterprise_id).single()

  const { count } = await admin.db
    .from('enterprise_members').select('*', { count: 'exact', head: true }).eq('enterprise_id', enterprise_id)

  if (enterprise && (count ?? 0) >= enterprise.seats) {
    return NextResponse.json({
      error: `Limite de ${enterprise.seats} siège(s) atteinte pour ${enterprise.company_name}`,
    }, { status: 400 })
  }

  // Ajouter le membre
  const { error } = await admin.db.from('enterprise_members').upsert(
    {
      enterprise_id,
      user_id:    targetUser.id,
      role,
      joined_at:  new Date().toISOString(),
      invited_at: new Date().toISOString(),
    },
    { onConflict: 'enterprise_id,user_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Passer le plan du membre à 'enterprise'
  await admin.db.from('profiles').update({ plan: 'enterprise' }).eq('id', targetUser.id)

  return NextResponse.json({
    success: true,
    user_id: targetUser.id,
    email:   targetUser.email,
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { enterprise_id, user_id } = await req.json()
  if (!enterprise_id || !user_id) {
    return NextResponse.json({ error: 'enterprise_id et user_id sont requis' }, { status: 400 })
  }

  const { error } = await admin.db
    .from('enterprise_members')
    .delete()
    .eq('enterprise_id', enterprise_id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si l'utilisateur n'appartient plus à aucune entreprise → repasser en 'free'
  const { count } = await admin.db
    .from('enterprise_members').select('*', { count: 'exact', head: true }).eq('user_id', user_id)

  if ((count ?? 0) === 0) {
    await admin.db.from('profiles').update({ plan: 'free' }).eq('id', user_id)
  }

  return NextResponse.json({ success: true })
}
