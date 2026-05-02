import { adminClient } from '@/lib/supabase/admin-server'
import EnterpriseAdminClient from './EnterpriseAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminEnterprisePage() {
  const db = adminClient()

  const [{ data: enterpriseProfiles }, { data: { users: authUsers } }] = await Promise.all([
    db.from('enterprise_profiles')
      .select('id, company_name, seats, contact_email, created_at')
      .order('created_at', { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  // Récupérer les membres pour chaque entreprise
  const enterprises = await Promise.all(
    (enterpriseProfiles ?? []).map(async ent => {
      let members: {
        user_id: string; role: string; joined_at: string | null
        first_name: string | null; last_name: string | null; email: string
      }[] = []

      try {
        const { data: memberRows } = await db
          .from('enterprise_members')
          .select('user_id, role, joined_at')
          .eq('enterprise_id', ent.id)

        if (memberRows && memberRows.length > 0) {
          const { data: profiles } = await db
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', memberRows.map(m => m.user_id))

          const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

          members = memberRows.map(m => ({
            user_id:    m.user_id,
            role:       m.role,
            joined_at:  m.joined_at,
            first_name: profileMap.get(m.user_id)?.first_name ?? null,
            last_name:  profileMap.get(m.user_id)?.last_name ?? null,
            email:      emailMap.get(m.user_id) ?? '—',
          }))
        }
      } catch {
        // enterprise_members table pas encore créée (migration 011 non exécutée)
      }

      return {
        id:            ent.id,
        company_name:  ent.company_name,
        seats:         ent.seats,
        contact_email: ent.contact_email,
        email:         emailMap.get(ent.id) ?? ent.contact_email ?? '—',
        members,
      }
    })
  )

  const totalMembers = enterprises.reduce((s, e) => s + e.members.length, 0)

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Entreprises</div>
        <div className="text-sm text-gray-500 mt-0.5">Gérer les comptes entreprise et leurs membres</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Comptes entreprise', value: enterprises.length,              color: '#36D399' },
          { label: 'Membres total',      value: totalMembers,                    color: '#3183F7' },
          { label: 'Sièges alloués',     value: enterprises.reduce((s, e) => s + e.seats, 0), color: '#A855F7' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Note migration */}
      <div
        className="mb-5 p-3 rounded-lg text-xs"
        style={{ background: '#FFF8E6', border: '1px solid #FFC13D', color: '#92400e' }}
      >
        <strong>Rappel :</strong> exécuter la migration <code>011_enterprise_members.sql</code> dans Supabase SQL Editor avant d&apos;utiliser l&apos;ajout de membres.
      </div>

      {enterprises.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1.5px dashed #E8E8E8' }}>
          <div className="text-sm text-gray-400">Aucun compte entreprise créé</div>
          <div className="text-xs text-gray-400 mt-1">
            Créer un compte via <code className="bg-gray-100 px-1 rounded">POST /api/admin/enterprise</code>
          </div>
        </div>
      ) : (
        <EnterpriseAdminClient enterprises={enterprises} />
      )}
    </div>
  )
}
