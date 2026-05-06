import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const DOMAIN_LABEL: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Gestion de projet', ml: 'ML',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'À décider', retained: 'Retenu', rejected: 'Refusé',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#6B7280', retained: '#0d7a56', rejected: '#dc2626',
}

function formatTime(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60
  return m > 0 ? `${m}m${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`
}
function scoreColor(s: number, threshold: number) {
  if (s >= threshold) return '#0d7a56'
  if (s >= threshold * 0.8) return '#b37700'
  return '#dc2626'
}

interface Props { params: Promise<{ id: string }> }

export default async function PipelinePrintPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/rapport/pipeline/${id}`)

  const { data: test } = await supabase
    .from('candidate_tests')
    .select('id, title, domains, question_count, time_limit, pass_score, created_at')
    .eq('id', id)
    .eq('enterprise_id', user.id)
    .single()

  if (!test) notFound()

  const { data: results } = await supabase
    .from('candidate_results')
    .select('id, candidate_name, candidate_email, score, correct_answers, total_questions, time_seconds, completed_at, status, hr_note')
    .eq('test_id', id)
    .order('score', { ascending: false })

  const { data: ep } = await supabase
    .from('enterprise_profiles')
    .select('company_name')
    .eq('id', user.id)
    .maybeSingle()

  const all = results ?? []
  const threshold = test.pass_score ?? 70
  const avg = all.length > 0 ? Math.round(all.reduce((s, r) => s + r.score, 0) / all.length) : null
  const retained = all.filter(r => r.status === 'retained').length
  const rejected = all.filter(r => r.status === 'rejected').length
  const pending  = all.filter(r => r.status === 'pending').length
  const passed   = all.filter(r => r.score >= threshold).length

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111', background: '#fff', minHeight: '100vh' }}>
      <style>{`
        @page { size: A4; margin: 16mm 14mm; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-sizing: border-box; }
        }
        * { box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; }
      `}</style>

      {/* Print bar */}
      <div className="no-print" style={{ background: '#1C1C2E', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#3183F7', fontWeight: 900, fontSize: 14 }}>Spread Finance</span>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>/</span>
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600 }}>Rapport Pipeline — {test.title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/dashboard/entreprise/quiz/${id}`}
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            ← Retour
          </a>
          <button
            onClick={() => window.print()}
            style={{ background: '#3183F7', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            🖨 Imprimer / PDF
          </button>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `document.querySelector('.no-print button').addEventListener('click',()=>window.print())` }} />

      <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
        {/* Report header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 18, borderBottom: '2px solid #1C1C2E' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3183F7', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>
              Spread Finance · Rapport Pipeline RH
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1C1C2E', marginBottom: 5 }}>{test.title}</div>
            <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
              {ep?.company_name && <><strong style={{ color: '#374151' }}>{ep.company_name}</strong> · </>}
              {(test.domains as string[]).map(d => DOMAIN_LABEL[d] ?? d).join(', ')}
              {' · '}{test.question_count} questions
              {test.time_limit ? ` · ${test.time_limit} min` : ''}
              {test.pass_score != null ? ` · Seuil de validation : ${test.pass_score}%` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Généré le</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total candidats', value: all.length,      color: '#1C1C2E' },
            { label: 'À décider',       value: pending,          color: '#6B7280' },
            { label: 'Retenus',         value: retained,         color: '#0d7a56' },
            { label: 'Refusés',         value: rejected,         color: '#dc2626' },
            { label: 'Score moyen',     value: avg != null ? `${avg}%` : '—', color: avg != null ? scoreColor(avg, threshold) : '#9CA3AF' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ border: '1.5px solid #E8E8E8', borderRadius: 10, padding: '12px 14px', background: '#FAFAFA' }}>
              <div style={{ fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.04em', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Pass rate */}
        {all.length > 0 && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#F5F6F8', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Taux de passage (score ≥ {threshold}%)
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: scoreColor(Math.round((passed / all.length) * 100), 50) }}>
                {Math.round((passed / all.length) * 100)}% ({passed}/{all.length} candidats)
              </span>
            </div>
            <div style={{ height: 8, background: '#E8E8E8', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(passed / all.length) * 100}%`, background: '#36D399', borderRadius: 4 }} />
            </div>
          </div>
        )}

        {/* Table */}
        {all.length > 0 ? (
          <table style={{ fontSize: 11 }}>
            <thead>
              <tr>
                {['#', 'Candidat', 'Email', 'Score', 'Réponses', 'Temps', 'Date', 'Statut RH', 'Note'].map(h => (
                  <th key={h} style={{ background: '#F5F6F8', textAlign: h === 'Score' || h === 'Réponses' || h === 'Temps' ? 'center' : 'left', padding: '8px 10px', fontSize: 9, textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, letterSpacing: '.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', color: '#9CA3AF', width: 28 }}>{i + 1}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', fontWeight: 700 }}>{r.candidate_name}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', color: '#6B7280' }}>{r.candidate_email}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', textAlign: 'center', fontWeight: 900, color: scoreColor(r.score, threshold) }}>{r.score}%</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', textAlign: 'center', color: '#6B7280' }}>{r.correct_answers}/{r.total_questions}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', textAlign: 'center', color: '#6B7280' }}>{formatTime(r.time_seconds)}</td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {new Date(r.completed_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0' }}>
                    <span style={{ fontWeight: 700, color: STATUS_COLOR[r.status ?? 'pending'] }}>
                      {STATUS_LABEL[r.status ?? 'pending']}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', borderBottom: '1px solid #F0F0F0', color: '#6B7280', fontStyle: r.hr_note ? 'italic' : 'normal' }}>
                    {r.hr_note ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 13 }}>
            Aucun résultat enregistré pour ce test.
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E8E8E8', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9CA3AF' }}>
          <span>Document confidentiel — usage interne RH</span>
          <span>Spread Finance · spread-finance.fr</span>
        </div>
      </div>
    </div>
  )
}
