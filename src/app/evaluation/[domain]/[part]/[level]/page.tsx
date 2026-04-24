import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEvaluation } from '@/lib/sanity/client'
import EvaluationClient from './EvaluationClient'

const DOMAIN_NAMES: Record<string, string> = {
  finance: 'Finance de marché',
  maths:   'Mathématiques financières',
  dev:     'Développement IT',
  pm:      'Gestion de projet',
  ml:      'Machine Learning',
}

export const dynamic = 'force-dynamic'

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ domain: string; part: string; level: string }>
}) {
  const { domain, part: partStr, level: levelStr } = await params
  const part  = parseInt(partStr,  10)
  const level = parseInt(levelStr, 10)

  if (!DOMAIN_NAMES[domain] || isNaN(part) || isNaN(level) || level < 1 || level > 3) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?redirectTo=/evaluation/${domain}/${part}/${level}`)

  // Niveau 3 → Premium requis
  let userPlan = 'free'
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  userPlan = profile?.plan ?? 'free'

  const isPremium = userPlan === 'premium' || userPlan === 'platinum'

  if (level === 3 && !isPremium) {
    redirect(`/evaluation/${domain}/${part}/1`)
  }

  const evaluation = await getEvaluation(domain, part, level).catch(() => null)

  return (
    <EvaluationClient
      domain={domain}
      domainName={DOMAIN_NAMES[domain]}
      part={part}
      level={level as 1 | 2 | 3}
      evaluation={evaluation}
      isPremium={isPremium}
    />
  )
}
