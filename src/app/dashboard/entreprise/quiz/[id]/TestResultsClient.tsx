'use client'

import { useState } from 'react'
import Link from 'next/link'

const DOMAIN_COLOR: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_LABEL: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev', pm: 'PM', ml: 'ML',
}

interface TestData {
  id: string; title: string; description: string | null
  domains: string[]; question_count: number; time_limit: number | null
  is_active: boolean; created_at: string; token: string
}
interface Result {
  id: string; candidate_name: string; candidate_email: string
  score: number; correct_answers: number; total_questions: number
  time_seconds: number; completed_at: string
}
interface Stats { avg: number | null; passRate: number | null; total: number }

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function scoreColor(s: number): string {
  if (s >= 80) return '#36D399'
  if (s >= 60) return '#FFC13D'
  return '#F56751'
}

export function TestResultsClient({ test, results, stats }: { test: TestData; results: Result[]; stats: Stats }) {
  const [copied, setCopied] = useState(false)
  const [search, setSearch]  = useState('')

  const testUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/candidat/${test.token}`
    : `/candidat/${test.token}`

  async function copyLink() {
    await navigator.clipboard.writeText(testUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function exportCSV() {
    const rows = [
      ['Candidat', 'Email', 'Score', 'Bonnes réponses', 'Total', 'Temps', 'Date'],
      ...results.map(r => [
        r.candidate_name, r.candidate_email, `${r.score}%`,
        r.correct_answers, r.total_questions, formatTime(r.time_seconds), formatDate(r.completed_at),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `resultats-${test.title.replace(/\s+/g, '_')}.csv`
    a.click()
  }

  const filtered = results.filter(r =>
    r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    r.candidate_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/dashboard/entreprise/quiz"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Mes tests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-black text-gray-900 mb-1">{test.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {test.domains.map(d => (
              <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${DOMAIN_COLOR[d] ?? '#6B7280'}18`, color: DOMAIN_COLOR[d] ?? '#6B7280' }}>
                {DOMAIN_LABEL[d] ?? d}
              </span>
            ))}
            <span className="text-[10px] text-gray-400">{test.question_count} questions</span>
            {test.time_limit && <span className="text-[10px] text-gray-400">· {test.time_limit} min</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: copied ? '#E6FAF3' : '#EBF2FF', color: copied ? '#0d7a56' : '#3183F7' }}>
            {copied ? '✓ Copié' : '🔗 Copier le lien'}
          </button>
          {results.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#F5F6F8', color: '#374151' }}>
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Candidats', value: stats.total, suffix: '', color: '#1C1C2E' },
          { label: 'Score moyen', value: stats.avg ?? '—', suffix: stats.avg != null ? '%' : '', color: stats.avg != null ? scoreColor(stats.avg) : '#9CA3AF' },
          { label: 'Taux de réussite', value: stats.passRate ?? '—', suffix: stats.passRate != null ? '%' : '', color: stats.passRate != null ? scoreColor(stats.passRate) : '#9CA3AF' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] text-gray-400 mb-1">{label}</div>
            <div className="text-3xl font-black" style={{ color }}>{value}{suffix}</div>
            {label === 'Taux de réussite' && <div className="text-[10px] text-gray-400 mt-1">seuil : 70%</div>}
          </div>
        ))}
      </div>

      {/* Results table */}
      {results.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">📭</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucun résultat</div>
          <div className="text-xs text-gray-400 mb-4">Partagez le lien ci-dessus aux candidats pour recevoir leurs résultats.</div>
          <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl px-4 py-3" style={{ border: '1px solid #E8E8E8' }}>
            <code className="text-xs text-gray-500">{testUrl}</code>
            <button onClick={copyLink} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex-shrink-0">
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {results.length > 5 && (
            <div className="mb-3">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un candidat…"
                className="w-full max-w-xs px-3 py-2 rounded-xl text-sm text-gray-800 bg-white outline-none"
                style={{ border: '1.5px solid #E8E8E8' }}
              />
            </div>
          )}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F0F1F3' }}>
                  {['Candidat', 'Email', 'Score', 'Résultat', 'Temps', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F5F6F8' }}>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-800">{r.candidate_name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{r.candidate_email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-black" style={{ color: scoreColor(r.score) }}>{r.score}%</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">{r.correct_answers}/{r.total_questions}</span>
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColor(r.score) }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{formatTime(r.time_seconds)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(r.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
