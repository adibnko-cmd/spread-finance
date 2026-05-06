import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EnterpriseDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = adminClient()

  const [epRes, jobsRes, membersRes, testsRes] = await Promise.all([
    supabase.from('enterprise_profiles').select('company_name, seats, sector, contact_email').eq('id', user.id).maybeSingle(),
    supabase.from('jobs').select('id, title, is_active, posted_at').eq('posted_by', user.id).order('posted_at', { ascending: false }).limit(5),
    db.from('enterprise_members').select('*', { count: 'exact', head: true }).eq('enterprise_id', user.id),
    db.from('candidate_tests').select('id, title, is_active, created_at').eq('enterprise_id', user.id).order('created_at', { ascending: false }),
  ])

  const ep          = epRes.data
  const jobs        = jobsRes.data ?? []
  const memberCount = membersRes.count ?? 0
  const tests       = testsRes.data ?? []

  // Récupérer les résultats récents uniquement si des tests existent
  const testIds = tests.map(t => t.id)
  const results: { score: number; completed_at: string }[] = []
  if (testIds.length > 0) {
    const { data: resultsData } = await db
      .from('candidate_results')
      .select('score, completed_at')
      .in('test_id', testIds)
      .order('completed_at', { ascending: false })
      .limit(5)
    results.push(...(resultsData ?? []))
  }

  const activeJobs  = jobs.filter(j => j.is_active).length
  const pendingJobs = jobs.filter(j => !j.is_active).length
  const activeTests = tests.filter(t => t.is_active).length
  const avgScore    = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : null

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
          Gérez vos collaborateurs, tests candidats et offres d&apos;emploi.
        </p>
      </div>

      {/* KPI cards — 2 lignes */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Collaborateurs actifs</div>
          <div className="text-3xl font-black text-gray-900">{memberCount}</div>
          <div className="text-[10px] text-gray-400 mt-1">sur {ep?.seats ?? '—'} sièges</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Sièges disponibles</div>
          <div className="text-3xl font-black text-gray-900">{ep?.seats != null ? ep.seats - memberCount : '—'}</div>
          <div className="text-[10px] text-gray-400 mt-1">licences libres</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Tests actifs</div>
          <div className="text-3xl font-black" style={{ color: '#3183F7' }}>{activeTests}</div>
          <div className="text-[10px] text-gray-400 mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} créé{tests.length !== 1 ? 's' : ''} au total</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Score moyen candidats</div>
          <div className="text-3xl font-black" style={{ color: avgScore != null && avgScore >= 70 ? '#36D399' : avgScore != null ? '#FFC13D' : '#D1D5DB' }}>
            {avgScore != null ? `${avgScore}%` : '—'}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">sur les 5 derniers résultats</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Offres actives</div>
          <div className="text-3xl font-black" style={{ color: '#36D399' }}>{activeJobs}</div>
          <div className="text-[10px] text-gray-400 mt-1">publiées sur la plateforme</div>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-[11px] text-gray-400 mb-1">Offres en attente</div>
          <div className="text-3xl font-black" style={{ color: '#FFC13D' }}>{pendingJobs}</div>
          <div className="text-[10px] text-gray-400 mt-1">en cours de validation</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tests récents */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-gray-800">Tests candidats récents</div>
            <Link href="/dashboard/entreprise/quiz"
              className="text-[11px] font-semibold px-3 py-1 rounded-lg"
              style={{ background: '#F5F6F8', color: '#374151' }}>
              Gérer →
            </Link>
          </div>
          {tests.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="text-3xl mb-2">📝</span>
              <div className="text-xs text-gray-400 mb-3">Aucun test créé pour le moment.</div>
              <Link href="/dashboard/entreprise/quiz"
                className="text-xs font-bold px-4 py-2 rounded-xl text-white"
                style={{ background: '#1C1C2E' }}>
                Créer un test
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tests.slice(0, 5).map(t => (
                <Link key={t.id} href={`/dashboard/entreprise/quiz/${t.id}`}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-800">{t.title}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: t.is_active ? '#E6FAF3' : '#F5F6F8', color: t.is_active ? '#0d7a56' : '#9CA3AF' }}>
                    {t.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Actions rapides */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-sm font-bold text-gray-800 mb-4">Actions rapides</div>
            <div className="flex flex-col gap-2">
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
              <Link href="/dashboard/entreprise/formation"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-base">🎓</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Formation groupe</div>
                  <div className="text-[10px] text-gray-400">Assigner des parcours — suivre la progression</div>
                </div>
              </Link>
              <Link href="/dashboard/entreprise/jobs"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E8E8E8' }}>
                <span className="text-base">💼</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">Déposer une offre d&apos;emploi</div>
                  <div className="text-[10px] text-gray-400">Validation par l&apos;équipe Spread Finance</div>
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
