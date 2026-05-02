import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
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

  const [{ data: profile, error: profileError }, { data: cashLog }] = await Promise.all([
    supabase.from('profiles').select('plan, first_name, onboarding_done, is_admin, account_type').eq('id', user.id).single(),
    supabase.from('cash_log').select('cash_earned').eq('user_id', user.id),
  ])


  if (profile && !profile.onboarding_done) {
    redirect('/auth/onboarding')
  }

  const userPlan  = (profile?.plan ?? 'free') as Plan
  const isAdmin   = profile?.is_admin ?? false
  const totalCash = (cashLog ?? []).reduce((sum, r) => sum + r.cash_earned, 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F6F8' }}>
      {/* Sidebar fixe */}
      <DashboardSidebar userPlan={userPlan} isAdmin={isAdmin} />

      {/* Contenu : top bar + scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopBar totalCash={totalCash} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
