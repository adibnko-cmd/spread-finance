import { adminClient } from '@/lib/supabase/admin-server'
import { JobsManager } from './JobsManager'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const db = adminClient()

  const { data: jobs } = await db
    .from('jobs')
    .select('id, title, company, location, type, domain_slug, salary_min, salary_max, description, apply_url, requirements, tags, is_active, posted_at')
    .order('posted_at', { ascending: false })

  return <JobsManager jobs={jobs ?? []} />
}
