import { createClient } from '@/lib/supabase/server'
import { EnterpriseJobsClient } from './EnterpriseJobsClient'

export const dynamic = 'force-dynamic'

export default async function EnterpriseJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, company, location, type, domain_slug, salary_min, salary_max, description, apply_url, is_active, posted_at')
    .eq('posted_by', user.id)
    .order('posted_at', { ascending: false })

  return <EnterpriseJobsClient jobs={jobs ?? []} />
}
