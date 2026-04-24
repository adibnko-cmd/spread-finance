import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import type { Plan } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, first_name, onboarding_done')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding_done) {
    redirect('/auth/onboarding')
  }

  const { data: adminData } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const userPlan = (profile?.plan ?? 'free') as Plan
  const isAdmin  = (adminData as { is_admin?: boolean } | null)?.is_admin ?? false

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F6F8' }}>
      {/* Sidebar fixe */}
      <DashboardSidebar userPlan={userPlan} isAdmin={isAdmin} />

      {/* Contenu scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
