import { adminClient } from '@/lib/supabase/admin-server'
import { UsersTable } from './UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const db = adminClient()

  const [{ data: profiles }, { data: { users: authUsers } }] = await Promise.all([
    db.from('profiles')
      .select('id, first_name, last_name, plan, account_type, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  const users = (profiles ?? []).map(p => ({
    id:           p.id,
    first_name:   p.first_name,
    last_name:    p.last_name,
    email:        emailMap.get(p.id) ?? '—',
    plan:         p.plan as 'free' | 'premium' | 'platinum' | 'enterprise',
    account_type: (p.account_type ?? 'individual') as 'individual' | 'enterprise',
    is_admin:     p.is_admin ?? false,
    created_at:   p.created_at,
  }))

  const total      = users.length
  const premium    = users.filter(u => u.plan === 'premium').length
  const platinum   = users.filter(u => u.plan === 'platinum').length
  const enterprise = users.filter(u => u.account_type === 'enterprise').length

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Utilisateurs</div>
        <div className="text-sm text-gray-500 mt-0.5">Gérer les comptes, plans et permissions</div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',      value: total,      color: '#1C1C2E' },
          { label: 'Premium',    value: premium,    color: '#3183F7' },
          { label: 'Platinum',   value: platinum,   color: '#A855F7' },
          { label: 'Entreprise', value: enterprise, color: '#36D399' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[11px] text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <UsersTable users={users} />
    </div>
  )
}
