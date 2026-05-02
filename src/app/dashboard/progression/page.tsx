import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLevel } from '@/types'
import { getChaptersByDomain } from '@/lib/sanity/client'

export const dynamic = 'force-dynamic'

const DOMAIN_META: Record<string, { name: string; color: string; total: number }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7', total: 8 },
  maths:   { name: 'Mathématiques financières', color: '#A855F7', total: 6 },
  dev:     { name: 'Développement IT',          color: '#1a5fc8', total: 7 },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D', total: 5 },
  ml:      { name: 'Machine Learning',          color: '#F56751', total: 6 },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  in_progress: { label: 'En cours',  color: '#FFC13D', bg: '#FFF8E6' },
  completed:   { label: 'Lu',        color: '#3183F7', bg: '#EBF2FF' },
  validated:   { label: 'Validé',    color: '#36D399', bg: '#E6FAF3' },
}

export default async function ProgressionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [progressRes, xpRes, sanityChapters] = await Promise.all([
    supabase.from('chapter_progress').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('xp_log').select('xp_earned, earned_at, source_type').eq('user_id', user.id).order('earned_at', { ascending: false }),
    getChaptersByDomain().catch(() => []),
  ])

  const progress = progressRes.data ?? []
  const xpLogs   = xpRes.data ?? []
  const chapterTitleMap = new Map(
    ((sanityChapters ?? []) as Array<{ slug: string; title: string }>).map(c => [c.slug, c.title])
  )
  const totalXp  = xpLogs.reduce((s, x) => s + x.xp_earned, 0)
  const { level, title: levelTitle, nextLevelXp, currentLevelXp } = getLevel(totalXp)
  const xpPct = Math.min(100, Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))

  const domainStats = Object.entries(DOMAIN_META).map(([slug, meta]) => {
    const dp = progress.filter(p => p.domain_slug === slug)
    return {
      slug, ...meta,
      seen:      dp.filter(p => p.status !== 'not_started').length,
      completed: dp.filter(p => p.status === 'completed' || p.status === 'validated').length,
      validated: dp.filter(p => p.status === 'validated').length,
      pct:       meta.total > 0 ? Math.round((dp.filter(p => p.status === 'validated').length / meta.total) * 100) : 0,
    }
  })

  const recentProgress = progress
    .filter(p => p.status !== 'not_started' && chapterTitleMap.has(p.chapter_slug))
    .slice(0, 10)

  return (
    <div className="p-5">
      <div className="text-sm font-black text-gray-800 mb-5">Ma progression</div>

      {/* XP + Niveau */}
      <div className="rounded-xl p-5 mb-4 flex items-center gap-5" style={{ background: '#1C1C2E' }}>
        <div>
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">Niveau actuel</div>
          <div className="text-2xl font-black text-white">{level}</div>
          <div className="text-xs text-blue-400 font-bold">{levelTitle}</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
            <span>{totalXp.toLocaleString()} XP</span>
            <span>{nextLevelXp.toLocaleString()} XP</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${xpPct}%`, background: '#3183F7' }} />
          </div>
          <div className="text-[10px] text-white/30 mt-1.5">{xpPct}% vers le niveau {level + 1}</div>
        </div>
      </div>

      {/* Progression par domaine */}
      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-800 mb-4">Par domaine</div>
        <div className="flex flex-col gap-4">
          {domainStats.map(d => (
            <div key={d.slug}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{d.seen} vus</span>
                  <span className="font-bold" style={{ color: d.color }}>{d.validated}/{d.total} validés</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${d.pct}%`, background: d.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapitres récents */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-800">Chapitres récents</span>
          <Link href="/documentation" className="text-xs font-semibold" style={{ color: '#3183F7' }}>
            Voir tout →
          </Link>
        </div>

        {recentProgress.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-gray-400 mb-3">Aucun chapitre commencé</p>
            <Link
              href="/documentation"
              className="text-xs font-bold text-white px-4 py-2 rounded-xl"
              style={{ background: '#3183F7' }}
            >
              Commencer →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentProgress.map(p => {
              const meta   = STATUS_META[p.status]
              const domain = DOMAIN_META[p.domain_slug]
              return (
                <Link
                  key={p.id}
                  href={`/documentation/${p.chapter_slug}`}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain?.color ?? '#888' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{chapterTitleMap.get(p.chapter_slug) ?? p.chapter_slug}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {domain?.name} · {new Date(p.updated_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {meta && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  )}
                  {p.scroll_percent > 0 && p.status === 'in_progress' && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{p.scroll_percent}%</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
