import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const DOMAIN_LABEL: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Gestion de projet', ml: 'ML',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'À décider', retained: 'Retenu ✓', rejected: 'Refusé ✗',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#6B7280', retained: '#0d7a56', rejected: '#dc2626',
}
const STATUS_BG: Record<string, string> = {
  pending: '#F9FAFB', retained: '#E6FAF3', rejected: '#FEF2F0',
}

function formatTime(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60
  return m > 0 ? `${m} min${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`
}
function scoreColor(s: number, threshold: number) {
  if (s >= threshold) return '#0d7a56'
  if (s >= threshold * 0.8) return '#b37700'
  return '#dc2626'
}

interface Props { params: Promise<{ resultId: string }> }

export default async function CandidatPrintPage({ params }: Props) {
  const { resultId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/rapport/candidat/${resultId}`)

  const { data: result } = await supabase
    .from('candidate_results')
    .select('id, candidate_name, candidate_email, score, correct_answers, total_questions, time_seconds, completed_at, status, hr_note, test_id')
    .eq('id', resultId)
    .single()

  if (!result) notFound()

  const { data: test } = await supabase
    .from('candidate_tests')
    .select('id, title, domains, question_count, time_limit, pass_score, enterprise_id')
    .eq('id', result.test_id)
    .eq('enterprise_id', user.id)
    .single()

  if (!test) notFound()

  const { data: ep } = await supabase
    .from('enterprise_profiles')
    .select('company_name')
    .eq('id', user.id)
    .maybeSingle()

  const threshold = test.pass_score ?? 70
  const passed = result.score >= threshold
  const pct = Math.round((result.correct_answers / result.total_questions) * 100)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111', background: '#fff', minHeight: '100vh' }}>
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Print bar */}
      <div className="no-print" style={{ background: '#1C1C2E', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#3183F7', fontWeight: 900, fontSize: 14 }}>Spread Finance</span>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>/</span>
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600 }}>
            Rapport candidat — {result.candidate_name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/dashboard/entreprise/quiz/${test.id}`}
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

      <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 18, borderBottom: '2px solid #1C1C2E' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3183F7', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>
              Spread Finance · Rapport Candidat RH
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1C1C2E', marginBottom: 4 }}>{result.candidate_name}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{result.candidate_email}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Généré le</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {ep?.company_name && (
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{ep.company_name}</div>
            )}
          </div>
        </div>

        {/* Test info */}
        <div style={{ marginBottom: 24, padding: '14px 16px', background: '#F5F6F8', borderRadius: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Test passé</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C2E', marginBottom: 4 }}>{test.title}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            {(test.domains as string[]).map(d => DOMAIN_LABEL[d] ?? d).join(', ')}
            {' · '}{test.question_count} questions
            {test.time_limit ? ` · ${test.time_limit} min` : ''}
            {test.pass_score != null ? ` · Seuil : ${test.pass_score}%` : ''}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
            Passé le {new Date(result.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Score + decision */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Score */}
          <div style={{ border: '1.5px solid #E8E8E8', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Score obtenu</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(result.score, threshold), lineHeight: 1 }}>{result.score}%</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>{result.correct_answers} / {result.total_questions} bonnes réponses</div>
            {/* Score bar */}
            <div style={{ marginTop: 12, height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor(result.score, threshold), borderRadius: 3 }} />
            </div>
            {test.pass_score != null && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ fontSize: 8, color: '#9CA3AF' }}>seuil {test.pass_score}%</span>
              </div>
            )}
          </div>

          {/* Verdict */}
          <div style={{ border: `1.5px solid ${passed ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 14, padding: '20px 24px', textAlign: 'center', background: passed ? '#E6FAF3' : '#FEF2F0' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Résultat</div>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{passed ? '✓' : '✗'}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: passed ? '#0d7a56' : '#dc2626', marginBottom: 4 }}>
              {passed ? 'Seuil atteint' : 'Seuil non atteint'}
            </div>
            {test.pass_score != null && (
              <div style={{ fontSize: 10, color: '#6B7280' }}>{test.pass_score}% requis · {result.score}% obtenu</div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Temps de passage', value: formatTime(result.time_seconds) },
            { label: 'Taux de réussite', value: `${pct}%` },
            { label: 'Questions', value: `${result.correct_answers}/${result.total_questions}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ border: '1.5px solid #E8E8E8', borderRadius: 10, padding: '12px 14px', background: '#FAFAFA' }}>
              <div style={{ fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.04em', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1C1C2E' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* HR decision */}
        <div style={{ marginBottom: 24, border: `1.5px solid ${STATUS_BG[result.status ?? 'pending'] === '#F9FAFB' ? '#E5E7EB' : STATUS_COLOR[result.status ?? 'pending'] + '40'}`, borderRadius: 12, padding: '16px 20px', background: STATUS_BG[result.status ?? 'pending'] }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Décision RH</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: STATUS_COLOR[result.status ?? 'pending'] }}>
            {STATUS_LABEL[result.status ?? 'pending']}
          </div>
        </div>

        {/* HR note */}
        {result.hr_note && (
          <div style={{ marginBottom: 24, border: '1.5px solid #E8E8E8', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Note RH interne</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>{result.hr_note}</div>
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
