import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  feature:     { label: 'Nouvelle fonctionnalité', color: '#3183F7', bg: '#EBF2FF' },
  content:     { label: 'Nouveau contenu',          color: '#A855F7', bg: '#F5F0FF' },
  event:       { label: 'Événement',                color: '#FFC13D', bg: '#FFF8E6' },
  maintenance: { label: 'Maintenance',              color: '#F56751', bg: '#FEF2F0' },
  general:     { label: 'Annonce',                  color: '#6B7280', bg: '#F5F6F8' },
}

function timeLabel(dateStr: string): string {
  const d    = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  if (days < 7)  return `Il y a ${days} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/news')

  const { data: items } = await supabase
    .from('platform_news')
    .select('id, title, content, type, link, emoji, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(30)

  const news = items ?? []

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-black text-gray-800">Actualités plateforme</div>
          <div className="text-xs text-gray-400 mt-0.5">Nouveautés, mises à jour et événements.</div>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-2">📬</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucune actualité pour l&apos;instant</div>
          <div className="text-xs text-gray-400">Les prochaines nouveautés apparaîtront ici.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {news.map(item => {
            const meta = TYPE_META[item.type] ?? TYPE_META.general
            const date = item.published_at ?? item.created_at
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: meta.bg }}
                  >
                    {item.emoji ?? '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{timeLabel(date)}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-800 mb-1">{item.title}</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ color: meta.color }}
                      >
                        En savoir plus
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M3 7l4-4M7 7V3H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
