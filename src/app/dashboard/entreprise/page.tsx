import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EnterpriseDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ep } = user
    ? await supabase.from('enterprise_profiles').select('company_name, seats, sector, contact_email').eq('id', user!.id).maybeSingle()
    : { data: null }

  // Offres déposées par cette entreprise
  const { data: jobs } = user
    ? await supabase.from('jobs').select('id, title, is_active, posted_at').eq('posted_by', user!.id).order('posted_at', { ascending: false }).limit(5)
    : { data: null }

  const activeJobs   = (jobs ?? []).filter(j => j.is_active).length
  const pendingJobs  = (jobs ?? []).filter(j => !j.is_active).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏢</span>
          <h1 className="text-xl font-black text-gray-900">{ep?.company_name ?? 'Espace Entreprise'}</h1>
          {ep?.sector && <span className="text-xs text-gray-400 font-medium">{ep.sector}</span>}
        </div>
        <p className="text-sm text-gray-400 ml-11">
          Gérez vos offres d&apos;emploi et vos ressources de formation.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Sièges disponibles</div>
          <div className="text-3xl font-black text-gray-900">{ep?.seats ?? '—'}</div>
          <div className="text-[10px] text-gray-400 mt-1">licences actives</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Offres actives</div>
          <div className="text-3xl font-black" style={{ color: '#36D399' }}>{activeJobs}</div>
          <div className="text-[10px] text-gray-400 mt-1">publiées sur la plateforme</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">En attente</div>
          <div className="text-3xl font-black" style={{ color: '#FFC13D' }}>{pendingJobs}</div>
          <div className="text-[10px] text-gray-400 mt-1">en cours de validation</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Offres récentes */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-gray-800">Mes offres d&apos;emploi</div>
            <Link href="/dashboard/entreprise/jobs"
              className="text-[11px] font-semibold px-3 py-1 rounded-lg"
              style={{ background: '#F5F6F8', color: '#374151' }}>
              Voir tout →
            </Link>
          </div>
          {(jobs ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="text-3xl mb-2">💼</span>
              <div className="text-xs text-gray-400 mb-3">Aucune offre déposée pour le moment.</div>
              <Link href="/dashboard/entreprise/jobs"
                className="text-xs font-bold px-4 py-2 rounded-xl text-white"
                style={{ background: '#1C1C2E' }}>
                Déposer une offre
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(jobs ?? []).map(j => (
                <div key={j.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-800">{j.title}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(j.posted_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: j.is_active ? '#E6FAF3' : '#FFF8E6', color: j.is_active ? '#0d7a56' : '#b37700' }}>
                    {j.is_active ? 'Active' : 'En validation'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides + contact */}
        <div className="flex flex-col gap-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-sm font-bold text-gray-800 mb-4">Actions rapides</div>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/entreprise/jobs"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-base">💼</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Déposer une offre d&apos;emploi</div>
                  <div className="text-[10px] text-gray-400">Validation par l&apos;équipe Spread Finance</div>
                </div>
              </Link>
              <Link href="/dashboard/entreprise/quiz"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-base">📝</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Créer un test candidat</div>
                  <div className="text-[10px] text-gray-400">Lien partageable — aucun compte requis</div>
                </div>
              </Link>
              <Link href="/dashboard/entreprise/collaborateurs"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-base">👥</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Gérer les collaborateurs</div>
                  <div className="text-[10px] text-gray-400">Inviter et gérer les accès de votre équipe</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xs font-bold text-gray-800 mb-3">Votre contact Spread Finance</div>
            <a href="mailto:contact@spread-finance.com"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white justify-center"
              style={{ background: '#3183F7' }}>
              ✉️ Contacter votre account manager
            </a>
            {ep?.contact_email && (
              <div className="text-[10px] text-gray-400 text-center mt-2">
                Dédié : <span className="font-semibold">{ep.contact_email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
