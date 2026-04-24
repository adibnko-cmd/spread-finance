import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type JobType = 'cdi' | 'cdd' | 'stage' | 'alternance' | 'freelance'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: JobType
  domain_slug: string
  salary_min?: number
  salary_max?: number
  description: string
  tags: string[]
  apply_url: string
  posted_at: string
}

const STATIC_JOBS: Job[] = [
  {
    id: '1', title: 'Analyste Quantitatif (Quant)', company: 'BNP Paribas CIB',
    location: 'Paris, France', type: 'cdi', domain_slug: 'finance',
    salary_min: 65000, salary_max: 95000,
    description: 'Rejoignez notre équipe de recherche quantitative pour développer et implémenter des modèles de pricing sur produits dérivés taux et crédit.',
    tags: ['Python', 'C++', 'Options', 'Monte Carlo', 'Risk'], apply_url: '#',
    posted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '2', title: 'Développeur Python — Trading Systems', company: 'Société Générale',
    location: 'Paris, France', type: 'cdi', domain_slug: 'dev',
    salary_min: 55000, salary_max: 80000,
    description: 'Développement et maintenance de systèmes de trading algorithmique basse latence. Collaboration étroite avec les desks Fixed Income et Equity.',
    tags: ['Python', 'FastAPI', 'Redis', 'Kafka', 'Low Latency'], apply_url: '#',
    posted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '3', title: 'Risk Manager — Marchés', company: 'Amundi Asset Management',
    location: 'Paris, France', type: 'cdi', domain_slug: 'finance',
    salary_min: 70000, salary_max: 100000,
    description: 'Pilotage du risque de marché sur fonds actions et obligataires. Suivi des métriques VaR, CVaR et stress tests réglementaires.',
    tags: ['VaR', 'CVaR', 'Bloomberg', 'Excel VBA', 'FRTB'], apply_url: '#',
    posted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '4', title: 'Data Scientist — Finance Quantitative', company: 'AXA Investment Managers',
    location: 'Paris, France', type: 'cdi', domain_slug: 'ml',
    salary_min: 60000, salary_max: 90000,
    description: 'Application du machine learning à la gestion d\'actifs : prédiction de rendements, optimisation de portefeuilles, détection d\'anomalies.',
    tags: ['Python', 'scikit-learn', 'PyTorch', 'Pandas', 'Finance'],apply_url: '#',
    posted_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: '5', title: 'Stagiaire — Structuration Produits Dérivés', company: 'Natixis',
    location: 'Paris, France', type: 'stage', domain_slug: 'finance',
    salary_min: 1200, salary_max: 1800,
    description: 'Stage de 6 mois au sein de l\'équipe structuration. Participation au pricing et à la documentation de produits dérivés sur sous-jacents actions.',
    tags: ['Excel', 'VBA', 'Options', 'Structuration', 'Dérivés'], apply_url: '#',
    posted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '6', title: 'Chef de Projet IT — Core Banking', company: 'Crédit Agricole',
    location: 'Montrouge, France', type: 'cdi', domain_slug: 'pm',
    salary_min: 55000, salary_max: 75000,
    description: 'Pilotage de projets de transformation digitale pour les systèmes bancaires cœur. Coordination des équipes SI, métier et fournisseurs.',
    tags: ['Agile', 'JIRA', 'Bancaire', 'AMOA', 'Gestion de projet'], apply_url: '#',
    posted_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: '7', title: 'Alternance — Développeur Full Stack FinTech', company: 'Lydia / Sumeria',
    location: 'Paris, France', type: 'alternance', domain_slug: 'dev',
    salary_min: 1400, salary_max: 1800,
    description: 'Rejoignez notre squad produit pour développer de nouvelles fonctionnalités sur notre application mobile de paiement et de gestion financière.',
    tags: ['React Native', 'Node.js', 'TypeScript', 'PostgreSQL', 'FinTech'], apply_url: '#',
    posted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '8', title: 'Freelance — Modélisation Actuarielle', company: 'Cabinet conseil',
    location: 'Remote / Paris', type: 'freelance', domain_slug: 'maths',
    salary_min: 600, salary_max: 900,
    description: 'Mission de 3 mois pour un cabinet conseil en assurance. Développement de modèles actuariels pour l\'évaluation des réserves techniques Solvabilité II.',
    tags: ['R', 'Python', 'Actuariat', 'Solvabilité II', 'IFRS 17'], apply_url: '#',
    posted_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
]

const TYPE_CONFIG: Record<JobType, { label: string; color: string; bg: string }> = {
  cdi:         { label: 'CDI',         color: '#36D399', bg: '#F0FBF7' },
  cdd:         { label: 'CDD',         color: '#3183F7', bg: '#EBF2FF' },
  stage:       { label: 'Stage',       color: '#A855F7', bg: '#F5F0FF' },
  alternance:  { label: 'Alternance',  color: '#FFC13D', bg: '#FFFBEB' },
  freelance:   { label: 'Freelance',   color: '#F56751', bg: '#FFF5F3' },
}

const DOMAIN_CONFIG: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance',  color: '#3183F7' },
  maths:   { name: 'Maths',    color: '#A855F7' },
  dev:     { name: 'Dev IT',   color: '#1a5fc8' },
  pm:      { name: 'Projet',   color: '#FFC13D' },
  ml:      { name: 'ML / IA',  color: '#F56751' },
}

function formatSalary(min?: number, max?: number, type?: JobType) {
  if (!min && !max) return null
  const isMonthly = type === 'stage' || type === 'alternance'
  const fmt = (v: number) => isMonthly ? `${v.toLocaleString('fr-FR')} €/mois` : `${(v / 1000).toFixed(0)}k €/an`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  return null
}

function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/jobs')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'platinum'

  if (!isPremium) {
    return (
      <div className="p-5 max-w-2xl">
        <div className="text-sm font-black text-gray-800 mb-1">Offres d&apos;emploi</div>
        <div className="text-xs text-gray-400 mb-8">Finance de marché &amp; IT</div>
        <div className="rounded-2xl p-8 text-center" style={{ background: '#1C1C2E', border: '1.5px solid rgba(255,255,255,.06)' }}>
          <div className="text-3xl mb-3">💼</div>
          <div className="text-base font-black text-white mb-2">Accès Premium requis</div>
          <div className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
            Les offres d&apos;emploi Finance &amp; IT sont réservées aux membres Premium. Accédez à des opportunités sélectionnées pour votre profil.
          </div>
          <Link href="/#pricing" className="inline-block font-bold text-sm px-6 py-3 rounded-xl" style={{ background: '#3183F7', color: '#fff' }}>
            Passer à Premium →
          </Link>
        </div>
      </div>
    )
  }

  const totalJobs = STATIC_JOBS.length
  const newThisWeek = STATIC_JOBS.filter(j => Date.now() - new Date(j.posted_at).getTime() < 7 * 86400000).length

  return (
    <div className="p-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-black text-gray-800">Offres d&apos;emploi</div>
          <div className="text-xs text-gray-400 mt-0.5">Finance de marché &amp; IT · sélection Spread Finance</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#EBF2FF', border: '1.5px solid #C7DCFF' }}>
          <span className="text-xs font-black text-blue-700">{newThisWeek} nouvelles</span>
          <span className="text-[10px] text-blue-500">cette semaine</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5 mt-4">
        {[
          { label: 'Offres actives', value: totalJobs, color: '#3183F7' },
          { label: 'CDI / CDD',     value: STATIC_JOBS.filter(j => j.type === 'cdi' || j.type === 'cdd').length, color: '#36D399' },
          { label: 'Stages / Alt.', value: STATIC_JOBS.filter(j => j.type === 'stage' || j.type === 'alternance').length, color: '#A855F7' },
          { label: 'Freelance',     value: STATIC_JOBS.filter(j => j.type === 'freelance').length, color: '#F56751' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-[10px] font-semibold text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Liste des offres */}
      <div className="flex flex-col gap-3">
        {STATIC_JOBS.map(job => {
          const typeCfg   = TYPE_CONFIG[job.type]
          const domainCfg = DOMAIN_CONFIG[job.domain_slug] ?? { name: job.domain_slug, color: '#888' }
          const salary    = formatSalary(job.salary_min, job.salary_max, job.type)

          return (
            <div
              key={job.id}
              className="bg-white rounded-xl p-4 transition-shadow hover:shadow-md"
              style={{ border: '1.5px solid #E8E8E8' }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{job.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{job.company} · {job.location}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: typeCfg.bg, color: typeCfg.color }}
                  >
                    {typeCfg.label}
                  </span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${domainCfg.color}15`, color: domainCfg.color }}
                  >
                    {domainCfg.name}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{job.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {job.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#F5F5F5', color: '#555' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {salary && (
                    <span className="text-[11px] font-bold text-gray-700">{salary}</span>
                  )}
                  <span className="text-[10px] text-gray-400">{daysAgo(job.posted_at)}</span>
                </div>
                <Link
                  href={job.apply_url}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: '#1C1C2E' }}
                >
                  Postuler →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl text-center" style={{ background: '#F8F8FB', border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-600 mb-1">Vous recrutez ?</div>
        <div className="text-[11px] text-gray-400">Contactez-nous pour publier une offre ciblée auprès de notre communauté.</div>
        <a href="mailto:contact@spread-finance.fr" className="text-[11px] font-bold mt-2 inline-block" style={{ color: '#3183F7' }}>
          contact@spread-finance.fr
        </a>
      </div>
    </div>
  )
}
