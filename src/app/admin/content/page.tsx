import { adminClient } from '@/lib/supabase/admin-server'

export const dynamic = 'force-dynamic'

const DOMAIN_LABELS: Record<string, string> = {
  finance: 'Finance de marché',
  maths:   'Mathématiques',
  dev:     'Développement IT',
  pm:      'Gestion de projet',
  ml:      'Machine Learning',
}
const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}

export default async function AdminContentPage() {
  const db = adminClient()

  const [
    { data: openedChapters },
    { data: quizResults },
    { data: chapterProgress },
    { data: flags },
    { data: likes },
  ] = await Promise.all([
    db.from('activity_log')
      .select('target_slug, target_title')
      .eq('action_type', 'chapter_opened')
      .not('target_slug', 'is', null),
    db.from('quiz_results')
      .select('domain_slug, score, passed, quiz_level'),
    db.from('chapter_progress')
      .select('domain_slug, status'),
    db.from('content_flags')
      .select('flag_type, content_type, domain_slug'),
    db.from('content_likes')
      .select('content_type, domain_slug'),
  ])

  // Top chapters by opens
  const chapterOpens: Record<string, { title: string; count: number }> = {}
  for (const e of openedChapters ?? []) {
    if (!e.target_slug) continue
    if (!chapterOpens[e.target_slug]) chapterOpens[e.target_slug] = { title: e.target_title ?? e.target_slug, count: 0 }
    chapterOpens[e.target_slug].count++
  }
  const topChapters = Object.entries(chapterOpens)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  // Quiz stats by domain
  const domains = ['finance', 'maths', 'dev', 'pm', 'ml']
  const quizByDomain = domains.map(domain => {
    const domainQuizzes = (quizResults ?? []).filter(q => q.domain_slug === domain)
    const total  = domainQuizzes.length
    const passed = domainQuizzes.filter(q => q.passed).length
    const avg    = total > 0 ? Math.round(domainQuizzes.reduce((s, q) => s + q.score, 0) / total) : 0
    return { domain, total, passed, avg, rate: total > 0 ? Math.round((passed / total) * 100) : 0 }
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total)

  // Chapter completion by domain
  const progressByDomain = domains.map(domain => {
    const rows = (chapterProgress ?? []).filter(p => p.domain_slug === domain)
    const completed = rows.filter(p => p.status === 'completed' || p.status === 'validated').length
    const validated = rows.filter(p => p.status === 'validated').length
    return { domain, total: rows.length, completed, validated }
  }).filter(d => d.total > 0)

  // Flags breakdown
  const flagsByType: Record<string, number> = {}
  const flagsByDomain: Record<string, number> = {}
  for (const f of flags ?? []) {
    flagsByType[f.flag_type] = (flagsByType[f.flag_type] ?? 0) + 1
    if (f.domain_slug) flagsByDomain[f.domain_slug] = (flagsByDomain[f.domain_slug] ?? 0) + 1
  }
  const totalFlags  = (flags ?? []).length
  const totalLikes  = (likes ?? []).length

  const maxOpens = topChapters[0]?.[1].count ?? 1

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Contenu</div>
        <div className="text-sm text-gray-500 mt-0.5">Analytiques d&apos;utilisation des contenus</div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ouvertures chapitres', value: (openedChapters ?? []).length.toLocaleString(), color: '#3183F7' },
          { label: 'Quiz complétés',       value: (quizResults ?? []).length.toLocaleString(),    color: '#A855F7' },
          { label: 'Contenus sauvegardés', value: totalFlags.toLocaleString(),                    color: '#FFC13D' },
          { label: 'Likes totaux',         value: totalLikes.toLocaleString(),                    color: '#F56751' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[11px] text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Top chapters */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Top 10 chapitres les plus ouverts</div>
          {topChapters.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">Aucune donnée.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topChapters.map(([slug, { title, count }], i) => (
                <div key={slug}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-gray-700 truncate flex-1 mr-2">
                      <span className="text-gray-400 mr-1.5">{i + 1}.</span>{title}
                    </span>
                    <span className="text-[11px] font-black text-gray-800 shrink-0">{count}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: '#F0F0F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / maxOpens) * 100}%`, background: '#3183F7' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz by domain */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Quiz par domaine</div>
          {quizByDomain.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">Aucun quiz complété.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {quizByDomain.map(({ domain, total, passed, avg, rate }) => (
                <div key={domain} className="p-2.5 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLORS[domain] ?? '#888' }} />
                      <span className="text-[11px] font-semibold text-gray-700">{DOMAIN_LABELS[domain] ?? domain}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{total} quiz</span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span>Réussite : <strong style={{ color: '#36D399' }}>{rate}%</strong></span>
                    <span>Score moyen : <strong style={{ color: '#FFC13D' }}>{avg}%</strong></span>
                    <span>Passés : <strong>{passed}/{total}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Progression chapitres par domaine */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Progression par domaine</div>
          {progressByDomain.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">Aucune donnée.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {progressByDomain.map(({ domain, total, completed, validated }) => (
                <div key={domain}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLORS[domain] ?? '#888' }} />
                      <span className="font-semibold text-gray-700">{DOMAIN_LABELS[domain] ?? domain}</span>
                    </div>
                    <span className="text-gray-400">{completed}/{total} complétés · {validated} validés</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%`, background: DOMAIN_COLORS[domain] ?? '#888' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flags et sauvegarde */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Contenu sauvegardé</div>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: '❤️ Favoris',   key: 'favorite',  color: '#F56751' },
              { label: '🔖 À réviser', key: 'to_review', color: '#FFC13D' },
              { label: '📄 À lire',    key: 'to_read',   color: '#3183F7' },
              { label: '✅ Acquis',    key: 'validated',  color: '#36D399' },
            ].map(({ label, key, color }) => {
              const count = flagsByType[key] ?? 0
              const pct   = totalFlags > 0 ? Math.round((count / totalFlags) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold" style={{ color }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: '#F0F0F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-[11px] font-bold text-gray-700 mb-2">Par domaine</div>
          <div className="flex flex-col gap-1">
            {Object.entries(flagsByDomain).sort((a, b) => b[1] - a[1]).map(([domain, count]) => (
              <div key={domain} className="flex justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: DOMAIN_COLORS[domain] ?? '#888', display: 'inline-block' }} />
                  {DOMAIN_LABELS[domain] ?? domain}
                </span>
                <span className="font-semibold text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
