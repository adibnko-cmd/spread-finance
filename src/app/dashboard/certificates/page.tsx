import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CertificateDownloadButton } from './CertificateDownloadButton'

export const metadata: Metadata = { title: 'Certificats — Spread Finance' }
export const dynamic = 'force-dynamic'

const DOMAIN_TOTALS: Record<string, number> = { finance: 8, maths: 6, dev: 7, pm: 5, ml: 6 }
const DOMAIN_NAMES:  Record<string, string>  = {
  finance: 'Finance de marché', maths: 'Maths financières',
  dev: 'Développement IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}
const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const TOTAL_CHAPTERS = Object.values(DOMAIN_TOTALS).reduce((s, n) => s + n, 0) // 32

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/certificates')

  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase.from('chapter_progress').select('domain_slug, status').eq('user_id', user.id),
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
  ])
  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Certifié'

  const validated = (progress ?? []).filter(p => p.status === 'validated')
  const totalValidated = validated.length
  const globalPct = Math.round((totalValidated / TOTAL_CHAPTERS) * 100)
  const certUnlocked = globalPct >= 80

  const domainProgress = Object.entries(DOMAIN_TOTALS).map(([slug, total]) => {
    const done = validated.filter(p => p.domain_slug === slug).length
    return { slug, name: DOMAIN_NAMES[slug], color: DOMAIN_COLORS[slug], total, done, pct: Math.round((done / total) * 100) }
  })

  return (
    <div className="p-5 max-w-2xl">
      <div className="mb-6">
        <div className="text-sm font-black text-gray-800 mb-1">Mes certificats</div>
        <div className="text-xs text-gray-400">Validez les parcours pour débloquer vos certifications.</div>
      </div>

      {/* ── Certificat principal ── */}
      <div
        className="rounded-2xl p-6 mb-5 relative overflow-hidden"
        style={{
          background: certUnlocked ? 'linear-gradient(135deg, #1C1C2E 0%, #0d1b3e 100%)' : '#F7F8FA',
          border: certUnlocked ? '2px solid rgba(49,131,247,.4)' : '1.5px solid #E8E8E8',
        }}
      >
        {certUnlocked && (
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#3183F7', transform: 'translate(30%, -30%)' }} />
        )}

        <div className="flex items-start gap-5">
          {/* Badge */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{
              background: certUnlocked ? 'rgba(49,131,247,.2)' : '#EBEBEB',
              border: certUnlocked ? '2px solid rgba(49,131,247,.4)' : '2px solid #E0E0E0',
              filter: certUnlocked ? 'none' : 'grayscale(1)',
            }}
          >
            🏆
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: certUnlocked ? 'rgba(49,131,247,.2)' : '#EBEBEB',
                  color: certUnlocked ? '#7BB3F7' : '#aaa',
                }}
              >
                {certUnlocked ? '✓ Obtenu' : `${globalPct}% — En cours`}
              </span>
            </div>

            <div
              className="text-base font-black mb-1"
              style={{ color: certUnlocked ? '#fff' : '#333' }}
            >
              Certified Spread Finance Professional
            </div>
            <div
              className="text-xs mb-4 leading-relaxed"
              style={{ color: certUnlocked ? 'rgba(255,255,255,.5)' : '#888' }}
            >
              Maîtrise validée sur l'ensemble des 5 domaines : Finance, Maths, Dev, PM et ML.
              Requiert 80% des chapitres validés sur la plateforme.
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: certUnlocked ? 'rgba(255,255,255,.4)' : '#aaa' }}>
                  Progression globale
                </span>
                <span className="text-[10px] font-black" style={{ color: certUnlocked ? '#3183F7' : '#555' }}>
                  {totalValidated} / {TOTAL_CHAPTERS} chapitres
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: certUnlocked ? 'rgba(255,255,255,.1)' : '#E8E8E8' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, globalPct)}%`, background: certUnlocked ? '#3183F7' : '#CBD5E1' }}
                />
              </div>
            </div>

            {/* CTA */}
            {certUnlocked ? (
              <CertificateDownloadButton
                userName={userName}
                domains={domainProgress.filter(d => d.done > 0).map(d => d.name.split(' ')[0])}
              />
            ) : (
              <div className="text-[11px]" style={{ color: '#9CA3AF' }}>
                Il vous reste <strong style={{ color: '#555' }}>{TOTAL_CHAPTERS - totalValidated} chapitres</strong> à valider pour obtenir ce certificat.
              </div>
            )}
          </div>
        </div>

        {/* Domain breakdown */}
        <div className="mt-5 pt-4" style={{ borderTop: certUnlocked ? '1px solid rgba(255,255,255,.08)' : '1px solid #EBEBEB' }}>
          <div className="grid grid-cols-5 gap-3">
            {domainProgress.map(d => (
              <div key={d.slug} className="text-center">
                <div
                  className="w-full h-1.5 rounded-full mb-1.5 overflow-hidden"
                  style={{ background: certUnlocked ? 'rgba(255,255,255,.1)' : '#EBEBEB' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.pct}%`, background: d.color }}
                  />
                </div>
                <div className="text-[9px] font-bold" style={{ color: certUnlocked ? 'rgba(255,255,255,.4)' : '#aaa' }}>
                  {d.name.split(' ')[0]}
                </div>
                <div className="text-[9px] font-black" style={{ color: certUnlocked ? d.color : '#555' }}>
                  {d.done}/{d.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Future certs ── */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prochainement</div>
        <div className="flex flex-col gap-3">
          {[
            { title: 'Finance de marché — Expert', desc: 'Maîtrise complète du domaine Finance (évaluations + quiz avancés).', emoji: '📈', color: '#3183F7' },
            { title: 'Quant Developer', desc: 'Validation croisée Maths + Dev + ML.', emoji: '⚙️', color: '#A855F7' },
            { title: 'Project Manager Finance', desc: 'Certification PM avec mise en situation.', emoji: '📋', color: '#FFC13D' },
          ].map(({ title, desc, emoji, color }) => (
            <div key={title} className="flex items-center gap-4 p-4 rounded-xl bg-white" style={{ border: '1.5px solid #E8E8E8', opacity: 0.6 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}12`, filter: 'grayscale(1)' }}>
                {emoji}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600">{title}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#FFF8E6', color: '#b37700' }}>
                Bientôt
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
