import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import type { Plan } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

// Auth check désactivé temporairement pour debug
// if (!user) {
//   redirect('/auth/login?redirectTo=/dashboard')
// }

const { data: profile } = user ? await supabase
  .from('profiles')
  .select('plan, first_name, onboarding_done')
  .eq('id', user.id)
  .single() : { data: null }

  // Rediriger vers l'onboarding si non complété
// if (profile && !profile.onboarding_done) {
//   redirect('/auth/onboarding')
// }

  const userPlan = (profile?.plan ?? 'free') as Plan

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F6F8' }}>
      {/* Sidebar fixe */}
      <DashboardSidebar userPlan={userPlan} />

      {/* Contenu scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
