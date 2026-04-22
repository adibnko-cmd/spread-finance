import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/settings')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, plan, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-5 max-w-xl">
      <div className="text-sm font-black text-gray-800 mb-5">Paramètres</div>
      <SettingsClient
        email={user.email ?? ''}
        firstName={profile?.first_name ?? ''}
        lastName={profile?.last_name ?? ''}
        plan={profile?.plan ?? 'free'}
        memberSince={profile?.created_at ?? ''}
      />
    </div>
  )
}
